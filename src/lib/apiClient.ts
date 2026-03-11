import { getSession } from "next-auth/react";

export async function apiClient(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const session = await getSession();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    "x-empresa-id": session?.user?.empresa_id ?? "",
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return response.json();
}