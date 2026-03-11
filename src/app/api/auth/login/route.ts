// src/app/api/app-auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "missing email" }, { status: 400 });
    }

    // mock dev
    const fakeProfile = { empresa_id: "empresa123", role: "admin" };
    return NextResponse.json(fakeProfile);
  } catch (err) {
    console.error("[/api/app-auth/login] error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}