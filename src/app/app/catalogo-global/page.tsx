"use client";

import { useEffect, useState } from "react";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Badge } from "@/react-app/components/ui/badge";
import { Search, Package } from "lucide-react";

interface ProdutoFoodService {
  id: string;
  nome: string;

  embalagem?: string;
  pesoAprox?: string;
  unidadeMedida?: string;
  unidade_medida?: string;

  // campos opcionais (podem ou não existir)
  
  descricao?: string;
  description?: string;
  desc?: string;
  observacao?: string;

  categoria?: string;
  unidade?: string;
  marca?: string;
  ativo?: boolean;

  [key: string]: any;
  
}

export default function CatalogoGlobal() {
  const [produtos, setProdutos] = useState<ProdutoFoodService[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      // aqui você pode trocar pela sua API
      const res = await fetch("/api/catalogo-global");
      if (!res.ok) return;
      const data = await res.json();
      setProdutos(data || []);
    } catch {
      setProdutos([]);
    }
  };

  const produtosFiltrados = () => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return produtos;

    return produtos.filter((p) => {
      const nome = (p.nome ?? "").toLowerCase();

      const desc =
        (p.descricao ??
          p.description ??
          p.desc ??
          p.observacao ??
          "") as string;

      return (
        nome.includes(termo) ||
        desc.toLowerCase().includes(termo)
      );
    });
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Package className="text-orange-500 w-6 h-6" />
        <h1 className="text-xl font-black uppercase italic tracking-tight">
          Catálogo Global
        </h1>
      </div>

      {/* BUSCA */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 flex gap-3 items-center">
          <Search className="w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border-none focus-visible:ring-0"
          />
        </CardContent>
      </Card>

      {/* LISTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {produtosFiltrados().map((p) => {

          const desc =
            p.descricao ??
            p.description ??
            p.desc ??
            p.observacao ??
            "";

          return (
            <Card key={p.id} className="rounded-2xl">
              <CardContent className="p-4 space-y-2">

                <div className="flex justify-between items-start">
                  <h2 className="font-bold">{p.nome}</h2>

                  {p.ativo === false ? (
                    <Badge variant="destructive">Inativo</Badge>
                  ) : (
                    <Badge>Ativo</Badge>
                  )}
                </div>

                {desc && (
                  <p className="text-xs text-zinc-500">
                    {desc}
                  </p>
                )}

                <div className="flex gap-2 flex-wrap">

                  {p.categoria && (
                    <Badge variant="outline">
                      {p.categoria}
                    </Badge>
                  )}

                  {p.unidade && (
                    <Badge variant="outline">
                      {p.unidade}
                    </Badge>
                  )}

                  {p.marca && (
                    <Badge variant="outline">
                      {p.marca}
                    </Badge>
                  )}

                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}