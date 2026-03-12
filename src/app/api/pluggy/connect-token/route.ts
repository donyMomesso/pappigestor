import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Pluggy não configurado neste ambiente. O sistema está em modo manual.",
    },
    { status: 501 }
  );
}