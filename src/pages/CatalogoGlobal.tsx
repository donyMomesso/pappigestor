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

type UnidadeMedida = "kg" | "g" | "un" | "l" | "ml" | "cx" | "pct" | "fd" | string;

export interface ProdutoFoodService {
  id: string;
  nome: string;

  // ✅ tudo opcional para não quebrar o build
  descricao?: string;
  unidadeMedida?: UnidadeMedida;
  embalagem?: string; // ex: "caixa 6x", "fardo", "pacote"
  pesoAprox?: number; // ex: 4 (kg) ou 500 (g) dependendo do seu padrão
  categoria?: string;
  marca?: string;

  // valores opcionais caso exista no seu banco/IA
  precoMedio?: number;
  ultimaCompraEm?: string;
}

function safeLower(v: unknown) {
  return String(v ?? "").toLowerCase();
}

function formatPeso(peso?: number, unidade?: string) {
  if (peso == null || Number.isNaN(peso)) return "";
  const u = (unidade || "").toLowerCase();
  // se a unidade já for kg/g, a gente mostra junto
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
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [produtos, setProdutos] = useState<ProdutoFoodService[]>([]);
  const [termo, setTermo] = useState("");

  // ✅ carrega “catálogo global” — ajusta a rota se necessário
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setCarregando(true);
        setErro(null);

        // Você pode já ter uma rota pronta. Mantive uma genérica:
        // - Se já existir outra rota no seu projeto, troque aqui somente.
        const res = await fetch("/api/catalogo-global", { cache: "no-store" });

        if (!res.ok) {
          // fallback: não quebra interface
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Falha ao carregar catálogo");
        }

        const data = (await res.json()) as { produtos?: ProdutoFoodService[] } | ProdutoFoodService[];

        const lista = Array.isArray(data) ? data : (data.produtos ?? []);
        if (alive) setProdutos(lista);
      } catch (e: any) {
        if (alive) setErro(e?.message || "Erro ao carregar catálogo");
      } finally {
        if (alive) setCarregando(false);
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-600" />
            Catálogo Global
          </h1>
          <p className="text-xs text-muted-foreground">
            Base de produtos para padronizar compras, estoque e cadastro rápido.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Package className="w-3 h-3" />
            {total} itens
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Search className="w-3 h-3" />
            {totalFiltrados} exibidos
          </Badge>
        </div>
      </div>

      {/* Busca + ações */}
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
                  // ação futura: “usar produto”, “adicionar no meu catálogo”, etc.
                  // Mantive seguro e neutro.
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Ação Pro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado */}
      {carregando && (
        <div className="flex items-center justify-center py-14">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Carregando catálogo...
          </div>
        </div>
      )}

      {!carregando && erro && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-red-600 font-bold">{erro}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Dica: se você ainda não criou a rota <code>/api/catalogo-global</code>, eu mantenho essa tela funcionando,
              mas você precisa plugar o endpoint depois.
            </div>
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && filtrados.length === 0 && (
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <p className="text-sm font-bold">Nenhum produto encontrado.</p>
            <p className="text-xs text-muted-foreground mt-2">
              Tente outro termo ou limpe a busca.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
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
                  <CardTitle className="text-base font-black italic flex items-start justify-between gap-2">
                    <span className="line-clamp-2">{p.nome}</span>
                    <Badge variant="outline" className="shrink-0 gap-1">
                      <ClipboardCheck className="w-3 h-3" />
                      FS
                    </Badge>
                  </CardTitle>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {p.categoria && (
                      <Badge variant="secondary" className="gap-1">
                        <Tag className="w-3 h-3" />
                        {p.categoria}
                      </Badge>
                    )}
                    {unidade && (
                      <Badge variant="outline" className="gap-1">
                        <Scale className="w-3 h-3" />
                        {unidade}
                      </Badge>
                    )}
                    {embalagem && (
                      <Badge variant="outline" className="gap-1">
                        <Boxes className="w-3 h-3" />
                        {embalagem}
                      </Badge>
                    )}
                    {peso && (
                      <Badge variant="outline" className="gap-1">
                        <Scale className="w-3 h-3" />
                        {peso}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground min-h-[32px]">
                    {desc ? desc : "Sem descrição cadastrada (padrão do fornecedor)."}
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
