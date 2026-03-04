"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ShoppingCart,
  Search,
  Loader2,
  Plus,
  Package,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Badge } from "@/react-app/components/ui/badge";
import clsx from "clsx";

type UnidadeMedida = "kg" | "g" | "un" | "l" | "ml" | "cx" | "pct" | "fd" | string;

interface ProdutoFoodService {
  id: string;
  nome: string;
  categoria?: string;

  // ✅ campos opcionais (para não quebrar tipagem)
  unidadeMedida?: UnidadeMedida;
  descricao?: string;
  embalagem?: string;
  pesoAprox?: number;
  marca?: string;
}

function safeLower(v: unknown) {
  return String(v ?? "").toLowerCase();
}

function buildDescricao(p: ProdutoFoodService) {
  const partes: string[] = [];
  const desc = (p.descricao ?? "").trim();
  const emb = (p.embalagem ?? "").trim();

  if (desc) partes.push(desc);
  if (emb) partes.push(`Embalagem: ${emb}`);
  if (p.pesoAprox != null && !Number.isNaN(p.pesoAprox)) partes.push(`Peso aprox.: ${p.pesoAprox}`);

  return partes.join(". ").trim();
}

export default function CompradorPage() {
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [produtos, setProdutos] = useState<ProdutoFoodService[]>([]);
  const [termo, setTermo] = useState("");

  const [selecionado, setSelecionado] = useState<ProdutoFoodService | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [ok, setOk] = useState(false);

  // ✅ carrega catálogo (ajuste a rota se já tiver outra)
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setCarregando(true);
        setErro(null);

        const res = await fetch("/api/catalogo-global", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar catálogo global");

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

  const adicionarNaCompra = async (product: ProdutoFoodService) => {
    setAdicionando(true);
    setOk(false);
    setErro(null);

    try {
      // ✅ payload seguro (não assume campos)
      const payload = {
        itens: [
          {
            produto_id: product.id,
            nome_produto: product.nome,
            categoria_produto: product.categoria ?? "",
            unidade_medida: product.unidadeMedida ?? "",
            descricao: buildDescricao(product),
          },
        ],
      };

      // Troque a rota se no seu projeto for outra (ex: /api/compras/adicionar-item etc.)
      const res = await fetch("/api/compras/adicionar-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Se você ainda não implementou o endpoint, não vamos quebrar UI:
      if (!res.ok) {
        // tenta ler msg
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Não foi possível adicionar o item (endpoint não disponível)");
      }

      setSelecionado(product);
      setOk(true);

      // opcional: volta para lista de compras / comprador
      // setTimeout(() => navigate("/lista-compras"), 800);
    } catch (e: any) {
      setErro(e?.message || "Erro ao adicionar item");
    } finally {
      setAdicionando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            Comprador
          </h1>
          <p className="text-xs text-muted-foreground">
            Busque no catálogo e adicione produtos na compra / lista com segurança.
          </p>
        </div>

        <Badge variant="outline" className="gap-1">
          <Package className="w-3 h-3" />
          {filtrados.length} itens
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar por nome, descrição, categoria, embalagem..."
                className="h-11"
              />
            </div>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setTermo("")}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {carregando && (
        <div className="flex items-center justify-center py-14 text-sm text-muted-foreground gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando catálogo...
        </div>
      )}

      {!carregando && erro && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-bold text-red-600">{erro}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Se você ainda não criou o endpoint <code>/api/compras/adicionar-item</code>, a tela continua ok,
              mas o botão “Adicionar” vai falhar até plugar.
            </p>
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && filtrados.length === 0 && (
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <p className="text-sm font-bold">Nenhum produto encontrado.</p>
            <p className="text-xs text-muted-foreground mt-2">Tente outro termo.</p>
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && filtrados.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black italic line-clamp-2">
                  {p.nome}
                </CardTitle>

                <div className="flex flex-wrap gap-2 mt-2">
                  {p.categoria && <Badge variant="secondary">{p.categoria}</Badge>}
                  {p.unidadeMedida && <Badge variant="outline">{p.unidadeMedida}</Badge>}
                  {p.embalagem && <Badge variant="outline">{p.embalagem}</Badge>}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground min-h-[32px]">
                  {(p.descricao ?? "").trim() ? p.descricao : "Sem descrição."}
                </p>

                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={adicionando}
                  onClick={() => adicionarNaCompra(p)}
                >
                  {adicionando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Feedback */}
      {ok && selecionado && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="text-sm font-bold">
                Adicionado: <span className="text-orange-600">{selecionado.nome}</span>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/lista-compras")}>
              <Sparkles className="w-4 h-4 mr-2" />
              Ir para Lista
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}