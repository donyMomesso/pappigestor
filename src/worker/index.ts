// src/worker/index.ts
import { Hono } from "hono";
import { Buffer } from "node:buffer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cors } from "hono/cors";

// ============================================================================
// 1. TIPAGENS DO SISTEMA
// Mantemos compatível com Cloudflare D1 usando 'any'.
// ============================================================================

interface Bindings {
  DB: any;
  GOOGLE_AI_API_KEY: string;
}

type Variables = {
  // ✅ no código a gente trata como EMPRESA (tenant)
  // mas mantém fallback para quem ainda manda x-pizzaria-id
  empresaId: string;

  // info do usuário logado (para segurança real)
  userRole?: string; // master | admin | comum (ou o que estiver no banco)
  userEmail?: string;
  userPermissions?: string; // JSON string: '["estoque","financeiro"]'
};

// Inicialização da Aplicação Hono
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// 2. CONFIGURAÇÕES GLOBAIS E MIDDLEWARES
// ============================================================================

// Libera o CORS
app.use("*", cors());

// Middleware Multi-tenant (Isolamento por EMPRESA)
// Regras:
// - Rotas públicas passam
// - Qualquer /api/* exige x-empresa-id (ou fallback x-pizzaria-id)
// - E exige x-user-email
// - E valida vínculo (email ↔ empresa) em perfis_usuarios
app.use("/api/*", async (c, next) => {
  // Rotas públicas
  if (
    c.req.path.includes("/auth/login") ||
    c.req.path.includes("/empresas/minhas")
  ) {
    return await next();
  }

  // ✅ padrão novo + fallback legado
  const empresaId =
    c.req.header("x-empresa-id")?.trim() ||
    c.req.header("x-pizzaria-id")?.trim();

  const userEmail = c.req.header("x-user-email")?.trim().toLowerCase();

  if (!empresaId) {
    return c.json(
      { error: "Acesso negado: empresa_id ausente no cabeçalho (x-empresa-id)." },
      401
    );
  }

  if (!userEmail) {
    return c.json(
      { error: "Acesso negado: usuário não identificado (x-user-email)." },
      401
    );
  }

  // ✅ Verifica se o usuário pertence à empresa (segurança real)
  const link = await c.env.DB.prepare(
    `
    SELECT id, funcao, permissoes, status
    FROM perfis_usuarios
    WHERE pizzaria_id = ? AND LOWER(email) = LOWER(?) AND status = 'ativo'
    LIMIT 1
  `
  )
    .bind(empresaId, userEmail)
    .first();

  if (!link) {
    return c.json(
      { error: "Acesso negado: usuário não pertence a esta empresa." },
      403
    );
  }

  // Injeta no contexto
  c.set("empresaId", empresaId);
  c.set("userRole", (link as any).funcao || "comum");
  c.set("userEmail", userEmail);
  c.set("userPermissions", (link as any).permissoes || "[]");

  await next();
});

// ============================================================================
// 2.1 HELPERS DE PERMISSÃO / ROLE
// ============================================================================

function parsePermissions(raw: any): string[] {
  try {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    return JSON.parse(String(raw));
  } catch {
    return [];
  }
}

function requireRole(allowed: string[]) {
  return async (c: any, next: any) => {
    const role = String(c.get("userRole") || "comum").trim();
    if (!allowed.includes(role)) {
      return c.json({ error: "Sem permissão (role).", role }, 403);
    }
    await next();
  };
}

function requirePerm(permission: string) {
  return async (c: any, next: any) => {
    const perms = parsePermissions(c.get("userPermissions"));
    if (!perms.includes(permission)) {
      return c.json({ error: "Sem permissão (permission).", permission }, 403);
    }
    await next();
  };
}

// ============================================================================
// 3. MÓDULO DE AUTENTICAÇÃO E EMPRESAS
// ============================================================================

/**
 * Rota: POST /api/empresas/minhas
 * Objetivo: Listar todas as empresas vinculadas ao email do usuário logado.
 * Observação: Banco ainda usa tabelas/colunas com nome "pizzarias/pizzaria_id".
 */
app.post("/api/empresas/minhas", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as any;
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return c.json({ error: "Email é obrigatório." }, 400);
    }

    const { results } = await c.env.DB.prepare(
      `
      SELECT
        p.id,
        p.nome,
        p.plano,
        p.status
      FROM perfis_usuarios u
      JOIN pizzarias p ON u.pizzaria_id = p.id
      WHERE LOWER(u.email) = LOWER(?) AND u.status = 'ativo'
      ORDER BY p.nome ASC
    `
    )
      .bind(email)
      .all();

    return c.json({ empresas: results ?? [] });
  } catch (e: any) {
    return c.json(
      { error: "Erro ao listar unidades associadas.", details: e?.message },
      500
    );
  }
});

/**
 * Rota: POST /api/auth/login
 * Objetivo: Validar o acesso de um usuário a uma empresa específica.
 */
app.post("/api/auth/login", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as any;
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) return c.json({ error: "Email é obrigatório." }, 400);

    const user = await c.env.DB.prepare(
      `
      SELECT 
        u.pizzaria_id, 
        u.funcao, 
        u.nome, 
        p.status as p_status
      FROM perfis_usuarios u
      JOIN pizzarias p ON u.pizzaria_id = p.id
      WHERE LOWER(u.email) = LOWER(?) AND u.status = 'ativo'
      LIMIT 1
    `
    )
      .bind(email)
      .first();

    if (!user || (user as any).p_status !== "ativo") {
      return c.json({ error: "Acesso negado ou conta inativa." }, 403);
    }

    // ✅ resposta mantém compatibilidade, mas você pode consumir como "empresa_id" no front
    return c.json({
      empresa_id: (user as any).pizzaria_id,
      role: (user as any).funcao,
      nome: (user as any).nome,
    });
  } catch (e: any) {
    return c.json({ error: "Erro interno durante o login." }, 500);
  }
});

// ============================================================================
// 4. MÓDULO DE ADMINISTRAÇÃO E EQUIPE (USUÁRIOS)
// ============================================================================

/**
 * Rota: GET /api/admin/usuarios
 * Objetivo: Listar a equipe da empresa respeitando a hierarquia.
 * Segurança: só master/admin (ajuste se quiser)
 */
app.get("/api/admin/usuarios", requireRole(["master", "admin"]), async (c) => {
  const empresaId = c.get("empresaId");

  try {
    const { results } = await c.env.DB.prepare(
      `
      SELECT 
        id, 
        nome, 
        email, 
        funcao, 
        cargo
      FROM perfis_usuarios
      WHERE pizzaria_id = ?
      ORDER BY
        CASE WHEN funcao = 'master' THEN 0 ELSE 1 END,
        nome ASC
    `
    )
      .bind(empresaId)
      .all();

    // limite exemplo (mantive igual o seu)
    const limite = 3;
    const usado = Array.isArray(results) ? results.length : 0;

    return c.json({
      usuarios: results ?? [],
      plano: { nome: "grátis", limite, usado },
    });
  } catch (e: any) {
    return c.json(
      { error: "Erro ao listar membros da equipe.", details: e?.message ?? String(e) },
      500
    );
  }
});

/**
 * Rota: POST /api/admin/usuarios
 * Objetivo: Adicionar membro / reativar, validando limites de plano.
 * Segurança: só master/admin
 */
app.post("/api/admin/usuarios", requireRole(["master", "admin"]), async (c) => {
  const empresaId = c.get("empresaId");

  try {
    const body = (await c.req.json().catch(() => ({}))) as any;
    const email = String(body?.email ?? "").trim().toLowerCase();
    const cargo = String(body?.cargo ?? "Operador").trim();

    if (!email) return c.json({ error: "Email é obrigatório para cadastro." }, 400);

    // Validação do Limite de Usuários do Plano (mantido)
    const limite = 3;

    const countRow = await c.env.DB.prepare(
      `
      SELECT COUNT(*) as total 
      FROM perfis_usuarios 
      WHERE pizzaria_id = ? AND status = 'ativo'
    `
    )
      .bind(empresaId)
      .first();

    const total = Number((countRow as any)?.total ?? 0);
    if (total >= limite) {
      return c.json(
        {
          error: `Limite do plano atingido (${total}/${limite}). Faça upgrade para adicionar mais usuários.`,
        },
        403
      );
    }

    // Verifica se o usuário já existe
    const existing = await c.env.DB.prepare(
      `
      SELECT id 
      FROM perfis_usuarios 
      WHERE pizzaria_id = ? AND LOWER(email) = LOWER(?) LIMIT 1
    `
    )
      .bind(empresaId, email)
      .first();

    if (existing) {
      // Reativa e atualiza cargo
      await c.env.DB.prepare(
        `
        UPDATE perfis_usuarios 
        SET cargo = ?, status = 'ativo' 
        WHERE id = ?
      `
      )
        .bind(cargo, (existing as any).id)
        .run();

      return c.json({ success: true, updated: true });
    }

    // Criação de convite/usuário
    await c.env.DB.prepare(
      `
      INSERT INTO perfis_usuarios (pizzaria_id, nome, email, funcao, cargo, status)
      VALUES (?, NULL, ?, 'comum', ?, 'ativo')
    `
    )
      .bind(empresaId, email, cargo)
      .run();

    return c.json({ success: true, created: true });
  } catch (e: any) {
    return c.json(
      { error: "Erro ao associar novo usuário.", details: e?.message ?? String(e) },
      500
    );
  }
});

/**
 * Rota: DELETE /api/admin/usuarios/:id
 * Objetivo: Remover usuário (Master não pode ser removido).
 * Segurança: só master
 */
app.delete(
  "/api/admin/usuarios/:id",
  requireRole(["master"]),
  async (c) => {
    const empresaId = c.get("empresaId");
    const id = Number(c.req.param("id"));

    if (!id) return c.json({ error: "ID de usuário inválido." }, 400);

    try {
      const row = await c.env.DB.prepare(
        `
        SELECT funcao 
        FROM perfis_usuarios 
        WHERE id = ? AND pizzaria_id = ? LIMIT 1
      `
      )
        .bind(id, empresaId)
        .first();

      if (!row)
        return c.json({ error: "Usuário não encontrado nesta unidade." }, 404);

      if ((row as any).funcao === "master") {
        return c.json(
          { error: "Segurança: Não é permitido remover o usuário administrador (Master)." },
          403
        );
      }

      await c.env.DB.prepare(
        `
        DELETE FROM perfis_usuarios 
        WHERE id = ? AND pizzaria_id = ?
      `
      )
        .bind(id, empresaId)
        .run();

      return c.json({ success: true, message: "Usuário removido com sucesso." });
    } catch (e: any) {
      return c.json(
        {
          error: "Erro ao tentar remover o usuário da base de dados.",
          details: e?.message ?? String(e),
        },
        500
      );
    }
  }
);

// ============================================================================
// 5. MÓDULO DE IA E CAIXA DE ENTRADA (NOTAS FISCAIS)
// ============================================================================

/**
 * Rota: POST /api/ia/ler-nota
 */
app.post("/api/ia/ler-nota", async (c) => {
  const empresaId = c.get("empresaId");

  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      return c.json(
        { error: "Documento não encontrado. Por favor, anexe o arquivo." },
        400
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    const genAI = new GoogleGenerativeAI(c.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Você é um assistente especialista em compras e estoque de food service.
Analise este documento (Nota Fiscal / Pedido / Orçamento).
Retorne APENAS um JSON estrito, sem markdown.

REGRAS:
1) Use ponto como decimal.
2) preco_un = preço unitário (kg/unidade/caixa conforme descrito).
3) qtd = quantidade numérica comprada.
4) Produto deve ser nome do item como aparece no documento.

Formato:
{
  "fornecedor": "Nome da Empresa Fornecedora",
  "total": 123.45,
  "itens": [
    {"produto": "Nome exato do insumo", "qtd": 1, "preco_un": 10.00}
  ]
}
`.trim();

    const mimeType = file.type || "application/pdf";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } },
    ]);

    const cleanJson = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const responseIA = JSON.parse(cleanJson);

    // Grava na Caixa de Entrada
    await c.env.DB.prepare(
      `
      INSERT INTO caixa_entrada (
        pizzaria_id,
        fornecedor_nome,
        valor_total,
        json_extraido,
        status,
        criado_em
      ) VALUES (?, ?, ?, ?, 'pendente', CURRENT_TIMESTAMP)
    `
    )
      .bind(
        empresaId,
        responseIA.fornecedor,
        responseIA.total,
        JSON.stringify(responseIA.itens)
      )
      .run();

    return c.json({
      success: true,
      message: "Nota processada com sucesso via IA!",
      data: responseIA,
    });
  } catch (e: any) {
    console.error("Erro na leitura de nota via IA:", e);
    return c.json(
      { error: "Falha interna ao processar a nota fiscal pela IA." },
      500
    );
  }
});

/**
 * Rota: POST /api/ia/ler-link
 */
app.post("/api/ia/ler-link", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as any;
    const url = String(body?.url ?? "").trim();
    if (!url) return c.json({ error: "Nenhum link fornecido para análise." }, 400);

    const sefazResponse = await fetch(url);
    const htmlContent = await sefazResponse.text();

    const genAI = new GoogleGenerativeAI(c.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Abaixo está o HTML de uma NFC-e.
Extraia e retorne APENAS um JSON estrito (sem markdown):
{ 
  "fornecedor": "Nome da Empresa Emissora", 
  "total": 123.45, 
  "itens": [ {"produto": "Nome do Produto", "qtd": 1, "preco_un": 10.00} ] 
}

HTML:
${htmlContent.substring(0, 35000)}
`.trim();

    const result = await model.generateContent(prompt);
    const cleanJson = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return c.json({ success: true, data: JSON.parse(cleanJson) });
  } catch (e: any) {
    return c.json({ error: "Falha de comunicação com o portal da Sefaz." }, 500);
  }
});

/**
 * Rota: POST /api/ia/interpretar-lista
 */
app.post("/api/ia/interpretar-lista", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as any;
    const texto = String(body?.texto ?? "").trim();
    if (!texto) return c.json({ error: "O texto da lista não pode estar vazio." }, 400);

    const genAI = new GoogleGenerativeAI(c.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
O texto a seguir é uma lista de compras ditada.
Extraia itens com quantidade e unidade (un, kg, g, L, ml, cx, pct).
Retorne APENAS JSON estrito:
{ "itens": [ {"produto":"...", "quantidade": 2, "unidade":"kg"} ] }
Texto: "${texto}"
`.trim();

    const result = await model.generateContent(prompt);
    const cleanJson = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return c.json(JSON.parse(cleanJson));
  } catch (e: any) {
    return c.json(
      { error: "O modelo de IA não conseguiu interpretar o formato do texto." },
      500
    );
  }
});

/**
 * Rotas de Inbox
 */
app.get("/api/ia/inbox-count", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const row = await c.env.DB.prepare(
      `
      SELECT COUNT(*) as total 
      FROM caixa_entrada 
      WHERE pizzaria_id = ? AND status = 'pendente'
    `
    )
      .bind(empresaId)
      .first();

    return c.json({ count: Number((row as any)?.total ?? 0) });
  } catch {
    return c.json({ count: 0 });
  }
});

app.get("/api/ia/inbox", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const { results } = await c.env.DB.prepare(
      `
      SELECT * FROM caixa_entrada 
      WHERE pizzaria_id = ? AND status = 'pendente' 
      ORDER BY criado_em DESC
    `
    )
      .bind(empresaId)
      .all();

    const formatted = (results ?? []).map((row: any) => ({
      ...row,
      json_extraido:
        typeof row.json_extraido === "string" ? JSON.parse(row.json_extraido) : row.json_extraido,
    }));

    return c.json(formatted);
  } catch {
    return c.json({ error: "Erro crítico ao listar documentos da caixa de entrada." }, 500);
  }
});

app.post("/api/ia/inbox/approve", async (c) => {
  const empresaId = c.get("empresaId");

  try {
    const body = (await c.req.json().catch(() => ({}))) as any;
    const id = body?.id;
    const json_extraido = body?.json_extraido;

    await c.env.DB.prepare(
      `
      UPDATE caixa_entrada 
      SET status = 'aprovado' 
      WHERE id = ? AND pizzaria_id = ?
    `
    )
      .bind(id, empresaId)
      .run();

    const itens = typeof json_extraido === "string" ? JSON.parse(json_extraido) : json_extraido;

    if (Array.isArray(itens)) {
      for (const item of itens) {
        await c.env.DB.prepare(
          `
          INSERT INTO estoque (pizzaria_id, nome_produto, quantidade) 
          VALUES (?, ?, ?)
          ON CONFLICT(nome_produto) DO UPDATE 
          SET quantidade = estoque.quantidade + excluded.quantidade, 
              ultima_atualizacao = CURRENT_TIMESTAMP
        `
        )
          .bind(empresaId, item.produto, item.qtd || 1)
          .run()
          .catch(() => {
            console.error("Falha ao registrar item no estoque:", item?.produto);
          });
      }
    }

    return c.json({ success: true, message: "Nota Fiscal lançada no sistema!" });
  } catch {
    return c.json({ error: "Ocorreu uma falha grave durante o processo de aprovação." }, 500);
  }
});

// ============================================================================
// 6. MÓDULO DE FORNECEDORES
// ============================================================================

app.get("/api/fornecedores", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const { results } = await c.env.DB.prepare(
      `
      SELECT * FROM fornecedores 
      WHERE pizzaria_id = ? 
      ORDER BY nome_fantasia ASC
    `
    )
      .bind(empresaId)
      .all();

    return c.json(results);
  } catch {
    return c.json({ error: "Erro ao buscar a lista de fornecedores da base." }, 500);
  }
});

app.post("/api/fornecedores", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const data = await c.req.json();

    await c.env.DB.prepare(
      `
      INSERT INTO fornecedores (
        pizzaria_id, 
        nome_fantasia, 
        razao_social, 
        cnpj, 
        telefone_whatsapp, 
        categoria_principal, 
        mensagem_padrao_cotacao, 
        prazo_pagamento_dias, 
        email, 
        nome_contato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        empresaId,
        data.nome_fantasia,
        data.razao_social || null,
        data.cnpj || null,
        data.telefone_whatsapp || null,
        data.categoria_principal || "Geral",
        data.mensagem_padrao_cotacao || null,
        data.prazo_pagamento_dias || 0,
        data.email || null,
        data.nome_contato || null
      )
      .run();

    return c.json({ success: true, message: "Fornecedor cadastrado com sucesso." });
  } catch {
    return c.json({ error: "Erro SQL ao criar o fornecedor." }, 500);
  }
});

app.patch("/api/fornecedores/:id", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const id = c.req.param("id");
    const data = await c.req.json();

    await c.env.DB.prepare(
      `
      UPDATE fornecedores 
      SET nome_fantasia = ?, 
          razao_social = ?, 
          telefone_whatsapp = ?, 
          categoria_principal = ?, 
          mensagem_padrao_cotacao = ?, 
          prazo_pagamento_dias = ?, 
          email = ?, 
          nome_contato = ?
      WHERE id = ? AND pizzaria_id = ?
    `
    )
      .bind(
        data.nome_fantasia,
        data.razao_social || null,
        data.telefone_whatsapp || null,
        data.categoria_principal || "Geral",
        data.mensagem_padrao_cotacao || null,
        data.prazo_pagamento_dias || 0,
        data.email || null,
        data.nome_contato || null,
        id,
        empresaId
      )
      .run();

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Erro interno ao tentar atualizar os dados do fornecedor." }, 500);
  }
});

app.delete("/api/fornecedores/:id", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    await c.env.DB.prepare(
      `
      DELETE FROM fornecedores 
      WHERE id = ? AND pizzaria_id = ?
    `
    )
      .bind(c.req.param("id"), empresaId)
      .run();

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Violação de chave estrangeira ou erro ao apagar fornecedor." }, 500);
  }
});

// ============================================================================
// 7. MÓDULO DE LISTA DE COMPRAS
// ============================================================================

app.get("/api/lista-compras", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const { results } = await c.env.DB.prepare(
      `
      SELECT 
        l.*, 
        p.nome_produto as produto_nome, 
        p.unidade_medida 
      FROM lista_compras l 
      JOIN produtos p ON l.produto_id = p.id
      WHERE l.pizzaria_id = ? 
      ORDER BY l.data_solicitacao DESC
    `
    )
      .bind(empresaId)
      .all();

    return c.json(results);
  } catch {
    return c.json([]);
  }
});

app.post("/api/lista-compras", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const { produto_id, quantidade_solicitada } = await c.req.json();

    await c.env.DB.prepare(
      `
      INSERT INTO lista_compras (pizzaria_id, produto_id, quantidade_solicitada) 
      VALUES (?, ?, ?)
    `
    )
      .bind(empresaId, produto_id, quantidade_solicitada)
      .run();

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Não foi possível adicionar o item à sua lista." }, 500);
  }
});

app.patch("/api/lista-compras/:id", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();

    if (updates.status_solicitacao) {
      await c.env.DB.prepare(
        `
        UPDATE lista_compras SET status_solicitacao = ? 
        WHERE id = ? AND pizzaria_id = ?
      `
      )
        .bind(updates.status_solicitacao, id, empresaId)
        .run();
    }

    if (updates.quantidade_solicitada) {
      await c.env.DB.prepare(
        `
        UPDATE lista_compras SET quantidade_solicitada = ? 
        WHERE id = ? AND pizzaria_id = ?
      `
      )
        .bind(updates.quantidade_solicitada, id, empresaId)
        .run();
    }

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Erro de banco de dados ao modificar lista." }, 500);
  }
});

app.delete("/api/lista-compras/:id", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    await c.env.DB.prepare(
      `
      DELETE FROM lista_compras 
      WHERE id = ? AND pizzaria_id = ?
    `
    )
      .bind(c.req.param("id"), empresaId)
      .run();

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Não foi possível remover da lista." }, 500);
  }
});

// ============================================================================
// 8. MÓDULO DE CATÁLOGO DE PRODUTOS E OPENFOODFACTS
// ============================================================================

app.get("/api/openfoodfacts/search", async (c) => {
  const query = c.req.query("q");
  if (!query) return c.json({ products: [] });

  try {
    const response = await fetch(
      `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        query
      )}&search_simple=1&action=process&json=1&page_size=5`
    );
    const data: any = await response.json();

    const products = (data.products || []).map((p: any) => ({
      code: p.code,
      product_name: p.product_name,
      brands: p.brands,
      categories: p.categories,
      image_url: p.image_url || p.image_small_url,
    }));

    return c.json({ products });
  } catch {
    return c.json({ products: [] }, 500);
  }
});

app.get("/api/produtos", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const { results } = await c.env.DB.prepare(
      `
      SELECT * FROM produtos 
      WHERE pizzaria_id = ? 
      ORDER BY nome_produto ASC
    `
    )
      .bind(empresaId)
      .all();

    return c.json(results);
  } catch {
    return c.json([]);
  }
});
   app.post("/api/produtos", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const data = await c.req.json();
    const nomeLimpo = String(data.nome_produto ?? "").trim();

    if (!nomeLimpo) return c.json({ error: "nome_produto é obrigatório." }, 400);

    // Anti-duplicidade
    const existente = await c.env.DB.prepare(
      `SELECT id FROM produtos WHERE pizzaria_id = ? AND LOWER(nome_produto) = LOWER(?) LIMIT 1`
    ).bind(empresaId, nomeLimpo).first();

    if (existente) {
      return c.json({
        id: (existente as any).id,
        success: true,
        message: "Produto já existia no catálogo e foi aproveitado.",
      });
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO produtos (
        pizzaria_id, nome_produto, categoria_produto, unidade_medida, 
        fornecedor_preferencial_id, codigo_barras
      ) VALUES (?, ?, ?, ?, ?, ?) RETURNING id
    `).bind(
        empresaId,
        nomeLimpo,
        data.categoria_produto || "Geral",
        data.unidade_medida || "un",
        data.fornecedor_preferencial_id || null,
        data.codigo_barras || null
      ).first();

    return c.json({ id: (result as any)?.id, success: true });
  } catch (e: any) {
    // 🔥 A MÁGICA ESTÁ AQUI: Agora ele vai gritar o erro exato do SQL!
    return c.json({ error: `Falha no banco: ${e.message}` }, 500); 
  }
});

// ============================================================================
// 9. MÓDULO DE ESTOQUE (INVENTÁRIO)
// ============================================================================

app.get("/api/estoque", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const { results } = await c.env.DB.prepare(
      `
      SELECT 
        e.*, 
        p.nome_produto as produto_nome, 
        p.unidade_medida, 
        p.categoria_produto 
      FROM estoque e 
      JOIN produtos p ON e.produto_id = p.id
      WHERE e.pizzaria_id = ? 
      ORDER BY p.nome_produto ASC
    `
    )
      .bind(empresaId)
      .all();

    return c.json(results);
  } catch {
    return c.json([]);
  }
});

app.post("/api/estoque", async (c) => {
  const pId = c.get("empresaId");
  try {
    const data = await c.req.json();
    
    const jaNoEstoque = await c.env.DB.prepare(`SELECT id FROM estoque WHERE pizzaria_id = ? AND produto_id = ?`).bind(pId, data.produto_id).first();
    if (jaNoEstoque) return c.json({ error: "Este produto já está listado no seu inventário de stock." }, 400);

    await c.env.DB.prepare(`
      INSERT INTO estoque (pizzaria_id, produto_id, quantidade_atual, estoque_minimo, custo_unitario) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      pId, 
      data.produto_id, 
      data.quantidade_atual || 0, 
      data.estoque_minimo || 0,
      data.custo_unitario || 0
    ).run();
    
    return c.json({ success: true });
  } catch (e: any) { 
    return c.json({ error: `Erro no POST Estoque: ${e.message}` }, 500); 
  }
});

app.patch("/api/estoque/:id", async (c) => {
  const pId = c.get("empresaId");
  const id = Number(c.req.param("id")); // Garantimos que o ID é número
  try {
    const data = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE estoque 
      SET quantidade_atual = ?, estoque_minimo = ?, custo_unitario = ? 
      WHERE id = ? AND pizzaria_id = ?
    `).bind(
      data.quantidade_atual, 
      data.estoque_minimo, 
      data.custo_unitario, 
      id, 
      pId
    ).run();
    
    return c.json({ success: true });
  } catch (e: any) { 
    return c.json({ error: `Erro no PATCH Estoque: ${e.message}` }, 500); 
  }
});

// ✅ IMPORTANTE: você tinha DOIS PATCH iguais. Mantive APENAS este (com custo_unitario).
app.patch("/api/estoque/:id", async (c) => {
  const empresaId = c.get("empresaId");
  const id = c.req.param("id");

  try {
    const data = await c.req.json();

    await c.env.DB.prepare(
      `
      UPDATE estoque 
      SET quantidade_atual = ?, estoque_minimo = ?, custo_unitario = ? 
      WHERE id = ? AND pizzaria_id = ?
    `
    )
      .bind(
        data.quantidade_atual,
        data.estoque_minimo,
        data.custo_unitario,
        id,
        empresaId
      )
      .run();

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Erro ao auditar o estoque." }, 500);
  }
});

app.delete("/api/estoque/:id", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const id = c.req.param("id");

    await c.env.DB.prepare(
      `
      DELETE FROM estoque 
      WHERE id = ? AND pizzaria_id = ?
    `
    )
      .bind(id, empresaId)
      .run();

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Falha do sistema ao tentar excluir o registro." }, 500);
  }
});

// ============================================================================
// 10. ENGENHARIA DE PREÇOS E FICHAS TÉCNICAS
// ============================================================================

app.get("/api/fichas-tecnicas", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const { results } = await c.env.DB.prepare(
      `
      SELECT * FROM fichas_tecnicas 
      WHERE pizzaria_id = ? 
      ORDER BY criado_em DESC
    `
    )
      .bind(empresaId)
      .all();

    return c.json(results);
  } catch {
    return c.json([]);
  }
});

app.post("/api/fichas-tecnicas", async (c) => {
  const empresaId = c.get("empresaId");

  try {
    const data = await c.req.json();

    // Plano da empresa (mantive tabela "pizzarias" do banco)
    const empresa: any = await c.env.DB.prepare(
      `
      SELECT plano 
      FROM pizzarias 
      WHERE id = ?
      LIMIT 1
    `
    )
      .bind(empresaId)
      .first();

    const plano = String(empresa?.plano || "grátis");

    // trava plano grátis/teste (mantido)
    if (plano.toLowerCase().includes("grátis") || plano.toLowerCase().includes("teste")) {
      const count: any = await c.env.DB.prepare(
        `
        SELECT COUNT(*) as total 
        FROM fichas_tecnicas 
        WHERE pizzaria_id = ?
      `
      )
        .bind(empresaId)
        .first();

      if (count && Number(count.total) >= 3) {
        return c.json(
          {
            error: "LIMIT_REACHED",
            message:
              "Atenção: O plano Grátis permite criar e manter apenas 3 Fichas Técnicas ativas simultaneamente. Faça o upgrade para o Plano Pro para liberar ilimitado e maximizar o CMV!",
          },
          403
        );
      }
    }

    const Ficha: any = await c.env.DB.prepare(
      `
      INSERT INTO fichas_tecnicas (
        pizzaria_id, 
        nome_produto, 
        markup, 
        impostos, 
        comissao, 
        preco_sugerido, 
        margem_liquida, 
        custo_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
    `
    )
      .bind(
        empresaId,
        data.nome_produto,
        data.markup,
        data.impostos,
        data.comissao,
        data.preco_sugerido,
        data.margem_liquida,
        data.custo_total
      )
      .first();

    const fichaId = Ficha?.id;

    if (fichaId && data.insumos && Array.isArray(data.insumos)) {
      for (const insumo of data.insumos) {
        await c.env.DB.prepare(
          `
          INSERT INTO ficha_tecnica_insumos (
            ficha_id, 
            produto_id, 
            quantidade, 
            custo_unitario
          ) VALUES (?, ?, ?, ?)
        `
        )
          .bind(fichaId, insumo.produto_id, insumo.quantidade, insumo.custo_unitario)
          .run();
      }
    }

    return c.json({
      success: true,
      id: fichaId,
      message: "Receita de engenharia guardada de forma segura na nuvem.",
    });
  } catch (e: any) {
    return c.json(
      {
        error: "Ocorreu um erro no motor de gravação da ficha técnica.",
        details: e?.message,
      },
      500
    );
  }
});

app.delete("/api/fichas-tecnicas/:id", async (c) => {
  const empresaId = c.get("empresaId");
  const id = c.req.param("id");

  try {
    await c.env.DB.prepare(
      `
      DELETE FROM fichas_tecnicas 
      WHERE id = ? AND pizzaria_id = ?
    `
    )
      .bind(id, empresaId)
      .run();

    return c.json({ success: true, message: "Ficha apagada." });
  } catch {
    return c.json({ error: "Erro de exclusão." }, 500);
  }
});

// ============================================================================
// 11. MÓDULO FINANCEIRO UNIVERSAL
// ============================================================================

app.get("/api/lancamentos", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM lancamentos WHERE empresa_id = ? ORDER BY vencimento_previsto ASC`
    ).bind(empresaId).all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: `Erro ao buscar lançamentos: ${e.message}` }, 500);
  }
});

app.post("/api/lancamentos", async (c) => {
  const empresaId = c.get("empresaId");
  try {
    const data = await c.req.json();
    
    await c.env.DB.prepare(`
      INSERT INTO lancamentos (
        empresa_id, tipo, categoria, descricao, valor_previsto, 
        valor_real, vencimento_previsto, vencimento_real, status, forma_pagamento, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      empresaId, data.tipo, data.categoria, data.descricao, data.valor_previsto,
      data.valor_real || null, data.vencimento_previsto, data.vencimento_real || null, 
      data.status || 'pendente', data.forma_pagamento || null, data.observacoes || null
    ).run();

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: `Erro ao criar lançamento: ${e.message}` }, 500);
  }
});

app.patch("/api/lancamentos/:id/pagar", async (c) => {
  const empresaId = c.get("empresaId");
  const id = c.req.param("id");
  try {
    const data = await c.req.json();
    await c.env.DB.prepare(`
      UPDATE lancamentos 
      SET valor_real = ?, vencimento_real = ?, status = 'pago', forma_pagamento = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ? AND empresa_id = ?
    `).bind(data.valor_real, data.vencimento_real, data.forma_pagamento, id, empresaId).run();

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: `Erro ao dar baixa: ${e.message}` }, 500);
  }
});

// Exportação
export default app;