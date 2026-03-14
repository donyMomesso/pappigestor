declare const require: any;

type D1Result<T = Record<string, unknown>> = {
  results?: T[];
  meta?: {
    changes?: number;
  };
};

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<D1Result<T>>;
  run: () => Promise<D1Result>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  exec?: (query: string) => Promise<unknown>;
};

import { Hono } from "hono";
import { GoogleGenerativeAI } from "@google/generative-ai";

const { cors } = require("hono/cors");

interface Bindings {
  DB: D1Database;
  GOOGLE_AI_API_KEY?: string;
}

type Variables = {
  empresaId: string;
  userRole?: string;
  userEmail?: string;
  userPermissions?: string;
};

type ItemListaStatus =
  | "pendente"
  | "em_cotacao"
  | "aprovado"
  | "cancelado"
  | "baixado";

type CompraPayload = {
  categoria?: string;
  fornecedor?: {
    nome?: string;
    cnpj?: string | null;
  };
  nota?: {
    numero?: string | null;
    serie?: string | null;
    chave_acesso?: string | null;
    data_emissao?: string | null;
    url_consulta?: string | null;
  };
  totais?: {
    total?: number;
    subtotal?: number;
    desconto?: number;
    acrescimo?: number;
  };
  itens?: Array<{
    produto_id?: string | number | null;
    codigo?: string | null;
    descricao?: string;
    quantidade?: number;
    unidade?: string | null;
    valor_unitario?: number;
    valor_total?: number;
  }>;
  lista_ids_baixar?: Array<string | number>;
  observacao?: string | null;
  lancamento_id?: string | number | null;
};

type PerfilUsuarioRow = {
  id?: string;
  funcao?: string;
  permissoes?: string;
  status?: string;
  email?: string;
  pizzaria_id?: string;
  nome?: string;
  nome_empresa?: string;
  p_status?: string;
};

type FornecedorRow = {
  id: string;
};

type EstoquePosicaoRow = {
  id: string;
  quantidade_atual: number;
};

type JsonBody = Record<string, unknown>;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", cors());

app.use("/api/*", async (c, next) => {
  if (
    c.req.path.includes("/auth/login") ||
    c.req.path.includes("/empresas/minhas")
  ) {
    return await next();
  }

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

  const link = await c.env.DB.prepare(
    `
    SELECT id, funcao, permissoes, status
    FROM perfis_usuarios
    WHERE pizzaria_id = ? AND LOWER(email) = LOWER(?) AND status = 'ativo'
    LIMIT 1
  `
  )
    .bind(empresaId, userEmail)
    .first<PerfilUsuarioRow>();

  if (!link) {
    return c.json(
      { error: "Acesso negado: usuário não pertence a esta empresa." },
      403
    );
  }

  c.set("empresaId", empresaId);
  c.set("userRole", String(link.funcao || "comum"));
  c.set("userEmail", userEmail);
  c.set("userPermissions", String(link.permissoes || "[]"));

  await next();
});

function parsePermissions(raw: unknown): string[] {
  try {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    return JSON.parse(String(raw)) as string[];
  } catch {
    return [];
  }
}

function requirePerm(permission: string) {
  return async (c: any, next: any) => {
    const perms = parsePermissions(c.get("userPermissions"));
    if (!perms.includes(permission)) {
      return c.json({ error: "Sem permissão.", permission }, 403);
    }
    await next();
  };
}

function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

async function first<T = Record<string, unknown>>(
  stmt: D1PreparedStatement
): Promise<T | null> {
  return (await stmt.first<T>()) as T | null;
}

async function allRows<T = Record<string, unknown>>(
  stmt: D1PreparedStatement
): Promise<T[]> {
  const result = await stmt.all<T>();
  return (result.results ?? []) as T[];
}

async function getOrCreateFornecedor(
  c: any,
  nome: string,
  cnpj?: string | null
) {
  const empresaId = c.get("empresaId");
  const nomeLimpo = nome.trim();
  if (!nomeLimpo) return null;

  const existente = await first<FornecedorRow>(
    c.env.DB.prepare(
      `SELECT id FROM fornecedores WHERE pizzaria_id = ? AND LOWER(nome_fantasia) = LOWER(?) LIMIT 1`
    ).bind(empresaId, nomeLimpo)
  );

  if (existente?.id) return { id: existente.id, created: false };

  const id = uid("forn");
  await c.env.DB.prepare(
    `
    INSERT INTO fornecedores (
      id, pizzaria_id, nome_fantasia, cnpj, telefone_whatsapp,
      categoria_principal, mensagem_padrao_cotacao, is_ativo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, '', 'Mercado', NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `
  )
    .bind(id, empresaId, nomeLimpo, cnpj || null)
    .run();

  return { id, created: true };
}

app.post("/api/empresas/minhas", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as JsonBody;
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) return c.json({ error: "Email é obrigatório." }, 400);

    const result = await c.env.DB.prepare(
      `
      SELECT p.id, p.nome, p.plano, p.status
      FROM perfis_usuarios u
      JOIN pizzarias p ON u.pizzaria_id = p.id
      WHERE LOWER(u.email) = LOWER(?) AND u.status = 'ativo'
      ORDER BY p.nome ASC
    `
    )
      .bind(email)
      .all();

    return c.json({ empresas: result.results ?? [] });
  } catch (e: unknown) {
    return c.json(
      {
        error: "Erro ao listar unidades associadas.",
        details: e instanceof Error ? e.message : null,
      },
      500
    );
  }
});

app.post("/api/auth/login", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as JsonBody;
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) return c.json({ error: "Email é obrigatório." }, 400);

    const user = await c.env.DB.prepare(
      `
      SELECT u.pizzaria_id, u.funcao, u.nome, p.nome as nome_empresa, p.status as p_status
      FROM perfis_usuarios u
      JOIN pizzarias p ON u.pizzaria_id = p.id
      WHERE LOWER(u.email) = LOWER(?) AND u.status = 'ativo'
      LIMIT 1
    `
    )
      .bind(email)
      .first<PerfilUsuarioRow>();

    if (!user || user.p_status !== "ativo") {
      return c.json({ error: "Acesso negado ou conta inativa." }, 403);
    }

    return c.json({
      empresa_id: user.pizzaria_id,
      nome_empresa: user.nome_empresa,
      role: user.funcao,
      nome: user.nome,
    });
  } catch {
    return c.json({ error: "Erro interno durante o login." }, 500);
  }
});

app.get("/api/produtos", async (c) => {
  const empresaId = c.get("empresaId");
  const busca = asText(c.req.query("q"), "");

  let sql = `
    SELECT id, nome_produto, categoria_produto, unidade_medida, ultimo_preco_pago,
           fornecedor_preferencial_id, codigo_barras, marca, descricao, peso_embalagem,
           preco_referencia, catalogo_base_id, created_at, updated_at
    FROM produtos
    WHERE pizzaria_id = ?
  `;
  const binds: unknown[] = [empresaId];

  if (busca) {
    sql += ` AND (LOWER(nome_produto) LIKE LOWER(?) OR LOWER(COALESCE(codigo_barras, '')) LIKE LOWER(?))`;
    binds.push(`%${busca}%`, `%${busca}%`);
  }

  sql += ` ORDER BY nome_produto ASC`;
  const rows = await allRows(c.env.DB.prepare(sql).bind(...binds));
  return c.json(rows);
});

app.post("/api/produtos", requirePerm("compras:editar"), async (c) => {
  const empresaId = c.get("empresaId");
  const body = (await c.req.json().catch(() => ({}))) as JsonBody;

  const nome = asText(body.nome_produto);
  if (!nome) return c.json({ error: "nome_produto obrigatório" }, 400);

  const dup = await first<{ id: string }>(
    c.env.DB.prepare(
      `SELECT id FROM produtos WHERE pizzaria_id = ? AND LOWER(nome_produto) = LOWER(?) LIMIT 1`
    ).bind(empresaId, nome)
  );
  if (dup?.id) return c.json({ error: "Produto já existe", produto_id: dup.id }, 409);

  const id = uid("prod");
  await c.env.DB.prepare(
    `
    INSERT INTO produtos (
      id, pizzaria_id, nome_produto, categoria_produto, unidade_medida,
      ultimo_preco_pago, fornecedor_preferencial_id, codigo_barras, marca,
      descricao, peso_embalagem, preco_referencia, catalogo_base_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `
  )
    .bind(
      id,
      empresaId,
      nome,
      asText(body.categoria_produto, "Outros"),
      asText(body.unidade_medida, "un"),
      body.ultimo_preco_pago == null ? null : asNumber(body.ultimo_preco_pago),
      body.fornecedor_preferencial_id ? String(body.fornecedor_preferencial_id) : null,
      body.codigo_barras ? String(body.codigo_barras) : null,
      body.marca ? String(body.marca) : null,
      body.descricao ? String(body.descricao) : null,
      body.peso_embalagem ? String(body.peso_embalagem) : null,
      body.preco_referencia == null ? null : asNumber(body.preco_referencia),
      body.catalogo_base_id ? String(body.catalogo_base_id) : null
    )
    .run();

  const estoqueId = uid("est");
  await c.env.DB.prepare(
    `
    INSERT INTO estoque_posicao (
      id, pizzaria_id, produto_id, quantidade_atual, estoque_minimo, created_at, updated_at
    ) VALUES (?, ?, ?, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `
  )
    .bind(estoqueId, empresaId, id)
    .run();

  const produto = await first(
    c.env.DB.prepare(`SELECT * FROM produtos WHERE id = ?`).bind(id)
  );
  return c.json(produto, 201);
});

app.get("/api/fornecedores", async (c) => {
  const empresaId = c.get("empresaId");
  const rows = await allRows(
    c.env.DB.prepare(
      `
      SELECT id, nome_fantasia, telefone_whatsapp, categoria_principal, mensagem_padrao_cotacao,
             cnpj, is_ativo, created_at, updated_at
      FROM fornecedores
      WHERE pizzaria_id = ?
      ORDER BY nome_fantasia ASC
    `
    ).bind(empresaId)
  );
  return c.json(rows);
});

app.get("/api/lista-compras", async (c) => {
  const empresaId = c.get("empresaId");
  const statusQuery = asText(c.req.query("status"), "");
  const binds: unknown[] = [empresaId];

  let sql = `
    SELECT lc.id, lc.produto_id, lc.quantidade_solicitada, lc.status_solicitacao, lc.data_solicitacao,
           lc.usuario_solicitante_id, lc.observacao, lc.baixado_em,
           p.nome_produto AS produto_nome, p.unidade_medida
    FROM lista_compras lc
    LEFT JOIN produtos p ON p.id = lc.produto_id
    WHERE lc.pizzaria_id = ?
  `;

  if (statusQuery) {
    const statuses = statusQuery
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (statuses.length) {
      sql += ` AND lc.status_solicitacao IN (${statuses.map(() => "?").join(",")})`;
      binds.push(...statuses);
    }
  }

  sql += ` ORDER BY lc.created_at DESC`;
  const rows = await allRows(c.env.DB.prepare(sql).bind(...binds));
  return c.json(rows);
});

app.post("/api/lista-compras", requirePerm("compras:editar"), async (c) => {
  const empresaId = c.get("empresaId");
  const userEmail = c.get("userEmail") || "sistema@local";
  const body = (await c.req.json().catch(() => ({}))) as JsonBody;
  const produtoId = asText(body.produto_id);
  const qtd = asNumber(body.quantidade_solicitada ?? body.quantidade ?? 1, 1);

  if (!produtoId) return c.json({ error: "produto_id obrigatório" }, 400);

  const produto = await first<{ id: string }>(
    c.env.DB.prepare(
      `SELECT id FROM produtos WHERE pizzaria_id = ? AND id = ? LIMIT 1`
    ).bind(empresaId, produtoId)
  );
  if (!produto?.id) return c.json({ error: "Produto não encontrado" }, 404);

  const usuario = await first<{ id: string }>(
    c.env.DB.prepare(
      `SELECT id FROM perfis_usuarios WHERE pizzaria_id = ? AND LOWER(email) = LOWER(?) LIMIT 1`
    ).bind(empresaId, userEmail)
  );

  const id = uid("lc");
  await c.env.DB.prepare(
    `
    INSERT INTO lista_compras (
      id, pizzaria_id, produto_id, quantidade_solicitada, status_solicitacao,
      data_solicitacao, usuario_solicitante_id, observacao, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `
  )
    .bind(
      id,
      empresaId,
      produtoId,
      qtd,
      asText(body.status_solicitacao || body.status, "pendente"),
      usuario?.id || null,
      body.observacao ? String(body.observacao) : null
    )
    .run();

  const row = await first(
    c.env.DB.prepare(
      `
      SELECT lc.*, p.nome_produto AS produto_nome, p.unidade_medida
      FROM lista_compras lc
      LEFT JOIN produtos p ON p.id = lc.produto_id
      WHERE lc.id = ?
    `
    ).bind(id)
  );
  return c.json(row, 201);
});

app.post("/api/lista-compras/dar-baixa", requirePerm("compras:editar"), async (c) => {
  const empresaId = c.get("empresaId");
  const body = (await c.req.json().catch(() => ({}))) as JsonBody;
  const rawIds = body.ids;
  const ids = Array.isArray(rawIds) ? rawIds.map(String).filter(Boolean) : [];

  if (!ids.length) return c.json({ error: "Nenhum item informado" }, 400);

  const placeholders = ids.map(() => "?").join(",");
  const stmt = c.env.DB.prepare(
    `
    UPDATE lista_compras
    SET status_solicitacao = 'baixado', baixado_em = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE pizzaria_id = ? AND id IN (${placeholders})
  `
  ).bind(empresaId, ...ids);

  const result = await stmt.run();
  return c.json({ ok: true, atualizados: result.meta?.changes ?? 0, ids });
});

app.patch("/api/lista-compras/:id", requirePerm("compras:editar"), async (c) => {
  const empresaId = c.get("empresaId");
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as JsonBody;
  const updates: string[] = [];
  const binds: unknown[] = [];

  if (body.quantidade_solicitada != null) {
    updates.push(`quantidade_solicitada = ?`);
    binds.push(asNumber(body.quantidade_solicitada, 1));
  }

  if (body.status_solicitacao) {
    updates.push(`status_solicitacao = ?`);
    binds.push(String(body.status_solicitacao) as ItemListaStatus);
  }

  if (body.observacao !== undefined) {
    updates.push(`observacao = ?`);
    binds.push(body.observacao ? String(body.observacao) : null);
  }

  if (!updates.length) return c.json({ error: "Nada para atualizar" }, 400);

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  binds.push(empresaId, id);

  await c.env.DB.prepare(
    `UPDATE lista_compras SET ${updates.join(", ")} WHERE pizzaria_id = ? AND id = ?`
  )
    .bind(...binds)
    .run();

  const row = await first(
    c.env.DB.prepare(
      `SELECT * FROM lista_compras WHERE pizzaria_id = ? AND id = ?`
    ).bind(empresaId, id)
  );
  return c.json(row);
});

app.delete("/api/lista-compras/:id", requirePerm("compras:editar"), async (c) => {
  const empresaId = c.get("empresaId");
  const id = c.req.param("id");
  const result = await c.env.DB.prepare(
    `DELETE FROM lista_compras WHERE pizzaria_id = ? AND id = ?`
  )
    .bind(empresaId, id)
    .run();

  return c.json({ ok: true, deleted: (result.meta?.changes ?? 0) > 0 });
});

app.post("/api/compra-mercado", requirePerm("compras:editar"), async (c) => {
  const empresaId = c.get("empresaId");
  const body = (await c.req.json().catch(() => ({}))) as CompraPayload;
  const itens = Array.isArray(body.itens) ? body.itens : [];

  if (!itens.length) {
    return c.json({ error: "A compra precisa ter ao menos um item." }, 400);
  }

  const fornecedorNome = asText(body?.fornecedor?.nome, "Fornecedor sem nome");
  const fornecedor = await getOrCreateFornecedor(
    c,
    fornecedorNome,
    body?.fornecedor?.cnpj || null
  );

  const compraId = uid("comp");
  const total = asNumber(
    body?.totais?.total,
    itens.reduce((acc, item) => acc + asNumber(item.valor_total), 0)
  );
  const subtotal = asNumber(body?.totais?.subtotal, total);
  const desconto = asNumber(body?.totais?.desconto, 0);
  const acrescimo = asNumber(body?.totais?.acrescimo, 0);

  await c.env.DB.prepare(
    `
    INSERT INTO compras_mercado (
      id, pizzaria_id, fornecedor_id, fornecedor_nome, categoria, nota_numero, nota_serie,
      nota_chave_acesso, nota_data_emissao, nota_url_consulta, subtotal, desconto,
      acrescimo, valor_total, observacao, lancamento_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `
  )
    .bind(
      compraId,
      empresaId,
      fornecedor?.id || null,
      fornecedorNome,
      asText(body?.categoria, "Mercado"),
      body?.nota?.numero || null,
      body?.nota?.serie || null,
      body?.nota?.chave_acesso || null,
      body?.nota?.data_emissao || null,
      body?.nota?.url_consulta || null,
      subtotal,
      desconto,
      acrescimo,
      total,
      body?.observacao || null,
      body?.lancamento_id ? String(body.lancamento_id) : null
    )
    .run();

  let itensRegistrados = 0;

  for (const item of itens) {
    const compraItemId = uid("cmi");
    const produtoId = item.produto_id ? String(item.produto_id) : null;
    const quantidade = asNumber(item.quantidade, 1);
    const valorUnitario = asNumber(item.valor_unitario, 0);
    const valorTotal = asNumber(item.valor_total, quantidade * valorUnitario);

    await c.env.DB.prepare(
      `
      INSERT INTO compras_mercado_itens (
        id, compra_id, pizzaria_id, produto_id, codigo_barras, descricao,
        quantidade, unidade, valor_unitario, valor_total, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    )
      .bind(
        compraItemId,
        compraId,
        empresaId,
        produtoId,
        item.codigo || null,
        asText(item.descricao, "Item sem descrição"),
        quantidade,
        asText(item.unidade, "un"),
        valorUnitario,
        valorTotal
      )
      .run();

    if (produtoId) {
      await c.env.DB.prepare(
        `
        INSERT INTO estoque_movimentacoes (
          id, pizzaria_id, produto_id, tipo, origem, documento_id, quantidade, valor_unitario,
          observacao, created_at
        ) VALUES (?, ?, ?, 'entrada', 'compra_mercado', ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
        .bind(
          uid("mov"),
          empresaId,
          produtoId,
          compraId,
          quantidade,
          valorUnitario,
          fornecedorNome
        )
        .run();

      const posicao = await first<EstoquePosicaoRow>(
        c.env.DB.prepare(
          `SELECT id, quantidade_atual FROM estoque_posicao WHERE pizzaria_id = ? AND produto_id = ? LIMIT 1`
        ).bind(empresaId, produtoId)
      );

      if (posicao?.id) {
        await c.env.DB.prepare(
          `
          UPDATE estoque_posicao
          SET quantidade_atual = COALESCE(quantidade_atual, 0) + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
        )
          .bind(quantidade, posicao.id)
          .run();
      } else {
        await c.env.DB.prepare(
          `
          INSERT INTO estoque_posicao (
            id, pizzaria_id, produto_id, quantidade_atual, estoque_minimo, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `
        )
          .bind(uid("est"), empresaId, produtoId, quantidade)
          .run();
      }

      await c.env.DB.prepare(
        `
        UPDATE produtos
        SET ultimo_preco_pago = ?, updated_at = CURRENT_TIMESTAMP
        WHERE pizzaria_id = ? AND id = ?
      `
      )
        .bind(valorUnitario, empresaId, produtoId)
        .run();
    }

    itensRegistrados += 1;
  }

  const listaIds = Array.isArray(body.lista_ids_baixar)
    ? body.lista_ids_baixar.map(String).filter(Boolean)
    : [];

  if (listaIds.length) {
    const placeholders = listaIds.map(() => "?").join(",");
    await c.env.DB.prepare(
      `
      UPDATE lista_compras
      SET status_solicitacao = 'baixado', baixado_em = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE pizzaria_id = ? AND id IN (${placeholders})
    `
    )
      .bind(empresaId, ...listaIds)
      .run();
  }

  return c.json({
    compra_id: compraId,
    fornecedor_id: fornecedor?.id || null,
    fornecedor_criado: Boolean(fornecedor?.created),
    itens_registrados: itensRegistrados,
    valor_total: total,
  });
});

app.get("/api/compras-mercado", async (c) => {
  const empresaId = c.get("empresaId");
  const rows = await allRows(
    c.env.DB.prepare(
      `
      SELECT id, fornecedor_id, fornecedor_nome, categoria, nota_numero, nota_serie,
             nota_chave_acesso, nota_data_emissao, valor_total, created_at
      FROM compras_mercado
      WHERE pizzaria_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `
    ).bind(empresaId)
  );
  return c.json(rows);
});

app.post("/api/nfce/ler-direto", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as JsonBody;
  const url = asText(body.url);
  if (!url) return c.json({ error: "url obrigatória" }, 400);

  const chave = (url.match(/(?:p=|chNFe=)(\d{44})/) || [])[1] || null;
  return c.json({
    origem: "qr-url",
    url_consulta: url,
    chave_acesso: chave,
    sugestao:
      "Use OCR/IA como fallback quando a SEFAZ não permitir leitura automática.",
  });
});

app.post("/api/ia/ler-nota", async (c) => {
  if (!c.env.GOOGLE_AI_API_KEY) {
    return c.json({ error: "GOOGLE_AI_API_KEY não configurada." }, 500);
  }

  const contentType = c.req.header("content-type") || "";
  let prompt =
    "Extraia chave de acesso, emitente, itens, quantidades, valores e total de um cupom fiscal brasileiro em JSON.";

  try {
    const genAI = new GoogleGenerativeAI(c.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    if (contentType.includes("application/json")) {
      const body = (await c.req.json().catch(() => ({}))) as JsonBody;

      if (body.extrair_apenas === "chave_acesso") {
        prompt =
          "Extraia apenas a chave de acesso de 44 dígitos da nota em JSON: { chave_acesso }.";
      }

      const imageUrl = asText(body.image_url);
      const result = await model.generateContent([
        prompt,
        `Imagem/URL de referência: ${imageUrl || "não informado"}`,
      ]);

      return c.json({ raw: result.response.text() });
    }

    return c.json(
      { error: "Envie JSON com image_url nesta versão do worker." },
      400
    );
  } catch (e: unknown) {
    return c.json(
      {
        error: "Falha ao processar nota com IA.",
        details: e instanceof Error ? e.message : null,
      },
      500
    );
  }
});

export default app;