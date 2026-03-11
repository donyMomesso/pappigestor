"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Package,
  ClipboardCheck,
  Database,
  Sparkles,
  Loader2,
  Tag,
  Scale,
  Boxes,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type UnidadeMedida =
  | "kg"
  | "g"
  | "un"
  | "l"
  | "ml"
  | "cx"
  | "pct"
  | "fd"
  | string;

export interface ProdutoFoodService {
  id: string;
  nome: string;
  descricao?: string;
  unidadeMedida?: UnidadeMedida;
  embalagem?: string;
  pesoAprox?: number;
  categoria?: string;
  marca?: string;
  precoMedio?: number;
  ultimaCompraEm?: string;
  ativo?: boolean;
}

function safeLower(v: unknown) {
  return String(v ?? "").toLowerCase();
}

function formatPeso(peso?: number, unidade?: string) {
  if (peso == null || Number.isNaN(peso)) return "";
  const u = (unidade || "").toLowerCase();
  if (u === "kg") return `${peso} kg`;
  if (u === "g") return `${peso} g`;
  return `${peso}`;
}

function formatUnidade(un?: string) {
  if (!un) return "";
  const u = un.toLowerCase();
  if (u === "un") return "un";
  return un;
}

export default function CatalogoGlobal() {
  const [carregando, setCarregando] = useState(true);return null;
  const [erro, setErro] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoFoodService[]>([]);
  const [termo, setTermo] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setCarregando(true);
        setErro(null);

        const res = await fetch("/api/catalogo-global", { cache: "no-store" });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Falha ao carregar catálogo");
        }

        const data =
          (await res.json()) as
            | { produtos?: ProdutoFoodService[] }
            | ProdutoFoodService[];

        const lista = Array.isArray(data) ? data : data.produtos ?? [];

        if (alive) {
          setProdutos(lista);
        }
      } catch (e: unknown) {
        if (alive) {
          setErro(e instanceof Error ? e.message : "Erro ao carregar catálogo");
        }
      } finally {
        if (alive) {
          setCarregando(false);
        }
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const termoLower = useMemo(() => safeLower(termo.trim()), [termo]);

  const filtrados = useMemo(() => {
    if (!termoLower) return produtos;

    return produtos.filter((p) => {
      const nome = safeLower(p.nome);
      const desc = safeLower(p.descricao);
      const emb = safeLower(p.embalagem);
      const cat = safeLower(p.categoria);
      const marca = safeLower(p.marca);

      return (
        nome.includes(termoLower) ||
        desc.includes(termoLower) ||
        emb.includes(termoLower) ||
        cat.includes(termoLower) ||
        marca.includes(termoLower)
      );
    });
  }, [produtos, termoLower]);

  const total = produtos.length;
  const totalFiltrados = filtrados.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-black italic uppercase tracking-tight">
            <Database className="h-5 w-5 text-orange-600" />
            Catálogo Global
          </h1>
          <p className="text-xs text-muted-foreground">
            Base de produtos para padronizar compras, estoque e cadastro rápido.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Package className="h-3 w-3" />
            {total} itens
          </Badge>

          <Badge variant="outline" className="gap-1">
            <Search className="h-3 w-3" />
            {totalFiltrados} exibidos
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar por nome, descrição, categoria, marca, embalagem..."
                className="h-11"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setTermo("")}
                className="h-11"
              >
                Limpar
              </Button>

              <Button
                className="h-11 bg-orange-600 hover:bg-orange-700"
                onClick={() => {
                  // ação futura
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Ação Pro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {carregando && (
        <div className="flex items-center justify-center py-14">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando catálogo...
          </div>
        </div>
      )}

      {!carregando && erro && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-bold text-red-600">{erro}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Dica: se você ainda não criou a rota{" "}
              <code>/api/catalogo-global</code>, a tela está pronta, mas o
              endpoint precisa existir.
            </div>
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && filtrados.length === 0 && (
        <Card>
          <CardContent className="pb-10 pt-10 text-center">
            <p className="text-sm font-bold">Nenhum produto encontrado.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Tente outro termo ou limpe a busca.
            </p>
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && filtrados.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((p) => {
            const unidade = formatUnidade(p.unidadeMedida);
            const peso = formatPeso(p.pesoAprox, unidade);
            const desc = p.descricao?.trim();
            const embalagem = p.embalagem?.trim();

            return (
              <Card key={p.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start justify-between gap-2 text-base font-black italic">
                    <span className="line-clamp-2">{p.nome}</span>

                    <Badge variant="outline" className="shrink-0 gap-1">
                      <ClipboardCheck className="h-3 w-3" />
                      FS
                    </Badge>
                  </CardTitle>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.categoria && (
                      <Badge variant="secondary" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {p.categoria}
                      </Badge>
                    )}

                    {unidade && (
                      <Badge variant="outline" className="gap-1">
                        <Scale className="h-3 w-3" />
                        {unidade}
                      </Badge>
                    )}

                    {embalagem && (
                      <Badge variant="outline" className="gap-1">
                        <Boxes className="h-3 w-3" />
                        {embalagem}
                      </Badge>
                    )}

                    {peso && (
                      <Badge variant="outline" className="gap-1">
                        <Scale className="h-3 w-3" />
                        {peso}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="min-h-[32px] text-xs text-muted-foreground">
                    {desc
                      ? desc
                      : "Sem descrição cadastrada (padrão do fornecedor)."}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <Button variant="outline" className="w-full">
                      Ver detalhes
                    </Button>

                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      Usar produto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
