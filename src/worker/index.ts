import { Hono } from "hono";
import { Buffer } from "node:buffer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cors } from "hono/cors";

// ============================================================================
// 1. TIPAGENS DO SISTEMA
// Omitimos a importação do D1Database para evitar o erro TS2307 no seu ambiente
// e usamos 'any' para manter a compatibilidade total com o Cloudflare D1.
// ============================================================================
interface Bindings {
  DB: any; 
  GOOGLE_AI_API_KEY: string;
}

type Variables = {
  pizzariaId: string;
  userRole?: string;
};

interface PizzariaRow {
  plano: string;
  limite_usuarios: number;
}

interface CountRow {
  total: number;
}

// Inicialização da Aplicação Hono
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// 2. CONFIGURAÇÕES GLOBAIS E MIDDLEWARES
// ============================================================================

// Libera o CORS para permitir que o Frontend (Next.js) acesse o Backend (Worker)
app.use("*", cors());

// Middleware de Isolamento de Inquilino (Multi-tenant)
// Verifica se o usuário enviou o ID da Pizzaria em cada requisição
app.use("/api/*", async (c, next) => {
  // Rotas públicas que não exigem ID da pizzaria no cabeçalho
  if (
    c.req.path.includes("/auth/login") || 
    c.req.path.includes("/empresas/minhas")
  ) {
    return await next();
  }

  const pizzariaId = c.req.header("x-pizzaria-id")?.trim();
  const userRole = c.req.header("x-user-role");

  // Se não tem ID, bloqueia a requisição na hora
  if (!pizzariaId) {
    return c.json({ 
      error: "Acesso negado: Unidade não identificada no cabeçalho da requisição." 
    }, 401);
  }

  // Injeta as variáveis no contexto para serem usadas nas rotas abaixo
  c.set("pizzariaId", pizzariaId);
  c.set("userRole", userRole);
  
  await next();
});

// ============================================================================
// 3. MÓDULO DE AUTENTICAÇÃO E EMPRESAS
// ============================================================================

/**
 * Rota: POST /api/empresas/minhas
 * Objetivo: Listar todas as empresas/pizzarias vinculadas ao email do usuário logado.
 */
app.post("/api/empresas/minhas", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as any;
    const email = String(body?.email ?? "").trim().toLowerCase();
    
    if (!email) {
      return c.json({ error: "Email é obrigatório." }, 400);
    }

    const { results } = await c.env.DB.prepare(`
      SELECT
        p.id,
        p.nome,
        p.plano,
        p.status
      FROM perfis_usuarios u
      JOIN pizzarias p ON u.pizzaria_id = p.id
      WHERE u.email = ? AND u.status = 'ativo'
      ORDER BY p.nome ASC
    `).bind(email).all();

    return c.json({ empresas: results ?? [] });
  } catch (e: any) {
    return c.json({ 
      error: "Erro ao listar unidades associadas.", 
      details: e?.message 
    }, 500);
  }
});

/**
 * Rota: POST /api/auth/login
 * Objetivo: Validar o acesso de um usuário a uma empresa específica.
 */
app.post("/api/auth/login", async (c) => {
  try {
    const { email } = await c.req.json();
    
    const user = await c.env.DB.prepare(`
      SELECT 
        u.pizzaria_id, 
        u.funcao, 
        u.nome, 
        p.status as p_status 
      FROM perfis_usuarios u
      JOIN pizzarias p ON u.pizzaria_id = p.id
      WHERE u.email = ? AND u.status = 'ativo'
    `).bind(email).first();

    if (!user || (user as any).p_status !== 'ativo') {
      return c.json({ error: "Acesso negado ou conta inativa." }, 403);
    }

    return c.json({ 
      pizzaria_id: (user as any).pizzaria_id, 
      role: (user as any).funcao, 
      nome: (user as any).nome 
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
 * Objetivo: Listar a equipe da pizzaria respeitando a hierarquia.
 */
app.get("/api/admin/usuarios", async (c) => {
  const empresaId = c.get("pizzariaId");

  try {
    const { results } = await c.env.DB.prepare(`
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
    `).bind(empresaId).all();

    // Definição do limite de plano atual (Fixo em 3 para o exemplo, expansível futuramente)
    const limite = 3; 
    const usado = Array.isArray(results) ? results.length : 0;

    return c.json({
      usuarios: results ?? [],
      plano: { nome: "Grátis", limite, usado },
    });
  } catch (e: any) {
    return c.json({ 
      error: "Erro ao listar membros da equipe.", 
      details: e?.message ?? String(e) 
    }, 500);
  }
});

/**
 * Rota: POST /api/admin/usuarios
 * Objetivo: Adicionar um novo membro à equipe ou reativar um existente, validando limites de plano.
 */
app.post("/api/admin/usuarios", async (c) => {
  const empresaId = c.get("pizzariaId");

  try {
    const body = (await c.req.json().catch(() => ({}))) as any;
    const email = String(body?.email ?? "").trim().toLowerCase();
    const cargo = String(body?.cargo ?? "Operador").trim();

    if (!email) return c.json({ error: "Email é obrigatório para cadastro." }, 400);

    // Validação do Limite de Usuários do Plano
    const limite = 3;
    const countRow = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM perfis_usuarios 
      WHERE pizzaria_id = ? AND status = 'ativo'
    `).bind(empresaId).first();

    const total = Number((countRow as any)?.total ?? 0);
    if (total >= limite) {
      return c.json({ 
        error: `Limite do plano atingido (${total}/${limite}). Faça upgrade para adicionar mais usuários.` 
      }, 403);
    }

    // Verifica se o usuário já existe na base de dados desta empresa
    const existing = await c.env.DB.prepare(`
      SELECT id 
      FROM perfis_usuarios 
      WHERE pizzaria_id = ? AND email = ? LIMIT 1
    `).bind(empresaId, email).first();

    if (existing) {
      // Reativa e atualiza o cargo
      await c.env.DB.prepare(`
        UPDATE perfis_usuarios 
        SET cargo = ?, status = 'ativo' 
        WHERE id = ?
      `).bind(cargo, (existing as any).id).run();

      return c.json({ success: true, updated: true });
    }

    // Criação de um novo convite/usuário
    await c.env.DB.prepare(`
      INSERT INTO perfis_usuarios (pizzaria_id, nome, email, funcao, cargo, status)
      VALUES (?, NULL, ?, 'comum', ?, 'ativo')
    `).bind(empresaId, email, cargo).run();

    return c.json({ success: true, created: true });
  } catch (e: any) {
    return c.json({ 
      error: "Erro ao associar novo usuário.", 
      details: e?.message ?? String(e) 
    }, 500);
  }
});

/**
 * Rota: DELETE /api/admin/usuarios/:id
 * Objetivo: Remover um usuário da equipe (Master não pode ser removido).
 */
app.delete("/api/admin/usuarios/:id", async (c) => {
  const empresaId = c.get("pizzariaId");
  const id = Number(c.req.param("id"));

  if (!id) return c.json({ error: "ID de usuário inválido." }, 400);

  try {
    const row = await c.env.DB.prepare(`
      SELECT funcao 
      FROM perfis_usuarios 
      WHERE id = ? AND pizzaria_id = ? LIMIT 1
    `).bind(id, empresaId).first();

    if (!row) return c.json({ error: "Usuário não encontrado nesta unidade." }, 404);
    
    // Trava de Segurança
    if ((row as any).funcao === "master") {
      return c.json({ error: "Segurança: Não é permitido remover o usuário administrador (Master)." }, 403);
    }

    await c.env.DB.prepare(`
      DELETE FROM perfis_usuarios 
      WHERE id = ? AND pizzaria_id = ?
    `).bind(id, empresaId).run();

    return c.json({ success: true, message: "Usuário removido com sucesso." });
  } catch (e: any) {
    return c.json({ 
      error: "Erro ao tentar remover o usuário da base de dados.", 
      details: e?.message ?? String(e) 
    }, 500);
  }
});

// ============================================================================
// 5. MÓDULO DE INTELIGÊNCIA ARTIFICIAL E CAIXA DE ENTRADA (NOTAS FISCAIS)
// ============================================================================

/**
 * Rota: POST /api/ia/ler-nota
 * Objetivo: Receber PDF/Imagem da Nota Fiscal, enviar ao Gemini e extrair os dados.
 */
app.post("/api/ia/ler-nota", async (c) => {
  const pId = c.get("pizzariaId");
  
  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "Documento não encontrado. Por favor, anexe o arquivo." }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    const genAI = new GoogleGenerativeAI(c.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Você é um assistente especialista em contabilidade de pizzarias.
      Analise esta nota fiscal ou cupom de compra detalhadamente.
      Extraia os dados solicitados e retorne APENAS um JSON estrito, sem formatação markdown ou textos adicionais.
      Formato exigido:
      {
        "fornecedor": "Nome do Fornecedor na Nota",
        "total": 123.45,
        "itens": [
          {"produto": "Nome exato do insumo", "qtd": 1, "preco_un": 10.00}
        ]
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: file.type } },
    ]);

    const cleanJson = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const responseIA = JSON.parse(cleanJson);

    // Grava na Caixa de Entrada para aprovação humana
    await c.env.DB.prepare(`
      INSERT INTO caixa_entrada (
        pizzaria_id, 
        fornecedor_nome, 
        valor_total, 
        json_extraido, 
        status, 
        criado_em
      ) VALUES (?, ?, ?, ?, 'pendente', CURRENT_TIMESTAMP)
    `).bind(
      pId, 
      responseIA.fornecedor, 
      responseIA.total, 
      JSON.stringify(responseIA.itens)
    ).run();

    return c.json({ success: true, message: "Nota processada com sucesso via IA!", data: responseIA });
  } catch (e: any) {
    console.error("Erro na leitura de nota via IA:", e);
    return c.json({ error: "Falha interna ao processar a nota fiscal pela IA." }, 500);
  }
});

/**
 * Rota: POST /api/ia/ler-link
 * Objetivo: Extrair dados de notas fiscais através do link HTML da Sefaz.
 */
app.post("/api/ia/ler-link", async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) return c.json({ error: "Nenhum link fornecido para análise." }, 400);

    const sefazResponse = await fetch(url);
    const htmlContent = await sefazResponse.text();

    const genAI = new GoogleGenerativeAI(c.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Abaixo está o código HTML completo de uma Nota Fiscal de Consumidor Eletrônica (NFC-e) do Brasil.
      Sua tarefa é encontrar e extrair os dados e retornar APENAS um JSON estrito.
      Não use markdown de código.
      Formato esperado:
      { 
        "fornecedor": "Nome da Empresa Emissora", 
        "total": 123.45, 
        "itens": [ 
          {"produto": "Nome do Produto", "qtd": 1, "preco_un": 10.00} 
        ] 
      }
      
      Código HTML para análise: 
      ${htmlContent.substring(0, 35000)} 
    `;

    const result = await model.generateContent(prompt);
    const cleanJson = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    return c.json({ success: true, data: JSON.parse(cleanJson) });
  } catch (e: any) {
    return c.json({ error: "Falha de comunicação com o portal da Sefaz." }, 500);
  }
});

/**
 * Rota: POST /api/ia/interpretar-lista
 * Objetivo: Transformar texto livre (áudio transcrito ou digitado) em lista estruturada.
 */
app.post("/api/ia/interpretar-lista", async (c) => {
  try {
    const { texto } = await c.req.json();
    if (!texto) return c.json({ error: "O texto da lista não pode estar vazio." }, 400);

    const genAI = new GoogleGenerativeAI(c.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      O texto a seguir é uma lista de insumos ditada por um dono de pizzaria.
      Analise o texto e extraia os produtos, quantidades exatas e as unidades de medida reconhecidas (un, kg, g, L, ml, cx, pct).
      Retorne APENAS um JSON estrito neste formato, sem explicações: 
      { 
        "itens": [ 
          {"produto": "Nome do Insumo", "quantidade": 2, "unidade": "kg"} 
        ] 
      }
      Texto original: "${texto}"
    `;

    const result = await model.generateContent(prompt);
    const cleanJson = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    return c.json(JSON.parse(cleanJson));
  } catch (e: any) {
    return c.json({ error: "O modelo de IA não conseguiu interpretar o formato do texto." }, 500);
  }
});

/**
 * Rotas de Listagem e Contagem da Caixa de Entrada (Inbox)
 */
app.get("/api/ia/inbox-count", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const row = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM caixa_entrada 
      WHERE pizzaria_id = ? AND status = 'pendente'
    `).bind(pId).first();
    
    return c.json({ count: (row as any)?.total || 0 });
  } catch (e: any) {
    return c.json({ count: 0 });
  }
});

app.get("/api/ia/inbox", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM caixa_entrada 
      WHERE pizzaria_id = ? AND status = 'pendente' 
      ORDER BY criado_em DESC
    `).bind(pId).all();

    const formatted = results.map((row: any) => ({
      ...row, 
      json_extraido: typeof row.json_extraido === 'string' ? JSON.parse(row.json_extraido) : row.json_extraido
    }));

    return c.json(formatted);
  } catch (e: any) {
    return c.json({ error: "Erro crítico ao listar documentos da caixa de entrada." }, 500);
  }
});

/**
 * Rota: POST /api/ia/inbox/approve
 * Objetivo: Aprovar uma nota fiscal, alterando status e injetando produtos no estoque.
 */
app.post("/api/ia/inbox/approve", async (c) => {
  const pId = c.get("pizzariaId");
  
  try {
    const { id, json_extraido } = await c.req.json();
    
    // Atualiza o status na caixa de entrada
    await c.env.DB.prepare(`
      UPDATE caixa_entrada 
      SET status = 'aprovado' 
      WHERE id = ? AND pizzaria_id = ?
    `).bind(id, pId).run();

    // Logica de Injeção no Estoque baseada no JSON extraído
    const itens = typeof json_extraido === 'string' ? JSON.parse(json_extraido) : json_extraido;
    
    if (Array.isArray(itens)) {
      for (const item of itens) {
        // Essa query é um mecanismo de Upsert (Insere ou Atualiza se já existir)
        await c.env.DB.prepare(`
          INSERT INTO estoque (pizzaria_id, nome_produto, quantidade) 
          VALUES (?, ?, ?)
          ON CONFLICT(nome_produto) DO UPDATE 
          SET quantidade = estoque.quantidade + excluded.quantidade, 
              ultima_atualizacao = CURRENT_TIMESTAMP
        `).bind(pId, item.produto, item.qtd || 1).run().catch((e: any) => {
          // Ignora falhas isoladas de produtos para não quebrar o loop inteiro
          console.error("Falha ao registrar item no estoque:", item.produto);
        }); 
      }
    }
    
    return c.json({ success: true, message: "Nota Fiscal lançada no sistema!" });
  } catch (e: any) {
    return c.json({ error: "Ocorreu uma falha grave durante o processo de aprovação." }, 500);
  }
});

// ============================================================================
// 6. MÓDULO DE FORNECEDORES (CRUD COMPLETO COM TODAS AS COLUNAS)
// ============================================================================

app.get("/api/fornecedores", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM fornecedores 
      WHERE pizzaria_id = ? 
      ORDER BY nome_fantasia ASC
    `).bind(pId).all();
    
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: "Erro ao buscar a lista de fornecedores da base." }, 500);
  }
});

app.post("/api/fornecedores", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const data = await c.req.json();
    
    await c.env.DB.prepare(`
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
    `).bind(
      pId, 
      data.nome_fantasia, 
      data.razao_social || null, 
      data.cnpj || null, 
      data.telefone_whatsapp || null, 
      data.categoria_principal || 'Geral', 
      data.mensagem_padrao_cotacao || null,
      data.prazo_pagamento_dias || 0, 
      data.email || null, 
      data.nome_contato || null
    ).run();
    
    return c.json({ success: true, message: "Fornecedor cadastrado com sucesso." });
  } catch (e: any) {
    return c.json({ error: "Erro SQL ao criar o fornecedor." }, 500);
  }
});

app.patch("/api/fornecedores/:id", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    await c.env.DB.prepare(`
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
    `).bind(
      data.nome_fantasia, 
      data.razao_social || null, 
      data.telefone_whatsapp || null, 
      data.categoria_principal || 'Geral', 
      data.mensagem_padrao_cotacao || null,
      data.prazo_pagamento_dias || 0, 
      data.email || null, 
      data.nome_contato || null, 
      id, 
      pId
    ).run();
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: "Erro interno ao tentar atualizar os dados do fornecedor." }, 500);
  }
});

app.delete("/api/fornecedores/:id", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    await c.env.DB.prepare(`
      DELETE FROM fornecedores 
      WHERE id = ? AND pizzaria_id = ?
    `).bind(c.req.param("id"), pId).run();
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: "Violação de chave estrangeira ou erro ao apagar fornecedor." }, 500);
  }
});

// ============================================================================
// 7. MÓDULO DE LISTA DE COMPRAS
// ============================================================================

app.get("/api/lista-compras", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        l.*, 
        p.nome_produto as produto_nome, 
        p.unidade_medida 
      FROM lista_compras l 
      JOIN produtos p ON l.produto_id = p.id
      WHERE l.pizzaria_id = ? 
      ORDER BY l.data_solicitacao DESC
    `).bind(pId).all();
    
    return c.json(results);
  } catch (e: any) {
    return c.json([]); 
  }
});

app.post("/api/lista-compras", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const { produto_id, quantidade_solicitada } = await c.req.json();
    
    await c.env.DB.prepare(`
      INSERT INTO lista_compras (pizzaria_id, produto_id, quantidade_solicitada) 
      VALUES (?, ?, ?)
    `).bind(pId, produto_id, quantidade_solicitada).run();
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: "Não foi possível adicionar o item à sua lista." }, 500);
  }
});

app.patch("/api/lista-compras/:id", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    
    if (updates.status_solicitacao) {
      await c.env.DB.prepare(`
        UPDATE lista_compras SET status_solicitacao = ? 
        WHERE id = ? AND pizzaria_id = ?
      `).bind(updates.status_solicitacao, id, pId).run();
    }
    
    if (updates.quantidade_solicitada) {
      await c.env.DB.prepare(`
        UPDATE lista_compras SET quantidade_solicitada = ? 
        WHERE id = ? AND pizzaria_id = ?
      `).bind(updates.quantidade_solicitada, id, pId).run();
    }
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: "Erro de banco de dados ao modificar lista." }, 500);
  }
});

app.delete("/api/lista-compras/:id", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    await c.env.DB.prepare(`
      DELETE FROM lista_compras 
      WHERE id = ? AND pizzaria_id = ?
    `).bind(c.req.param("id"), pId).run();
    
    return c.json({ success: true });
  } catch (e: any) { 
    return c.json({ error: "Não foi possível remover da lista." }, 500); 
  }
});

// ============================================================================
// 8. MÓDULO DE CATÁLOGO DE PRODUTOS E INTEGRAÇÃO OPENFOODFACTS
// ============================================================================

app.get("/api/openfoodfacts/search", async (c) => {
  const query = c.req.query("q");
  if (!query) return c.json({ products: [] });
  
  try {
    const response = await fetch(`https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`);
    const data: any = await response.json();
    
    const products = (data.products || []).map((p: any) => ({
      code: p.code, 
      product_name: p.product_name, 
      brands: p.brands, 
      categories: p.categories, 
      image_url: p.image_url || p.image_small_url
    }));
    
    return c.json({ products });
  } catch (e: any) { 
    return c.json({ products: [] }, 500); 
  }
});

app.get("/api/produtos", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM produtos 
      WHERE pizzaria_id = ? 
      ORDER BY nome_produto ASC
    `).bind(pId).all();
    
    return c.json(results);
  } catch (e: any) { 
    return c.json([]); 
  }
});

app.post("/api/produtos", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const data = await c.req.json();
    const nomeLimpo = data.nome_produto.trim();

    // Barreira Anti-Duplicidade de Nomes
    const existente = await c.env.DB.prepare(`
      SELECT id 
      FROM produtos 
      WHERE pizzaria_id = ? AND LOWER(nome_produto) = LOWER(?)
    `).bind(pId, nomeLimpo).first();

    if (existente) {
      return c.json({ 
        id: existente.id, 
        success: true, 
        message: "Produto já existia no catálogo e foi aproveitado." 
      });
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO produtos (
        pizzaria_id, 
        nome_produto, 
        categoria_produto, 
        unidade_medida, 
        fornecedor_preferencial_id, 
        codigo_barras
      ) VALUES (?, ?, ?, ?, ?, ?) RETURNING id
    `).bind(
      pId, 
      nomeLimpo, 
      data.categoria_produto, 
      data.unidade_medida, 
      data.fornecedor_preferencial_id || null, 
      data.codigo_barras || null
    ).first();
    
    return c.json({ id: result?.id, success: true });
  } catch (e: any) { 
    return c.json({ error: "Erro crítico ao gravar novo produto." }, 500); 
  }
});

// ============================================================================
// 9. MÓDULO DE ESTOQUE (INVENTÁRIO FÍSICO)
// ============================================================================

app.get("/api/estoque", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        e.*, 
        p.nome_produto as produto_nome, 
        p.unidade_medida, 
        p.categoria_produto 
      FROM estoque e 
      JOIN produtos p ON e.produto_id = p.id
      WHERE e.pizzaria_id = ? 
      ORDER BY p.nome_produto ASC
    `).bind(pId).all();
    
    return c.json(results);
  } catch (e: any) { 
    return c.json([]); 
  }
});

app.post("/api/estoque", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const data = await c.req.json();
    
    // Barreira Anti-Duplicidade no Estoque
    const jaNoEstoque = await c.env.DB.prepare(`
      SELECT id 
      FROM estoque 
      WHERE pizzaria_id = ? AND produto_id = ?
    `).bind(pId, data.produto_id).first();

    if (jaNoEstoque) {
      return c.json({ error: "Este produto já está listado no seu inventário de stock." }, 400);
    }

    await c.env.DB.prepare(`
      INSERT INTO estoque (pizzaria_id, produto_id, quantidade_atual, estoque_minimo) 
      VALUES (?, ?, ?, ?)
    `).bind(
      pId, 
      data.produto_id, 
      data.quantidade_atual || 0, 
      data.estoque_minimo || 0
    ).run();
    
    return c.json({ success: true });
  } catch (e: any) { 
    return c.json({ error: "Item já cadastrado em estoque." }, 500); 
  }
});

app.patch("/api/estoque/:id", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE estoque 
      SET quantidade_atual = ?, estoque_minimo = ? 
      WHERE id = ? AND pizzaria_id = ?
    `).bind(
      data.quantidade_atual, 
      data.estoque_minimo, 
      id, 
      pId
    ).run();
    
    return c.json({ success: true });
  } catch (e: any) { 
    return c.json({ error: "Erro ao auditar o estoque." }, 500); 
  }
});

app.delete("/api/estoque/:id", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const id = c.req.param("id");
    
    await c.env.DB.prepare(`
      DELETE FROM estoque 
      WHERE id = ? AND pizzaria_id = ?
    `).bind(id, pId).run();
    
    return c.json({ success: true });
  } catch (e: any) { 
    return c.json({ error: "Falha do sistema ao tentar excluir o registro." }, 500); 
  }
});

// ============================================================================
// 10. MÓDULO DE ENGENHARIA DE PREÇOS E FICHAS TÉCNICAS
// ============================================================================

/**
 * Rota: GET /api/fichas-tecnicas
 * Objetivo: Listar todas as fichas criadas pela pizzaria.
 */
app.get("/api/fichas-tecnicas", async (c) => {
  const pId = c.get("pizzariaId");
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM fichas_tecnicas 
      WHERE pizzaria_id = ? 
      ORDER BY criado_em DESC
    `).bind(pId).all();
    
    return c.json(results);
  } catch (e: any) {
    return c.json([]);
  }
});

/**
 * Rota: POST /api/fichas-tecnicas
 * Objetivo: Criar uma nova Ficha Técnica, vinculando os insumos. Possui trava do plano Grátis.
 */
app.post("/api/fichas-tecnicas", async (c) => {
  const pId = c.get("pizzariaId");
  
  try {
    const data = await c.req.json();
    
    // 1. Verificar qual é o plano contratado da Pizzaria
    const pizzaria: any = await c.env.DB.prepare(`
      SELECT plano 
      FROM pizzarias 
      WHERE id = ?
    `).bind(pId).first();
    
    const plano = pizzaria?.plano || 'Grátis';

    // 2. Se a conta for Grátis, validar limite de uso do MVP
    if (plano.toLowerCase().includes('grátis') || plano.toLowerCase().includes('teste')) {
      const count: any = await c.env.DB.prepare(`
        SELECT COUNT(*) as total 
        FROM fichas_tecnicas 
        WHERE pizzaria_id = ?
      `).bind(pId).first();
      
      if (count && count.total >= 3) {
        return c.json({ 
          error: "LIMIT_REACHED", 
          message: "Atenção: O plano Grátis permite criar e manter apenas 3 Fichas Técnicas ativas simultaneamente. Faça o upgrade para o Plano Pro no painel principal para liberar o sistema ilimitado e maximizar o seu CMV!" 
        }, 403);
      }
    }

    // 3. Salvar os dados principais da Ficha Técnica
    const Ficha: any = await c.env.DB.prepare(`
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
    `).bind(
      pId, 
      data.nome_produto, 
      data.markup, 
      data.impostos, 
      data.comissao, 
      data.preco_sugerido, 
      data.margem_liquida, 
      data.custo_total
    ).first();

    const fichaId = Ficha?.id;

    // 4. Cadastrar todos os insumos vinculados a esta Ficha Técnica
    if (fichaId && data.insumos && Array.isArray(data.insumos)) {
      for (const insumo of data.insumos) {
        await c.env.DB.prepare(`
          INSERT INTO ficha_tecnica_insumos (
            ficha_id, 
            produto_id, 
            quantidade, 
            custo_unitario
          ) VALUES (?, ?, ?, ?)
        `).bind(
          fichaId, 
          insumo.produto_id, 
          insumo.quantidade, 
          insumo.custo_unitario
        ).run();
      }
    }

    return c.json({ 
      success: true, 
      id: fichaId, 
      message: "Receita de engenharia guardada de forma segura na nuvem." 
    });
    
  } catch (e: any) { 
    return c.json({ 
      error: "Ocorreu um erro no motor de gravação da ficha técnica.", 
      details: e?.message 
    }, 500); 
  }
});

/**
 * Rota: DELETE /api/fichas-tecnicas/:id
 * Objetivo: Excluir uma ficha técnica para liberar espaço no plano grátis.
 */
app.delete("/api/fichas-tecnicas/:id", async (c) => {
  const pId = c.get("pizzariaId");
  const id = c.req.param("id");
  
  try {
    // Graças ao ON DELETE CASCADE configurado na criação da tabela, 
    // isto irá apagar a ficha e também todos os insumos vinculados a ela.
    await c.env.DB.prepare(`
      DELETE FROM fichas_tecnicas 
      WHERE id = ? AND pizzaria_id = ?
    `).bind(id, pId).run();
    
    return c.json({ success: true, message: "Ficha apagada." });
  } catch (e: any) {
    return c.json({ error: "Erro de exclusão." }, 500);
  }
});

// Exportação do aplicativo para os servidores Edge da Cloudflare
export default app;