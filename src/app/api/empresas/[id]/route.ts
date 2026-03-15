
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function PUT(req:Request,{params}:{params:{id:string}}){
  const admin = getSupabaseAdmin();
  const body = await req.json();

  const {data,error}=await admin
  .from("companies")
  .update(body)
  .eq("id",params.id)
  .select()
  .single();

  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}

export async function DELETE(_req:Request,{params}:{params:{id:string}}){
  const admin = getSupabaseAdmin();

  const {error}=await admin
  .from("companies")
  .delete()
  .eq("id",params.id);

  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({success:true});
}
