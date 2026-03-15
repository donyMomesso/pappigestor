
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("companies").select("*").order("created_at",{ascending:false});

  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}

export async function POST(req:Request){
  const admin = getSupabaseAdmin();
  const body = await req.json();

  const { data, error } = await admin.from("companies").insert({
    name: body.name,
    cnpj: body.cnpj ?? null,
    plano: body.plano ?? "basico"
  }).select().single();

  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
