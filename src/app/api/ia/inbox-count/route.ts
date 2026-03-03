import { NextResponse } from "next/server";

export async function GET() {
  // Seguro e padrão Next: nunca derruba o server
  return NextResponse.json({ count: 0 }, { status: 200 });
}