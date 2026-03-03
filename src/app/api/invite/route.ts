import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !anon || !service) return NextResponse.json({ error: "Missing env" }, { status: 500 });

    // client admin (bypass RLS)
    const admin = createClient(url, service, { auth: { persistSession: false } });
    // verify requester via anon + token
    const anonClient = createClient(url, anon, { auth: { persistSession: false } });

    const { data: userData, error: userErr } = await anonClient.auth.getUser(token);
    if (userErr || !userData.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const requesterId = userData.user.id;

    // pega company_id do requester
    const { data: link, error: linkErr } = await admin
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", requesterId)
      .limit(1)
      .maybeSingle();

    if (linkErr || !link?.company_id) return NextResponse.json({ error: "No company link" }, { status: 403 });
    if (!["admin_empresa", "super_admin"].includes(link.role)) return NextResponse.json({ error: "Not admin" }, { status: 403 });

    const companyId = link.company_id as string;

    // cria convite (magic link) — o usuário cria a conta ao aceitar
    const { data: invite, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${new URL(req.url).origin}/auth`,
    });
    if (inviteErr) return NextResponse.json({ error: inviteErr.message }, { status: 400 });

    const invitedUserId = invite.user?.id;
    if (!invitedUserId) return NextResponse.json({ error: "Invite did not return user id" }, { status: 400 });

    // vincula o usuário na empresa com role
    const safeRole = ["operador", "comprador", "financeiro", "admin_empresa"].includes(role) ? role : "operador";
    const { error: bindErr } = await admin.from("company_users").upsert([
      { company_id: companyId, user_id: invitedUserId, role: safeRole },
    ]);

    if (bindErr) return NextResponse.json({ error: bindErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}