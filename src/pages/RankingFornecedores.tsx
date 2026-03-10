import { useState, useEffect, useCallback } from "react";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Upload, 
  Trophy,
  Star,
  Package,
  Calendar,
  BarChart3,
  FileImage,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface HistoricoPreco {
  id: number;
  produto_nome: string;
  produto_codigo: string | null;
  fornecedor_nome: string;
  fornecedor_id: number | null;
  preco_unitario: number;
  preco_kg: number | null;
  unidade: string;
  embalagem: string | null;
  quantidade: number | null;
  validade: string | null;
  numero_pedido: string | null;
  data_cotacao: string;
}

interface RankingItem {
  fornecedor_nome: string;
  fornecedor_id: number | null;
  produto_nome: string;
  total_cotacoes: number;
  preco_medio: number;
  menor_preco: number;
  maior_preco: number;
  ultima_cotacao: string;
}

interface Fornecedor {
  id: number;
  nome_fantasia: string;
}

export default function RankingFornecedores() {
  useAppAuth();
  const [historico, setHistorico] = useState<HistoricoPreco[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchProduto, setSearchProduto] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState("");
  const [expandedProduto, setExpandedProduto] = useState<string | null>(null);
  const [view, setView] = useState<"ranking" | "historico">("ranking");
  const [criarLancamento, setCriarLancamento] = useState(true);
  const [categoriaLancamento, setCategoriaLancamento] = useState("Ingredientes");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rankingRes, historicoRes, fornecedoresRes] = await Promise.all([
        fetch(`/api/ranking-fornecedores${searchProduto ? `?produto=${encodeURIComponent(searchProduto)}` : ""}`),
        fetch(`/api/historico-precos${searchProduto ? `?produto=${encodeURIComponent(searchProduto)}` : ""}`),
        fetch("/api/fornecedores")
      ]);

      if (rankingRes.ok) setRanking(await rankingRes.json());
      if (historicoRes.ok) setHistorico(await historicoRes.json());
      if (fornecedoresRes.ok) setFornecedores(await fornecedoresRes.json());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [searchProduto]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      alert("Selecione um arquivo");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fornecedor_nome", selectedFornecedor || "Fornecedor Desconhecido");
      formData.append("criar_lancamento", criarLancamento.toString());
      formData.append("categoria", categoriaLancamento);
      
      const fornecedor = fornecedores.find(f => f.nome_fantasia === selectedFornecedor);
      if (fornecedor) {
        formData.append("fornecedor_id", fornecedor.id.toString());
      }

      const res = await fetch("/api/ia/extrair-cotacao-completa", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      
      if (data.success) {
        const msg = data.lancamento_id 
          ? `Sucesso! ${data.salvos} itens extraídos e Previsão de Gasto #${data.lancamento_id} criada.`
          : `Sucesso! ${data.salvos} itens extraídos e salvos no histórico.`;
        alert(msg);
        setUploadOpen(false);
        setSelectedFornecedor("");
        setCriarLancamento(true);
        fetchData();
      } else {
        alert(data.error || "Erro ao processar cotação");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  // Agrupar ranking por produto
  const produtosUnicos = [...new Set(ranking.map(r => r.produto_nome))];
  const rankingPorProduto = produtosUnicos.map(produto => ({
    produto,
    fornecedores: ranking.filter(r => r.produto_nome === produto).sort((a, b) => a.preco_medio - b.preco_medio)
  }));

  // Stats
  const totalProdutos = produtosUnicos.length;
  const totalFornecedoresUnicos = [...new Set(ranking.map(r => r.fornecedor_nome))].length;
  const totalCotacoes = historico.length;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-7 h-7 text-amber-500" />
          Ranking de Fornecedores
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Compare preços e encontre os melhores fornecedores
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <Package className="w-10 h-10 opacity-80" />
            <div>
              <p className="text-amber-100 text-sm">Produtos</p>
              <p className="text-2xl font-bold">{totalProdutos}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <Star className="w-10 h-10 opacity-80" />
            <div>
              <p className="text-blue-100 text-sm">Fornecedores</p>
              <p className="text-2xl font-bold">{totalFornecedoresUnicos}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <BarChart3 className="w-10 h-10 opacity-80" />
            <div>
              <p className="text-green-100 text-sm">Cotações</p>
              <p className="text-2xl font-bold">{totalCotacoes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar produto..."
            value={searchProduto}
            onChange={(e) => setSearchProduto(e.target.value)}
            className="pl-10 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "ranking" ? "default" : "outline"}
            onClick={() => setView("ranking")}
            className={view === "ranking" ? "bg-orange-600 hover:bg-orange-700" : "dark:border-gray-600"}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Ranking
          </Button>
          <Button
            variant={view === "historico" ? "default" : "outline"}
            onClick={() => setView("historico")}
            className={view === "historico" ? "bg-orange-600 hover:bg-orange-700" : "dark:border-gray-600"}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Histórico
          </Button>
          <Button onClick={() => setUploadOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Upload className="w-4 h-4 mr-2" />
            Importar Cotação
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : view === "ranking" ? (
        /* Ranking View */
        <div className="space-y-4">
          {rankingPorProduto.length === 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <FileImage className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum dado de cotação encontrado.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Importe cotações de fornecedores para começar a comparar preços.
                </p>
                <Button onClick={() => setUploadOpen(true)} className="mt-4 bg-orange-600 hover:bg-orange-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Primeira Cotação
                </Button>
              </CardContent>
            </Card>
          ) : (
            rankingPorProduto.map((item) => (
              <Card key={item.produto} className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => setExpandedProduto(expandedProduto === item.produto ? null : item.produto)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-orange-500" />
                      <CardTitle className="text-lg dark:text-white">{item.produto}</CardTitle>
                      <Badge variant="secondary" className="dark:bg-gray-700">
                        {item.fornecedores.length} fornecedor{item.fornecedores.length > 1 ? "es" : ""}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      {item.fornecedores[0] && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Melhor preço</p>
                          <p className="font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(item.fornecedores[0].preco_medio)}
                          </p>
                        </div>
                      )}
                      {expandedProduto === item.produto ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {expandedProduto === item.produto && (
                  <CardContent className="pt-0 border-t dark:border-gray-700">
                    <div className="overflow-x-auto">
                      <table className="w-full mt-4">
                        <thead>
                          <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                            <th className="pb-2 font-medium">Posição</th>
                            <th className="pb-2 font-medium">Fornecedor</th>
                            <th className="pb-2 font-medium text-right">Preço Médio</th>
                            <th className="pb-2 font-medium text-right">Menor</th>
                            <th className="pb-2 font-medium text-right">Maior</th>
                            <th className="pb-2 font-medium text-center">Cotações</th>
                            <th className="pb-2 font-medium">Última</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                          {item.fornecedores.map((f, idx) => (
                            <tr key={f.fornecedor_nome} className="text-sm">
                              <td className="py-3">
                                {idx === 0 ? (
                                  <Badge className="bg-amber-500 hover:bg-amber-600">
                                    <Trophy className="w-3 h-3 mr-1" /> 1º
                                  </Badge>
                                ) : idx === 1 ? (
                                  <Badge className="bg-gray-400 hover:bg-gray-500">{idx + 1}º</Badge>
                                ) : idx === 2 ? (
                                  <Badge className="bg-orange-700 hover:bg-orange-800">{idx + 1}º</Badge>
                                ) : (
                                  <span className="text-gray-500 pl-2">{idx + 1}º</span>
                                )}
                              </td>
                              <td className="py-3 font-medium dark:text-white">{f.fornecedor_nome}</td>
                              <td className="py-3 text-right font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(f.preco_medio)}
                              </td>
                              <td className="py-3 text-right text-gray-600 dark:text-gray-300">
                                {formatCurrency(f.menor_preco)}
                              </td>
                              <td className="py-3 text-right text-gray-600 dark:text-gray-300">
                                {formatCurrency(f.maior_preco)}
                              </td>
                              <td className="py-3 text-center">
                                <Badge variant="outline" className="dark:border-gray-600">
                                  {f.total_cotacoes}
                                </Badge>
                              </td>
                              <td className="py-3 text-gray-500 dark:text-gray-400">
                                {formatDate(f.ultima_cotacao)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Histórico View */
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Histórico de Cotações</CardTitle>
            <CardDescription>Todos os preços registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {historico.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum registro encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                      <th className="pb-3 font-medium">Data</th>
                      <th className="pb-3 font-medium">Fornecedor</th>
                      <th className="pb-3 font-medium">Produto</th>
                      <th className="pb-3 font-medium">Embalagem</th>
                      <th className="pb-3 font-medium text-right">Preço</th>
                      <th className="pb-3 font-medium">Pedido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {historico.map((h) => (
                      <tr key={h.id}>
                        <td className="py-3 text-gray-600 dark:text-gray-300">{formatDate(h.data_cotacao)}</td>
                        <td className="py-3 font-medium dark:text-white">{h.fornecedor_nome}</td>
                        <td className="py-3 dark:text-gray-300">{h.produto_nome}</td>
                        <td className="py-3 text-gray-500 dark:text-gray-400">{h.embalagem || h.unidade}</td>
                        <td className="py-3 text-right font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(h.preco_unitario)}
                          {h.preco_kg && (
                            <span className="text-xs text-gray-500 block">
                              ({formatCurrency(h.preco_kg)}/kg)
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-gray-500 dark:text-gray-400">{h.numero_pedido || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Importar Cotação
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label className="dark:text-gray-300">Fornecedor</Label>
              <select
                value={selectedFornecedor}
                onChange={(e) => setSelectedFornecedor(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Selecione ou deixe em branco</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.nome_fantasia}>{f.nome_fantasia}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                A IA tentará identificar o fornecedor automaticamente se não selecionado
              </p>
            </div>
            <div>
              <Label className="dark:text-gray-300">Arquivo da Cotação</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                className="mt-1 dark:bg-gray-700 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Imagem ou PDF da cotação do fornecedor
              </p>
            </div>
            
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={criarLancamento}
                  onChange={(e) => setCriarLancamento(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  Criar Previsão de Gasto automaticamente
                </span>
              </label>
              {criarLancamento && (
                <div className="mt-2 pl-6">
                  <Label className="text-sm dark:text-gray-300">Categoria</Label>
                  <select
                    value={categoriaLancamento}
                    onChange={(e) => setCategoriaLancamento(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="Ingredientes">Ingredientes</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Embalagens">Embalagens</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Descartáveis">Descartáveis</option>
                    <option value="Equipamentos">Equipamentos</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)} className="dark:border-gray-600">
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading} className="bg-orange-600 hover:bg-orange-700">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
