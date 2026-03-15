import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {

 const body = await req.json();

 const empresaId = body.empresa_id;

 const res = NextResponse.json({ success: true });

 res.cookies.set("empresa_id", empresaId, {
  httpOnly: false,
  path: "/",
 });

 return res;
}