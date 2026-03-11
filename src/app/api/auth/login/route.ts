import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email } = await req.json();

  // Aqui você buscaria no banco de dados o perfil do usuário
  // Exemplo estático só para ilustrar:
  const fakeProfile = {
    empresa_id: "empresa123",
    role: "admin",
  };

  return NextResponse.json(fakeProfile);
}