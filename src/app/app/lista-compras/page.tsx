"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Label } from "@/react-app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/react-app/components/ui/dialog";
import { Textarea } from "@/react-app/components/ui/textarea";
import {
  ShoppingCart,
  Loader2,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
  MessageCircle,
  Package,
  Sparkles,
  Edit2,
  Check,
  Search,
  ArrowLeft,
} from "lucide-react";

// ==========================================
// BANCO DE DADOS LOCAL - FOOD SERVICE EMBUTIDO
// ==========================================
interface ProdutoFoodService {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  embalagem: string;
  pesoAprox: string;
  unidadeMedida: string;
}

const PRODUTOS_FOOD_SERVICE: ProdutoFoodService[] = [
  {
    id: "prot-001",
    nome: "Peito de Frango sem Osso",
    descricao: "Filé de peito interfolhado",
    categoria: "Proteínas (Aves e Carnes)",
    embalagem: "Caixa",
    pesoAprox: "18kg a 20kg",
    unidadeMedida: "CX",
  },
  {
    id: "prot-002",
    nome: "Filé de Frango (Sassami)",
    descricao: "Pequeno filé interno do peito",
    categoria: "Proteínas (Aves e Carnes)",
    embalagem: "Caixa 1kg/2kg",
    pesoAprox: "12kg a 15kg",
    unidadeMedida: "CX",
  },
  {
    id: "prot-003",
    nome: "Coxa e Sobrecoxa",
    descricao: "Cortes de frango com osso e pele",
    categoria: "Proteínas (Aves e Carnes)",
    embalagem: "Caixa",
    pesoAprox: "15kg a 18kg",
    unidadeMedida: "CX",
  },
  {
    id: "prot-004",
    nome: "Frango Inteiro",
    descricao: "Frango inteiro com miúdos",
    categoria: "Proteínas (Aves e Carnes)",
    embalagem: "Caixa",
    pesoAprox: "16kg a 20kg",
    unidadeMedida: "CX",
  },
  {
    id: "prot-005",
    nome: "Coração de Frango",
    descricao: "Coração de frango limpo",
    categoria: "Proteínas (Aves e Carnes)",
    embalagem: "Caixa 1kg",
    pesoAprox: "10kg",
    unidadeMedida: "CX",
  },
  {
    id: "prot-006",
    nome: "Carne Bovina (Cortes)",
    descricao: "Contra-filé, Alcatra, Coxão Mole",
    categoria: "Proteínas (Aves e Carnes)",
    embalagem: "Caixa",
    pesoAprox: "20kg a 25kg",
    unidadeMedida: "CX",
  },
  {
    id: "prot-007",
    nome: "Carne Moída Bovina",
    descricao: "Carne moída (patinho ou acém)",
    categoria: "Proteínas (Aves e Carnes)",
    embalagem: "Caixa 500g/1kg",
    pesoAprox: "10kg",
    unidadeMedida: "CX",
  },
  {
    id: "emb-001",
    nome: "Linguiça Calabresa Reta",
    descricao: "Linguiça tipo calabresa defumada",
    categoria: "Embutidos e Suínos",
    embalagem: "Caixa",
    pesoAprox: "15kg",
    unidadeMedida: "CX",
  },
  {
    id: "emb-004",
    nome: "Bacon em Manta",
    descricao: "Peça inteira de bacon defumado",
    categoria: "Embutidos e Suínos",
    embalagem: "Peça a vácuo",
    pesoAprox: "3kg a 5kg",
    unidadeMedida: "PC",
  },
  {
    id: "lat-001",
    nome: "Queijo Mussarela",
    descricao: "Peça inteira de queijo mussarela",
    categoria: "Laticínios e Frios",
    embalagem: "Peça a vácuo",
    pesoAprox: "3,5kg a 4kg",
    unidadeMedida: "PC",
  },
  {
    id: "cong-001",
    nome: "Batata Congelada",
    descricao: "Batata pré-frita corte palito",
    categoria: "Congelados e Vegetais",
    embalagem: "Caixa 2kg/2,5kg",
    pesoAprox: "10kg a 12kg",
    unidadeMedida: "CX",
  },
  {
    id: "merc-001",
    nome: "Farinha de Trigo",
    descricao: "Farinha de trigo especial",
    categoria: "Mercearia e Condimentos",
    embalagem: "Saco",
    pesoAprox: "25kg a 50kg",
    unidadeMedida: "SC",
  },
  {
    id: "merc-007",
    nome: "Extrato de Tomate",
    descricao: "Extrato de tomate concentrado",
    categoria: "Mercearia e Condimentos",
    embalagem: "Balde/Lata",
    pesoAprox: "3kg a 4kg",
    unidadeMedida: "UN",
  },
];

function buscarProdutosFoodService(termo: string): ProdutoFoodService[] {
  if (!termo || termo.length < 2) return [];
  const termoLower = termo.toLowerCase();
  return PRODUTOS_FOOD_SERVICE.filter(
    (p) =>
      p.nome.toLowerCase().includes(termoLower) ||
      p.descricao.toLowerCase().includes(termoLower) ||
      p.categoria.toLowerCase().includes(termoLower)
  );
}

// ==========================================
// INTERFACES DA APLICAÇÃO
// ==========================================
interface Produto {
  id: string;
  nome_produto: string;
  categoria_produto: string;
  unidade_medida: string;
  ultimo_preco_pago: number | null;
  fornecedor_preferencial_id?: string | null;
}

interface Fornecedor {
  id: string;
  nome_fantasia: string;
  telefone_whatsapp: string;
  categoria_principal: string;
  mensagem_padrao_cotacao?: string;
}

interface Estoque {
  id: string;
  produto_id: string;
  quantidade_atual: number;
  estoque_minimo: number;
  produto_nome: string;
  unidade_medida: string;
}

interface ItemListaCompras {
  id: string;
  produto_id: string;
  quantidade_solicitada: number;
  status_solicitacao: string;
  data_solicitacao: string;
  usuario_solicitante_id: string;
  produto_nome?: string;
  unidade_medida?: string;
  solicitante_nome?: string;
}

const CATEGORIAS = [
  "Insumos",
  "Embalagens",
  "Bebidas",
  "Mercado",
  "Limpeza",
  "Outros",
  "Proteínas (Aves e Carnes)",
  "Embutidos e Suínos",
  "Laticínios e Frios",
  "Congelados e Vegetais",
  "Mercearia e Condimentos",
];
const UNIDADES = ["un", "kg", "g", "L", "ml", "cx", "pct", "fd", "pc", "sc"];

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; icon: ReactNode; bgIcon: string }
> = {
  pendente: {
    label: "Pendente",
    color: "text-yellow-600 bg-yellow-50",
    bgIcon: "bg-yellow-100 text-yellow-600",
    icon: <Clock size={14} />,
  },
  em_cotacao: {
    label: "Em Cotação",
    color: "text-blue-600 bg-blue-50",
    bgIcon: "bg-blue-100 text-blue-600",
    icon: <Send size={14} />,
  },
  aprovado: {
    label: "Aprovado",
    color: "text-green-600 bg-green-50",
    bgIcon: "bg-green-100 text-green-600",
    icon: <CheckCircle2 size={14} />,
  },
  cancelado: {
    label: "Cancelado",
    color: "text-red-600 bg-red-50",
    bgIcon: "bg-red-100 text-red-600",
    icon: <XCircle size={14} />,
  },
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function ListaComprasPage() {
  useAppAuth(); // localUser not needed for this base page yet.

  // Dados Principais
  const [itens, setItens] = useState<ItemListaCompras[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [estoqueBaixo, setEstoqueBaixo] = useState<Estoque[]>([]);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [isImportTextDialogOpen, setIsImportTextDialogOpen] = useState(false);

  // Seleções e Edições
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingQtdId, setEditingQtdId] = useState<string | null>(null);
  const [editingQtdValue, setEditingQtdValue] = useState("");

  // Adição Múltipla
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  const [produtoQtds, setProdutoQtds] = useState<Record<string, string>>({});
  const [produtoSearch, setProdutoSearch] = useState("");
  const [addStep, setAddStep] = useState<"select" | "quantity">("select");

  // Novo Produto (Food Service)
  const [newProductForm, setNewProductForm] = useState({
    nome_produto: "",
    categoria_produto: "Insumos",
    unidade_medida: "un",
    fornecedor_preferencial_id: "",
  });
  const [foodServiceSuggestions, setFoodServiceSuggestions] = useState<ProdutoFoodService[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Importação IA
  const [importText, setImportText] = useState("");
  const [isImportingText, setIsImportingText] = useState(false);
  const [importResults, setImportResults] = useState<any[]>([]);
  const [pendingImportItem, setPendingImportItem] = useState<
    { produto: string; quantidade: number; unidade: string } | null
  >(null);

  // ==========================================
  // FETCH DE DADOS (BLINDADO)
  // ==========================================
  const didRunRef = useRef(false);

  const fetchAllData = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);

      const pId = localStorage.getItem("pId") || "";

      // ✅ Se não tem pizzaria selecionada, não chama API
      if (!pId) {
        setItens([]);
        setProdutos([]);
        setFornecedores([]);
        setEstoqueBaixo([]);
        return;
      }

      const headers: Record<string, string> = { "x-pizzaria-id": pId };

      const [resItens, resProd, resForn, resEstoque] = await Promise.all([
        fetch("/api/lista-compras", { headers, cache: "no-store", signal }).catch(() => null),
        fetch("/api/produtos", { headers, cache: "no-store", signal }).catch(() => null),
        fetch("/api/fornecedores", { headers, cache: "no-store", signal }).catch(() => null),
        fetch("/api/estoque", { headers, cache: "no-store", signal }).catch(() => null),
      ]);

      if (signal?.aborted) return;

      if (resItens?.ok) setItens((await resItens.json()) as any);
      if (resProd?.ok) setProdutos((await resProd.json()) as any);

      if (resForn?.ok) {
        const data = (await resForn.json()) as any;
        setFornecedores((data || []).filter((f: Fornecedor) => !!f?.telefone_whatsapp));
      } else {
        setFornecedores([]);
      }

      if (resEstoque?.ok) {
        const data = (await resEstoque.json()) as any;
        setEstoqueBaixo(
          (data || []).filter((e: Estoque) => Number(e?.quantidade_atual) <= Number(e?.estoque_minimo))
        );
      } else {
        setEstoqueBaixo([]);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("fetchAllData:", err);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    // ✅ Evita rodar 2x no DEV (React Strict Mode)
    if (process.env.NODE_ENV === "development" && didRunRef.current) return;
    didRunRef.current = true;

    const controller = new AbortController();
    fetchAllData(controller.signal);

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================
  // FUNÇÕES DE PRODUTO FOOD SERVICE E IA
  // ==========================================
  const handleProductNameChange = (value: string) => {
    setNewProductForm((prev) => ({ ...prev, nome_produto: value }));
    if (value.length >= 2) {
      const results = buscarProdutosFoodService(value);
      setFoodServiceSuggestions(results);
      setShowSuggestions(true);
    } else {
      setFoodServiceSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectFoodServiceProduct = (product: ProdutoFoodService) => {
    setNewProductForm((prev) => ({
      ...prev,
      nome_produto: product.nome,
      categoria_produto: product.categoria,
      unidade_medida: product.unidadeMedida.toLowerCase(),
    }));
    setShowSuggestions(false);
    setFoodServiceSuggestions([]);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const pId = localStorage.getItem("pId") || "";
    try {
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pizzaria-id": pId },
        body: JSON.stringify({
          ...newProductForm,
          fornecedor_preferencial_id:
            newProductForm.fornecedor_preferencial_id && newProductForm.fornecedor_preferencial_id !== "none"
              ? newProductForm.fornecedor_preferencial_id
              : null,
        }),
      });

      if (res.ok) {
        const novoProduto = (await res.json()) as any;
        setIsNewProductDialogOpen(false);
        setNewProductForm({
          nome_produto: "",
          categoria_produto: "Insumos",
          unidade_medida: "un",
          fornecedor_preferencial_id: "",
        });
        setFoodServiceSuggestions([]);
        setShowSuggestions(false);

        if (pendingImportItem) {
          await fetch("/api/lista-compras", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-pizzaria-id": pId },
            body: JSON.stringify({ produto_id: novoProduto.id, quantidade_solicitada: pendingImportItem.quantidade }),
          });

          setImportResults((prev) =>
            prev.map((r) => (r.produto === pendingImportItem.produto ? { ...r, added: true } : r))
          );
          setPendingImportItem(null);

          setTimeout(() => setIsImportTextDialogOpen(true), 300);
        } else {
          if (!selectedProdutos.includes(novoProduto.id)) {
            setSelectedProdutos([...selectedProdutos, novoProduto.id]);
            setProdutoQtds({ ...produtoQtds, [novoProduto.id]: "1" });
          }
        }

        fetchAllData();
      }
    } catch {
      alert("Erro ao criar produto");
    }
  };

  const handleImportText = async () => {
    if (!importText.trim()) return;
    setIsImportingText(true);
    setImportResults([]);
    const pId = localStorage.getItem("pId") || "";
    try {
      const res = await fetch("/api/ia/interpretar-lista", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pizzaria-id": pId },
        body: JSON.stringify({ texto: importText }),
      });
      const data = (await res.json()) as any;
      if (data.error) throw new Error(data.error);

      const results: any[] = [];
      for (const item of data.itens || []) {
        const prod = produtos.find((p) => p.nome_produto.toLowerCase().includes(String(item.produto).toLowerCase()));
        if (prod) {
          await fetch("/api/lista-compras", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-pizzaria-id": pId },
            body: JSON.stringify({ produto_id: prod.id, quantidade_solicitada: item.quantidade || 1 }),
          });
          results.push({ ...item, added: true });
        } else {
          results.push({ ...item, added: false });
        }
      }
      setImportResults(results);
      fetchAllData();
    } catch {
      alert("Erro ao interpretar lista. Tente novamente.");
    } finally {
      setIsImportingText(false);
    }
  };

  const handleCloseImportDialog = () => {
    setImportText("");
    setImportResults([]);
    setIsImportTextDialogOpen(false);
  };

  const openCadastroFromIA = (r: any) => {
    setPendingImportItem({ produto: r.produto, quantidade: r.quantidade, unidade: r.unidade });
    setNewProductForm({
      nome_produto: r.produto,
      categoria_produto: "Insumos",
      unidade_medida: r.unidade || "un",
      fornecedor_preferencial_id: "",
    });
    handleProductNameChange(r.produto);

    setIsImportTextDialogOpen(false);
    setTimeout(() => setIsNewProductDialogOpen(true), 250);
  };

  // ==========================================
  // AÇÕES DA LISTA
  // ==========================================
  const handleUpdateStatus = async (id: string, status: string) => {
    const pId = localStorage.getItem("pId") || "";
    await fetch(`/api/lista-compras/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-pizzaria-id": pId },
      body: JSON.stringify({ status_solicitacao: status }),
    });
    fetchAllData();
  };

  const handleUpdateQuantidade = async (id: string, quantidade: string) => {
    const qtd = parseFloat(quantidade);
    if (Number.isNaN(qtd) || qtd <= 0) {
      setEditingQtdId(null);
      return;
    }
    const pId = localStorage.getItem("pId") || "";
    await fetch(`/api/lista-compras/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-pizzaria-id": pId },
      body: JSON.stringify({ quantidade_solicitada: qtd }),
    });
    setEditingQtdId(null);
    fetchAllData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este item da lista?")) return;
    const pId = localStorage.getItem("pId") || "";
    await fetch(`/api/lista-compras/${id}`, { method: "DELETE", headers: { "x-pizzaria-id": pId } });
    setSelectedItems(selectedItems.filter((i) => i !== id));
    fetchAllData();
  };

  const handleAddMultipleItems = async () => {
    const pId = localStorage.getItem("pId") || "";
    for (const produtoId of selectedProdutos) {
      const quantidade = parseFloat(produtoQtds[produtoId] || "1");
      if (quantidade > 0) {
        await fetch("/api/lista-compras", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-pizzaria-id": pId },
          body: JSON.stringify({ produto_id: produtoId, quantidade_solicitada: quantidade }),
        });
      }
    }
    setIsAddDialogOpen(false);
    setSelectedProdutos([]);
    setProdutoQtds({});
    setAddStep("select");
    setProdutoSearch("");
    fetchAllData();
  };

  const openWhatsApp = (telefone: string, fornecedorId?: string) => {
    const phone = telefone.replace(/\D/g, "");
    const fornecedor = fornecedores.find((f) => f.id === fornecedorId);
    const selectedItensData = itens.filter((i) => selectedItems.includes(i.id));

    let message = `🍕 *PAPPI PIZZA - Solicitação de Cotação*\n\nOlá! Gostaria de cotar:\n\n`;
    const listaTxt = selectedItensData
      .map((i, idx) => `${idx + 1}. *${i.produto_nome}* (${i.quantidade_solicitada} ${i.unidade_medida})`)
      .join("\n");

    if (fornecedor?.mensagem_padrao_cotacao) {
      message = `${fornecedor.mensagem_padrao_cotacao}\n\n${listaTxt}\n\nAguardo retorno!`;
    } else {
      message += `${listaTxt}\n\nPor favor, envie os preços unitários. Obrigado!`;
    }

    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, "_blank");
    selectedItems.forEach((id) => void handleUpdateStatus(id, "em_cotacao"));
    setIsWhatsAppDialogOpen(false);
    setSelectedItems([]);
  };

  const filteredItens = itens.filter((item) => {
    const matchStatus = filterStatus === "all" || item.status_solicitacao === filterStatus;
    const matchSearch = item.produto_nome?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (isLoading)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
              Lista de <span className="text-orange-500">Compras</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic mt-1">
              Gestão de Reposição e Cotações
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsImportTextDialogOpen(true)}
            variant="outline"
            className="h-12 rounded-2xl font-black italic uppercase text-[10px] tracking-widest border-purple-200 text-purple-600 hover:bg-purple-50 shadow-sm transition-all"
          >
            <Sparkles size={16} className="mr-2" /> IA Import
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-pink-600 hover:scale-105 transition-transform shadow-lg shadow-orange-200 text-white font-black italic uppercase text-xs tracking-widest"
          >
            <Plus size={18} className="mr-2" /> Solicitar Item
          </Button>
        </div>
      </div>

      {estoqueBaixo.length > 0 && (
        <Card className="border-0 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-[35px] shadow-sm">
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-14 h-14 rounded-[22px] bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>

            <div className="flex-1">
              <h3 className="font-black italic uppercase text-yellow-800 tracking-tight">
                {estoqueBaixo.length} Produtos em Alerta
              </h3>

              <div className="flex flex-wrap gap-2 mt-3">
                {estoqueBaixo.slice(0, 5).map((e) => {
                  const jaAdicionado = itens.some(
                    (i) => i.produto_id === e.produto_id && ["pendente", "em_cotacao"].includes(i.status_solicitacao)
                  );

                  return (
                    <button
                      key={e.id}
                      disabled={jaAdicionado}
                      onClick={async () => {
                        if (jaAdicionado) return;

                        const pId = localStorage.getItem("pId") || "";
                        if (!pId) return;

                        const qtd = Math.max(1, Number(e.estoque_minimo) - Number(e.quantidade_atual));

                        await fetch("/api/lista-compras", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "x-pizzaria-id": pId },
                          body: JSON.stringify({ produto_id: e.produto_id, quantidade_solicitada: qtd }),
                        });

                        await fetchAllData();
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-wider transition-all border ${
                        jaAdicionado
                          ? "bg-white/50 text-gray-400 border-gray-200"
                          : "bg-white text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:scale-105 shadow-sm"
                      }`}
                    >
                      + {e.produto_nome} {jaAdicionado && "(Já na Lista)"}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            className="pl-14 h-14 rounded-[24px] border-gray-100 bg-white shadow-sm font-bold text-gray-600 w-full"
            placeholder="Pesquisar pedidos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          {["all", "pendente", "em_cotacao", "aprovado"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`h-14 px-6 rounded-[24px] font-black italic uppercase text-[10px] tracking-widest whitespace-nowrap transition-all shadow-sm border ${
                filterStatus === status
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
              }`}
            >
              {status === "all"
                ? `Todos (${itens.length})`
                : `${STATUS_LABELS[status].label} (${itens.filter((i) => i.status_solicitacao === status).length})`}
            </button>
          ))}
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="bg-gray-900 rounded-[24px] p-4 flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-4">
          <span className="text-white font-black italic uppercase tracking-widest text-xs ml-4">
            {selectedItems.length} Itens Selecionados
          </span>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setSelectedItems([])} className="text-gray-300 hover:text-white">
              Cancelar
            </Button>
            <Button
              onClick={() => setIsWhatsAppDialogOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[10px] h-10 shadow-lg shadow-green-500/20"
            >
              <MessageCircle size={16} className="mr-2" /> Cotar Fornecedor
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredItens.length === 0 ? (
          <div className="text-center bg-white rounded-[45px] p-20 border border-gray-100 shadow-sm">
            <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-black italic uppercase text-gray-400 tracking-widest">Nenhum item encontrado.</p>
          </div>
        ) : (
          filteredItens.map((item) => {
            const status = STATUS_LABELS[item.status_solicitacao] || STATUS_LABELS.pendente;
            const isSelected = selectedItems.includes(item.id);
            return (
              <Card
                key={item.id}
                className={`border-gray-100 rounded-[30px] transition-all group overflow-hidden ${
                  isSelected ? "ring-2 ring-orange-500 shadow-orange-100" : "hover:shadow-lg bg-white"
                }`}
              >
                <CardContent className="p-0 flex flex-col sm:flex-row items-center">
                  <div
                    className={`p-6 flex items-center justify-center border-r border-gray-50 transition-colors cursor-pointer ${
                      isSelected ? "bg-orange-50" : "group-hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      item.status_solicitacao === "pendente" &&
                      (isSelected
                        ? setSelectedItems(selectedItems.filter((id) => id !== item.id))
                        : setSelectedItems([...selectedItems, item.id]))
                    }
                  >
                    <div
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        isSelected ? "bg-orange-500 border-orange-500" : "border-gray-300"
                      } ${item.status_solicitacao !== "pendente" ? "opacity-30 cursor-not-allowed" : ""}`}
                    >
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex items-center gap-6 w-full">
                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 ${status.bgIcon}`}>
                      {status.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black italic uppercase text-gray-900 tracking-tight text-lg leading-none">
                        {item.produto_nome}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${status.color}`}
                        >
                          {status.label}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase italic">
                          Por: {item.solicitante_nome || "Gestor"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50/50 flex items-center gap-6 border-l border-gray-50 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-center sm:text-right min-w-[80px]">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantidade</p>
                      {item.status_solicitacao === "pendente" && editingQtdId === item.id ? (
                        <div className="flex items-center justify-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                          <Input
                            type="number"
                            step="0.01"
                            value={editingQtdValue}
                            onChange={(e) => setEditingQtdValue(e.target.value)}
                            className="w-16 h-8 text-center font-black border-0 bg-transparent"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleUpdateQuantidade(item.id, editingQtdValue)}
                          />
                          <Button
                            size="icon"
                            onClick={() => handleUpdateQuantidade(item.id, editingQtdValue)}
                            className="h-8 w-8 rounded-lg bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Check size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={`font-black italic text-2xl text-gray-900 flex items-center justify-center sm:justify-end gap-2 ${
                            item.status_solicitacao === "pendente"
                              ? "cursor-pointer hover:text-orange-500 transition-colors"
                              : ""
                          }`}
                          onClick={() => {
                            if (item.status_solicitacao === "pendente") {
                              setEditingQtdId(item.id);
                              setEditingQtdValue(String(item.quantidade_solicitada));
                            }
                          }}
                        >
                          {item.quantidade_solicitada} <span className="text-xs text-gray-400">{item.unidade_medida}</span>
                          {item.status_solicitacao === "pendente" && <Edit2 size={12} className="text-gray-300" />}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1">
                      {item.status_solicitacao === "pendente" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(item.id, "em_cotacao")}
                          className="w-10 h-10 rounded-xl text-blue-500 hover:bg-blue-50"
                        >
                          <Send size={18} />
                        </Button>
                      )}
                      {item.status_solicitacao === "em_cotacao" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(item.id, "aprovado")}
                          className="w-10 h-10 rounded-xl text-green-500 hover:bg-green-50"
                        >
                          <CheckCircle2 size={18} />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        className="w-10 h-10 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 1. DIALOG ADD/SELECIONAR PRODUTOS */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl rounded-[45px] p-8 border-none shadow-2xl bg-white overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">
              {addStep === "select" ? "Selecionar Produtos" : "Definir Quantidades"}
            </DialogTitle>
            <DialogDescription className="hidden">Selecione itens</DialogDescription>
          </DialogHeader>

          {addStep === "select" ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Buscar no seu cadastro..."
                  value={produtoSearch}
                  onChange={(e) => setProdutoSearch(e.target.value)}
                  className="pl-12 h-14 rounded-2xl font-bold bg-gray-50 border-0"
                />
              </div>

              <div className="border border-gray-100 rounded-[24px] max-h-72 overflow-y-auto bg-gray-50/50 p-2">
                {produtos.filter((p) => p.nome_produto.toLowerCase().includes(produtoSearch.toLowerCase())).length ===
                0 ? (
                  <p className="p-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                    Nenhum produto encontrado
                  </p>
                ) : (
                  produtos
                    .filter((p) => p.nome_produto.toLowerCase().includes(produtoSearch.toLowerCase()))
                    .map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                          selectedProdutos.includes(p.id)
                            ? "bg-white shadow-sm border border-orange-100 ring-1 ring-orange-500"
                            : "hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProdutos.includes(p.id)}
                          onChange={() => {
                            if (selectedProdutos.includes(p.id)) {
                              setSelectedProdutos(selectedProdutos.filter((id) => id !== p.id));
                              const n = { ...produtoQtds };
                              delete n[p.id];
                              setProdutoQtds(n);
                            } else {
                              setSelectedProdutos([...selectedProdutos, p.id]);
                              setProdutoQtds({ ...produtoQtds, [p.id]: "1" });
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <div>
                          <span className="font-black italic uppercase text-gray-900 text-sm">{p.nome_produto}</span>
                          <span className="ml-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {p.categoria_produto}
                          </span>
                        </div>
                      </label>
                    ))
                )}
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="link"
                  className="text-orange-600 font-black italic uppercase text-[10px] tracking-widest"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setTimeout(() => setIsNewProductDialogOpen(true), 250);
                  }}
                >
                  <Plus size={14} className="mr-1" /> Criar Produto Novo
                </Button>
                <Button
                  onClick={() => setAddStep("quantity")}
                  disabled={selectedProdutos.length === 0}
                  className="h-12 px-8 rounded-2xl bg-gray-900 text-white font-black italic uppercase text-xs tracking-widest hover:scale-105 transition-transform"
                >
                  Próximo Passo <ArrowLeft className="rotate-180 ml-2" size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-gray-100 rounded-[24px] max-h-72 overflow-y-auto bg-gray-50/50 p-2 space-y-2">
                {selectedProdutos.map((prodId) => {
                  const p = produtos.find((x) => x.id === prodId);
                  if (!p) return null;
                  return (
                    <div
                      key={prodId}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100"
                    >
                      <span className="font-black italic uppercase text-gray-900">
                        {p.nome_produto}{" "}
                        <span className="text-xs text-gray-400 normal-case ml-1">({p.unidade_medida})</span>
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        value={produtoQtds[prodId] || "1"}
                        onChange={(e) => setProdutoQtds({ ...produtoQtds, [prodId]: e.target.value })}
                        className="w-24 h-12 text-center font-black rounded-xl bg-gray-50 border-0"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setAddStep("select")} className="flex-1 h-14 rounded-2xl font-bold uppercase text-xs text-gray-500">
                  Voltar
                </Button>
                <Button
                  onClick={handleAddMultipleItems}
                  className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-pink-600 text-white font-black italic uppercase text-xs shadow-lg shadow-orange-200"
                >
                  Confirmar {selectedProdutos.length} Itens
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. DIALOG NOVO PRODUTO (FOOD SERVICE) */}
      <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-xl rounded-[45px] p-8 border-none shadow-2xl bg-white z-[60]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">
              Novo Cadastro
            </DialogTitle>
            <DialogDescription className="hidden">Criar novo produto</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProduct} className="space-y-6">
            <div className="space-y-2 relative">
              <Label className="text-[10px] font-black uppercase text-gray-400 italic ml-2">
                Nome do Produto (Busca Inteligente)
              </Label>
              <Input
                value={newProductForm.nome_produto}
                onChange={(e) => handleProductNameChange(e.target.value)}
                onFocus={() => foodServiceSuggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Ex: Peito de Frango..."
                required
                className="h-14 rounded-2xl font-bold bg-gray-50 border-0 pl-4 pr-10"
                autoComplete="off"
              />

              {showSuggestions && foodServiceSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto p-2">
                  <div className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-1">
                    <Sparkles size={10} /> Catálogo Food Service
                  </div>
                  {foodServiceSuggestions.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => selectFoodServiceProduct(prod)}
                      className="flex items-center gap-4 p-3 hover:bg-orange-50 rounded-2xl cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 leading-tight">{prod.nome}</p>
                        <p className="text-[10px] uppercase text-gray-400 mt-1">
                          {prod.categoria} • {prod.unidadeMedida}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 italic ml-2">Categoria</Label>
                <select
                  value={newProductForm.categoria_produto}
                  onChange={(e) => setNewProductForm({ ...newProductForm, categoria_produto: e.target.value })}
                  className="h-14 w-full rounded-2xl font-bold bg-gray-50 border-0 px-4"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 italic ml-2">Unidade</Label>
                <select
                  value={newProductForm.unidade_medida}
                  onChange={(e) => setNewProductForm({ ...newProductForm, unidade_medida: e.target.value })}
                  className="h-14 w-full rounded-2xl font-bold bg-gray-50 border-0 px-4"
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!newProductForm.nome_produto}
              className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black italic uppercase tracking-widest"
            >
              Salvar Produto {pendingImportItem && "e Adicionar à Lista"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. DIALOG WHATSAPP */}
      <Dialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-md rounded-[45px] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-green-600 flex items-center gap-3">
              <MessageCircle size={28} /> Cotação Web
            </DialogTitle>
            <DialogDescription className="hidden">Enviar para whatsapp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-500">
              Escolha o fornecedor para enviar os {selectedItems.length} itens via WhatsApp:
            </p>
            {fornecedores.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-[24px] text-gray-400 text-xs font-bold uppercase">
                Nenhum fornecedor com telefone cadastrado.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {fornecedores.map((f) => (
                  <Button
                    key={f.id}
                    onClick={() => openWhatsApp(f.telefone_whatsapp, f.id)}
                    variant="outline"
                    className="w-full h-16 rounded-2xl justify-start px-4 border-gray-100 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mr-3">
                      <Send size={16} className="text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-black italic uppercase text-sm leading-none">{f.nome_fantasia}</p>
                      <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-1">{f.telefone_whatsapp}</p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. DIALOG IMPORTAR TEXTO (IA) */}
      <Dialog
        open={isImportTextDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseImportDialog();
          else setIsImportTextDialogOpen(true);
        }}
      >
        <DialogContent aria-describedby={undefined} className="max-w-2xl rounded-[45px] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-purple-600 flex items-center gap-3">
              <Sparkles size={28} /> Importação IA
            </DialogTitle>
            <DialogDescription className="hidden">Importação pela IA</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Cole sua lista do WhatsApp ou bloco de notas. A IA organiza para você.
            </p>

            {importResults.length === 0 ? (
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Ex:\nFubá 2kg\nMussarela 5kg\nCalabresa 4cx"
                className="min-h-[160px] rounded-[24px] bg-gray-50 border-0 p-6 font-medium text-gray-700 resize-none focus:ring-2 focus:ring-purple-200"
              />
            ) : (
              <div className="bg-gray-50 rounded-[24px] p-4 space-y-3 max-h-72 overflow-y-auto border border-gray-100">
                {importResults.map((r, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 text-sm p-3 rounded-2xl border bg-white ${
                      r.added ? "border-green-100" : "border-red-100 shadow-sm"
                    }`}
                  >
                    {r.added ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                        <AlertTriangle size={16} />
                      </div>
                    )}

                    <span className="font-black italic uppercase text-gray-800 flex-1">
                      {r.produto} - <span className="text-orange-500">{r.quantidade} {r.unidade}</span>
                    </span>

                    {!r.added ? (
                      <Button
                        onClick={() => openCadastroFromIA(r)}
                        className="bg-red-500 hover:bg-red-600 text-white text-[10px] uppercase font-black tracking-widest h-9 rounded-xl shadow-lg shadow-red-200"
                      >
                        <Plus size={14} className="mr-1" /> Cadastrar
                      </Button>
                    ) : (
                      <span className="text-[10px] uppercase font-black tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                        Lançado
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <DialogFooter className="mt-6 gap-3">
              {importResults.length > 0 && (
                <Button variant="outline" onClick={handleCloseImportDialog} className="h-14 rounded-2xl flex-1 font-bold">
                  Fechar Resumo
                </Button>
              )}
              {importResults.length === 0 && (
                <Button
                  onClick={handleImportText}
                  disabled={!importText || isImportingText}
                  className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black italic uppercase text-xs tracking-widest shadow-xl shadow-purple-200"
                >
                  {isImportingText ? (
                    <>
                      <Loader2 className="animate-spin mr-2" /> Lendo Textos...
                    </>
                  ) : (
                    "Processar Lista"
                  )}
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
