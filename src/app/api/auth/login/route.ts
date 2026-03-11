// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[/api/auth/login] received body:", body);

    if (!body?.email) {
      return NextResponse.json({ error: "missing email" }, { status: 400 });
    }

    // TODO: substituir este mock por busca real no banco
    // Exemplo: const data = await db.findEmpresaByEmail(body.email);
    // Se implementar, retorne { empresa_id, role } quando encontrado.
    const fakeProfile = {
      empresa_id: "empresa123",
      role: "admin",
    };

    return NextResponse.json(fakeProfile);
  } catch (err) {
    console.error("[/api/auth/login] error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}