  import { Hono } from "hono";
  import { Buffer } from "node:buffer";
  import { GoogleGenerativeAI } from "@google/generative-ai";

  // ============================================================================
  // TIPAGENS (Para o TypeScript parar de dar erro)
  // ============================================================================
  interface Bindings {
    DB: D1Database;
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

  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  // ============================================================================
// MIDDLEWARE DE ISOLAMENTO (O Porteiro)
// ============================================================================
app.use("/api/*", async (c, next) => {
  if (c.req.path.includes("/auth/login") || c.req.path.includes("/empresas/minhas")) return await next();

  // Agora aceitamos apenas o header oficial do sistema
  const pizzariaId = c.req.header("x-pizzaria-id")?.trim();
  const userRole = c.req.header("x-user-role");

  if (!pizzariaId) {
    return c.json({ error: "Acesso negado: Unidade não identificada." }, 401);
  }

  c.set("pizzariaId", pizzariaId);
  c.set("userRole", userRole);
  await next();
});

// ============================================================================
// LISTAR UNIDADES DO USUÁRIO (pelo email)
// ============================================================================
app.post("/api/empresas/minhas", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as any;
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!email) return c.json({ error: "Email é obrigatório." }, 400);

    // Ajustado para buscar de pizzarias usando pizzaria_id no join
    const { results } = await c.env.DB.prepare(`
      SELECT
        p.id,
        p.nome,
        p.plano,
        p.status
      FROM perfis_usuarios u
      JOIN pizzarias p ON u.pizzaria_id = p.id
      WHERE u.email = ? AND u.status = 'ativo'
      ORDER BY p.nome
    `).bind(email).all();

    return c.json({ empresas: results ?? [] });
  } catch (e: any) {
    return c.json({ error: "Erro ao listar unidades", details: e?.message }, 500);
  }
});

  // ============================================================================
  // 0. AUTENTICAÇÃO
  // ============================================================================
  app.post("/api/auth/login", async (c) => {
    try {
      const { email } = await c.req.json();
      const user = await c.env.DB.prepare(`
        SELECT u.pizzaria_id, u.funcao, u.nome, p.status as p_status 
        FROM perfis_usuarios u
        JOIN pizzarias p ON u.pizzaria_id = p.id
        WHERE u.email = ? AND u.status = 'ativo'
      `).bind(email).first();

      if (!user || (user as any).p_status !== 'ativo') return c.json({ error: "Acesso negado." }, 403);
      return c.json({ pizzaria_id: (user as any).pizzaria_id, role: (user as any).funcao, nome: (user as any).nome });
    } catch (e) { return c.json({ error: "Erro interno" }, 500); }
  });
  // ============================================================================
  // LISTAR EMPRESAS DO USUÁRIO (pelo email) — sem precisar de header
  // ============================================================================

  app.post("/api/empresas/minhas", async (c) => {
    try {
      const body = (await c.req.json().catch(() => ({}))) as any;
      const email = String(body?.email ?? "").trim().toLowerCase();
      if (!email) return c.json({ error: "Email é obrigatório." }, 400);

      const { results } = await c.env.DB.prepare(`
        SELECT
          e.id,
          e.nome,
          e.segmento,
          e.status
        FROM perfis_usuarios u
        JOIN empresas e ON u.empresa_id = e.id
        WHERE u.email = ? AND u.status = 'ativo'
        ORDER BY e.nome
      `).bind(email).all();

      return c.json({ empresas: results ?? [] });
    } catch (e: any) {
      return c.json({ error: "Erro ao listar empresas", details: e?.message ?? String(e) }, 500);
    }
  });
  // ============================================================================
  // ADMIN - USUÁRIOS (EQUIPE) - ISOLADO POR EMPRESA
  // Requer header: x-empresa-id (seu middleware já valida)
  // ============================================================================

  app.get("/api/admin/usuarios", async (c) => {
    const empresaId = c.get("pizzariaId"); // (você ainda está usando esse nome internamente)

    try {
      // 1) lista usuários da empresa
      const { results } = await c.env.DB.prepare(`
        SELECT id, nome, email, funcao, cargo
        FROM perfis_usuarios
        WHERE empresa_id = ?
        ORDER BY
          CASE WHEN funcao = 'master' THEN 0 ELSE 1 END,
          nome ASC
      `)
        .bind(empresaId)
        .all();

      // 2) plano simples (por enquanto fixo — depois a gente liga em tabela planos)
      const limite = 3; // Grátis: 3 usuários (muda se quiser)
      const usado = Array.isArray(results) ? results.length : 0;

      return c.json({
        usuarios: results ?? [],
        plano: { nome: "Grátis", limite, usado },
      });
    } catch (e: any) {
      return c.json(
        { error: "Erro ao listar usuários", details: e?.message ?? String(e) },
        500
      );
    }
  });

  app.post("/api/admin/usuarios", async (c) => {
    const empresaId = c.get("pizzariaId");

    try {
      const body = (await c.req.json().catch(() => ({}))) as any;

      const email = String(body?.email ?? "").trim().toLowerCase();
      const cargo = String(body?.cargo ?? "Operador").trim();

      if (!email) return c.json({ error: "Email é obrigatório." }, 400);

      // 1) checa limite do plano (por enquanto fixo)
      const limite = 3;
      const countRow = await c.env.DB.prepare(
        "SELECT COUNT(*) as total FROM perfis_usuarios WHERE empresa_id = ?"
      )
        .bind(empresaId)
        .first();

      const total = Number((countRow as any)?.total ?? 0);
      if (total >= limite) {
        return c.json(
          { error: `Limite do plano atingido (${total}/${limite}).` },
          403
        );
      }

      // 2) se o email já existe nessa empresa, só atualiza cargo/status
      const existing = await c.env.DB.prepare(
        "SELECT id FROM perfis_usuarios WHERE empresa_id = ? AND email = ? LIMIT 1"
      )
        .bind(empresaId, email)
        .first();

      if (existing) {
        await c.env.DB.prepare(
          "UPDATE perfis_usuarios SET cargo = ?, status = 'ativo' WHERE id = ?"
        )
          .bind(cargo, (existing as any).id)
          .run();

        return c.json({ success: true, updated: true });
      }

      // 3) cria “convite” (nome pode ficar null até o primeiro login)
      await c.env.DB.prepare(`
        INSERT INTO perfis_usuarios (empresa_id, nome, email, funcao, cargo, status)
        VALUES (?, NULL, ?, 'comum', ?, 'ativo')
      `)
        .bind(empresaId, email, cargo)
        .run();

      return c.json({ success: true, created: true });
    } catch (e: any) {
      return c.json(
        { error: "Erro ao associar usuário", details: e?.message ?? String(e) },
        500
      );
    }
  });

  app.delete("/api/admin/usuarios/:id", async (c) => {
    const empresaId = c.get("pizzariaId");
    const id = Number(c.req.param("id"));

    if (!id) return c.json({ error: "ID inválido." }, 400);

    try {
      // não deixa remover master
      const row = await c.env.DB.prepare(
        "SELECT funcao FROM perfis_usuarios WHERE id = ? AND empresa_id = ? LIMIT 1"
      )
        .bind(id, empresaId)
        .first();

      if (!row) return c.json({ error: "Usuário não encontrado." }, 404);
      if ((row as any).funcao === "master") {
        return c.json({ error: "Não é permitido remover o usuário master." }, 403);
      }

      await c.env.DB.prepare("DELETE FROM perfis_usuarios WHERE id = ? AND empresa_id = ?")
        .bind(id, empresaId)
        .run();

      return c.json({ success: true });
    } catch (e: any) {
      return c.json(
        { error: "Erro ao remover usuário", details: e?.message ?? String(e) },
        500
      );
    }
  });
  // ============================================================================
  // 1. ROTAS DE CAIXA DE ENTRADA E INTELIGÊNCIA ARTIFICIAL (INBOX)
  // ============================================================================

  app.post("/api/ia/ler-nota", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const body = await c.req.parseBody();
      const file = body["file"];

      if (!file || !(file instanceof File)) {
        return c.json({ error: "Nenhum arquivo enviado." }, 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString("base64");

      const genAI = new GoogleGenerativeAI(c.env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Analise esta nota fiscal/cupom de compra de uma pizzaria.
        Extraia os dados e retorne APENAS um JSON estrito (sem markdown):
        {
          "fornecedor": "Nome do Fornecedor",
          "total": 123.45,
          "itens": [
            {"produto": "Nome", "qtd": 1, "preco_un": 10.00}
          ]
        }
      `;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: file.type } },
      ]);

      const cleanJson = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      const responseIA = JSON.parse(cleanJson);

      await c.env.DB.prepare(`
        INSERT INTO caixa_entrada (pizzaria_id, fornecedor_nome, valor_total, json_extraido, status, criado_em)
        VALUES (?, ?, ?, ?, 'pendente', CURRENT_TIMESTAMP)
      `).bind(pId, responseIA.fornecedor, responseIA.total, JSON.stringify(responseIA.itens)).run();

      return c.json({ success: true, message: "Nota processada!", data: responseIA });
    } catch (error) {
      return c.json({ error: "Falha ao processar a nota fiscal." }, 500);
    }
  });

  app.post("/api/ia/ler-link", async (c) => {
    try {
      const { url } = await c.req.json();
      if (!url) return c.json({ error: "Nenhum link fornecido." }, 400);

      const sefazResponse = await fetch(url);
      const htmlContent = await sefazResponse.text();

      const genAI = new GoogleGenerativeAI(c.env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Abaixo está o código HTML de uma Nota Fiscal (NFC-e) do Brasil.
        Encontre e extraia os dados e retorne APENAS um JSON estrito (sem markdown):
        { "fornecedor": "Nome da Empresa", "total": 123.45, "itens": [ {"produto": "Nome", "qtd": 1, "preco_un": 10.00} ] }
        Código HTML: ${htmlContent.substring(0, 35000)} 
      `;

      const result = await model.generateContent(prompt);
      const cleanJson = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      
      return c.json({ success: true, data: JSON.parse(cleanJson) });
    } catch (error) {
      return c.json({ error: "Falha ao ler o link da Sefaz." }, 500);
    }
  });

  app.post("/api/ia/interpretar-lista", async (c) => {
    try {
      const { texto } = await c.req.json();
      if (!texto) return c.json({ error: "Nenhum texto fornecido." }, 400);

      const genAI = new GoogleGenerativeAI(c.env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Analise o texto e extraia produtos, quantidades e unidades de medida (un, kg, g, L, ml, cx, pct).
        Retorne APENAS um JSON estrito neste formato: { "itens": [ {"produto": "Nome", "quantidade": 2, "unidade": "kg"} ] }
        Texto original: "${texto}"
      `;

      const result = await model.generateContent(prompt);
      const cleanJson = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      
      return c.json(JSON.parse(cleanJson));
    } catch (error) {
      return c.json({ error: "Não foi possível compreender o texto." }, 500);
    }
  });

  app.get("/api/ia/inbox-count", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const { total } = (await c.env.DB.prepare("SELECT COUNT(*) as total FROM caixa_entrada WHERE pizzaria_id = ? AND status = 'pendente'").bind(pId).first()) as { total: number } || { total: 0 };
      return c.json({ count: total });
    } catch (e) {
      return c.json({ count: 0 });
    }
  });

  app.get("/api/ia/inbox", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const { results } = await c.env.DB.prepare("SELECT * FROM caixa_entrada WHERE pizzaria_id = ? AND status = 'pendente' ORDER BY criado_em DESC").bind(pId).all();
      const formatted = results.map((row: any) => ({
        ...row, json_extraido: typeof row.json_extraido === 'string' ? JSON.parse(row.json_extraido) : row.json_extraido
      }));
      return c.json(formatted);
    } catch (e) {
      return c.json({ error: "Erro ao listar inbox" }, 500);
    }
  });

  app.post("/api/ia/inbox/approve", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const { id, json_extraido } = await c.req.json();
      await c.env.DB.prepare(`UPDATE caixa_entrada SET status = 'aprovado' WHERE id = ? AND pizzaria_id = ?`).bind(id, pId).run();

      const itens = typeof json_extraido === 'string' ? JSON.parse(json_extraido) : json_extraido;
      if (Array.isArray(itens)) {
        for (const item of itens) {
          await c.env.DB.prepare(`
            INSERT INTO estoque (pizzaria_id, nome_produto, quantidade) VALUES (?, ?, ?)
            ON CONFLICT(nome_produto) DO UPDATE SET quantidade = estoque.quantidade + excluded.quantidade, ultima_atualizacao = CURRENT_TIMESTAMP
          `).bind(pId, item.produto, item.qtd || 1).run().catch(e => console.log("Erro silencioso estoque"));
        }
      }
      return c.json({ success: true, message: "Lançado!" });
    } catch (e) {
      return c.json({ error: "Falha na aprovação" }, 500);
    }
  });

  // ============================================================================
  // 2. ROTAS DE FORNECEDORES
  // ============================================================================

  app.get("/api/fornecedores", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const { results } = await c.env.DB.prepare("SELECT * FROM fornecedores WHERE pizzaria_id = ? ORDER BY nome_fantasia").bind(pId).all();
      return c.json(results);
    } catch (e) {
      return c.json({ error: "Erro ao buscar fornecedores" }, 500);
    }
  });

  app.post("/api/fornecedores", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const data = await c.req.json();
      await c.env.DB.prepare(`
        INSERT INTO fornecedores (
          pizzaria_id, nome_fantasia, razao_social, telefone_whatsapp, 
          categoria_principal, mensagem_padrao_cotacao, prazo_pagamento_dias, email, nome_contato
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        pId, data.nome_fantasia, data.razao_social || null, data.telefone_whatsapp || null, 
        data.categoria_principal || 'Geral', data.mensagem_padrao_cotacao || null,
        data.prazo_pagamento_dias || 0, data.email || null, data.nome_contato || null
      ).run();
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: "Erro ao criar fornecedor. Confirme se atualizou a tabela." }, 500);
    }
  });

  app.patch("/api/fornecedores/:id", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const id = c.req.param("id");
      const data = await c.req.json();
      await c.env.DB.prepare(`
        UPDATE fornecedores 
        SET nome_fantasia = ?, razao_social = ?, telefone_whatsapp = ?, categoria_principal = ?, 
            mensagem_padrao_cotacao = ?, prazo_pagamento_dias = ?, email = ?, nome_contato = ?
        WHERE id = ? AND pizzaria_id = ?
      `).bind(
        data.nome_fantasia, data.razao_social || null, data.telefone_whatsapp || null, 
        data.categoria_principal || 'Geral', data.mensagem_padrao_cotacao || null,
        data.prazo_pagamento_dias || 0, data.email || null, data.nome_contato || null, id, pId
      ).run();
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: "Erro ao atualizar fornecedor" }, 500);
    }
  });

  app.delete("/api/fornecedores/:id", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      await c.env.DB.prepare("DELETE FROM fornecedores WHERE id = ? AND pizzaria_id = ?").bind(c.req.param("id"), pId).run();
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: "Erro ao apagar fornecedor" }, 500);
    }
    app.post("/api/fornecedores", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const data = await c.req.json();
      await c.env.DB.prepare(`
        INSERT INTO fornecedores (
          pizzaria_id, nome_fantasia, razao_social, cnpj, telefone_whatsapp, 
          categoria_principal, mensagem_padrao_cotacao, prazo_pagamento_dias, email, nome_contato
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        pId, data.nome_fantasia, data.razao_social || null, data.cnpj || null, data.telefone_whatsapp || null, 
        data.categoria_principal || 'Geral', data.mensagem_padrao_cotacao || null,
        data.prazo_pagamento_dias || 0, data.email || null, data.nome_contato || null
      ).run();
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: "Erro ao criar fornecedor." }, 500);
    }
  });
  });

  // ============================================================================
  // 3. ROTAS DE LISTA DE COMPRAS E PRODUTOS E ESTOQUE
  // ============================================================================

  app.get("/api/lista-compras", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const { results } = await c.env.DB.prepare(`
        SELECT l.*, p.nome_produto as produto_nome, p.unidade_medida 
        FROM lista_compras l JOIN produtos p ON l.produto_id = p.id
        WHERE l.pizzaria_id = ?
        ORDER BY l.data_solicitacao DESC
      `).bind(pId).all();
      return c.json(results);
    } catch (e) {
      return c.json([]); 
    }
  });

  app.post("/api/lista-compras", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const { produto_id, quantidade_solicitada } = await c.req.json();
      await c.env.DB.prepare("INSERT INTO lista_compras (pizzaria_id, produto_id, quantidade_solicitada) VALUES (?, ?, ?)")
        .bind(pId, produto_id, quantidade_solicitada).run();
      return c.json({ success: true });
    } catch (e) {
      return c.json({ error: "Erro ao adicionar" }, 500);
    }
  });

  app.patch("/api/lista-compras/:id", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const id = c.req.param("id");
      const updates = await c.req.json();
      if (updates.status_solicitacao) {
        await c.env.DB.prepare("UPDATE lista_compras SET status_solicitacao = ? WHERE id = ? AND pizzaria_id = ?").bind(updates.status_solicitacao, id, pId).run();
      }
      if (updates.quantidade_solicitada) {
        await c.env.DB.prepare("UPDATE lista_compras SET quantidade_solicitada = ? WHERE id = ? AND pizzaria_id = ?").bind(updates.quantidade_solicitada, id, pId).run();
      }
      return c.json({ success: true });
    } catch (e) {
      return c.json({ error: "Erro" }, 500);
    }
  });

  app.delete("/api/lista-compras/:id", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      await c.env.DB.prepare("DELETE FROM lista_compras WHERE id = ? AND pizzaria_id = ?").bind(c.req.param("id"), pId).run();
      return c.json({ success: true });
    } catch (e) { return c.json({ error: "Erro" }, 500); }
  });

  app.get("/api/produtos", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const { results } = await c.env.DB.prepare("SELECT * FROM produtos WHERE pizzaria_id = ? ORDER BY nome_produto").bind(pId).all();
      return c.json(results);
    } catch (e) { return c.json([]); }
  });

  app.post("/api/produtos", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const data = await c.req.json();
      const result = await c.env.DB.prepare(`
        INSERT INTO produtos (pizzaria_id, nome_produto, categoria_produto, unidade_medida, fornecedor_preferencial_id, codigo_barras)
        VALUES (?, ?, ?, ?, ?, ?) RETURNING id
      `).bind(pId, data.nome_produto, data.categoria_produto, data.unidade_medida, data.fornecedor_preferencial_id || null, data.codigo_barras || null).first();
      return c.json({ id: result?.id, success: true });
    } catch (e) { return c.json({ error: "Erro" }, 500); }
  });

  app.get("/api/estoque", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const { results } = await c.env.DB.prepare(`
        SELECT e.*, p.nome_produto as produto_nome, p.unidade_medida 
        FROM estoque e JOIN produtos p ON e.produto_id = p.id
        WHERE e.pizzaria_id = ?
      `).bind(pId).all();
      return c.json(results);
    } catch (e) { return c.json([]); }
  });

  app.get("/api/openfoodfacts/search", async (c) => {
    const query = c.req.query("q");
    if (!query) return c.json({ products: [] });
    try {
      const response = await fetch(`https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`);
      const data: any = await response.json();
      const products = (data.products || []).map((p: any) => ({
        code: p.code, product_name: p.product_name, brands: p.brands, categories: p.categories, image_url: p.image_url || p.image_small_url
      }));
      return c.json({ products });
    } catch (error) { return c.json({ products: [] }, 500); }
  });

  // ============================================================================
  // 4. ADMIN E EQUIPE
  // ============================================================================
  app.get("/api/admin/usuarios", async (c) => {
    const pId = c.get("pizzariaId");
    try {
      const pizzaria = await c.env.DB.prepare("SELECT plano, limite_usuarios FROM pizzarias WHERE id = ?").bind(pId).first<PizzariaRow>();
      if (!pizzaria) return c.json({ error: "Unidade não encontrada" }, 404);

      const { results: usuarios } = await c.env.DB.prepare("SELECT id, nome, email, funcao, cargo FROM perfis_usuarios WHERE pizzaria_id = ? ORDER BY funcao DESC").bind(pId).all();

      return c.json({
        usuarios,
        plano: { nome: pizzaria.plano, limite: pizzaria.limite_usuarios, usado: usuarios.length }
      });
    } catch (e) { return c.json({ error: "Erro ao buscar equipe" }, 500); }
  });

  app.post("/api/admin/usuarios", async (c) => {
    const pId = c.get("pizzariaId");
    const { email, cargo } = await c.req.json();
    try {
      const count = await c.env.DB.prepare("SELECT COUNT(*) as total FROM perfis_usuarios WHERE pizzaria_id = ?").bind(pId).first<CountRow>();
      const pizzaria = await c.env.DB.prepare("SELECT limite_usuarios FROM pizzarias WHERE id = ?").bind(pId).first<PizzariaRow>();

      if (count && pizzaria && count.total >= pizzaria.limite_usuarios) {
        return c.json({ error: "Limite do seu plano atingido!" }, 403);
      }

      await c.env.DB.prepare(`INSERT INTO perfis_usuarios (pizzaria_id, email, funcao, cargo, status) VALUES (?, ?, 'comum', ?, 'ativo')`).bind(pId, email, cargo).run();
      return c.json({ success: true });
    } catch (e) { return c.json({ error: "E-mail já associado." }, 400); }
  });

  export default app;
