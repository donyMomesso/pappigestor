import { NextResponse } from "next/server"
import { calcularNecessidades } from "@/lib/engine-compras"

export async function POST() {
  try {
    const res = await fetch(process.env.API_URL + "/estoque")
    const produtos = await res.json()

    const necessidades = calcularNecessidades(produtos)

    for (const item of necessidades) {
      await fetch(process.env.API_URL + "/lista-compras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          produto_id: item.produto_id,
          produto: item.produto,
          quantidade: item.quantidade,
          unidade: item.unidade,
          status: "sugerido"
        })
      })
    }

    return NextResponse.json({
      gerados: necessidades.length,
      necessidades
    })

  } catch (error) {
    return NextResponse.json({ error: "erro ao gerar necessidades" })
  }
}