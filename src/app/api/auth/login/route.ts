import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email } = await req.json();

  const fakeProfile = {
    empresa_id: "empresa123",
    role: "admin",
  };

  return NextResponse.json(fakeProfile);
}