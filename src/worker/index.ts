declare const require: any;

import { Hono } from "hono";
import { Buffer } from "node:buffer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const { cors } = require("hono/cors");

interface Bindings {
  DB: any;
  GOOGLE_AI_API_KEY: string;
}

type Variables = {
  empresaId: string;
  userRole?: string;
  userEmail?: string;
  userPermissions?: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", cors());

app.use("/api/*", async (c, next) => {
  if (c.req.path.includes("/auth/login") || c.req.path.includes("/empresas/minhas")) {
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
    .first();

  if (!link) {
    return c.json(
      { error: "Acesso negado: usuário não pertence a esta empresa." },
      403
    );
  }

  c.set("empresaId", empresaId);
  c.set("userRole", (link as any).funcao || "comum");
  c.set("userEmail", userEmail);
  c.set("userPermissions", (link as any).permissoes || "[]");

  await next();
});

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

app.post("/api/empresas/minhas", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as any;
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) return c.json({ error: "Email é obrigatório." }, 400);

    const { results } = await c.env.DB.prepare(
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

    return c.json({ empresas: results ?? [] });
  } catch (e: any) {
    return c.json({ error: "Erro ao listar unidades associadas.", details: e?.message }, 500);
  }
});

app.post("/api/auth/login", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as any;
    const email = String(body?.email ?? "").trim().toLowerCase();

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
      .first();

    if (!user || (user as any).p_status !== "ativo") {
      return c.json({ error: "Acesso negado ou conta inativa." }, 403);
    }

    return c.json({
      empresa_id: (user as any).pizzaria_id,
      nome_empresa: (user as any).nome_empresa,
      role: (user as any).funcao,
      nome: (user as any).nome,
    });
  } catch (e: any) {
    return c.json({ error: "Erro interno durante o login." }, 500);
  }
});

export default app;
