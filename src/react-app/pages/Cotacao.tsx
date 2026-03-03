import { useState, useEffect } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/react-app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import { Textarea } from "@/react-app/components/ui/textarea";
import {
  Loader2,
  Plus,
  Send,
  MessageSquare,
  CheckCircle2,
  FileText,
  Trophy,
  ShoppingCart,
  X,
  Sparkles,
  Trash2,
  Edit2,
  Check,
  Ban,
} from "lucide-react";

interface Produto {
  id: number;
  nome_produto: string;
  unidade_medida: string;
}

interface Fornecedor {
  id: number;
  nome_fantasia: string;
  telefone_whatsapp: string;
  mensagem_padrao_cotacao?: string;
  contato_nome?: string;
}

interface ListaCompra {
  id: number;
  produto_id: number;
  quantidade_solicitada: number;
  produto_nome: string;
  unidade_medida: string;
}

interface Cotacao {
  id: number;
  titulo: string;
  status: string;
  data_abertura: string;
  data_fechamento: string | null;
  observacao: string | null;
}

interface CotacaoItem {
  id: number;
  cotacao_id: number;
  produto_id: number;
  quantidade: number;
  produto_nome?: string;
  unidade_medida?: string;
  unidade_compra?: string;
  fator_conversao?: number;
}

// IDs de produtos que já estão em cotações ativas
interface ProdutosEmCotacao {
  [produtoId: number]: number[]; // produto_id -> array de cotacao_ids
}

interface CotacaoFornecedor {
  id: number;
  cotacao_id: number;
  fornecedor_id: number;
  status: string;
  fornecedor_nome?: string;
  telefone_whatsapp?: string;
  mensagem_padrao_cotacao?: string;
  contato_nome?: string;
}

interface CotacaoPreco {
  id: number;
  cotacao_id: number;
  fornecedor_id: number;
  produto_id: number;
  preco_unitario: number | null;
  prazo_entrega: number | null;
  is_vencedor: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aberta: { label: "Aberta", color: "bg-blue-100 text-blue-700" },
  em_cotacao: { label: "Em Cotação", color: "bg-yellow-100 text-yellow-700" },
  fechada: { label: "Fechada", color: "bg-green-100 text-green-700" },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700" },
};

export default function CotacaoPage() {
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [listaCompras, setListaCompras] = useState<ListaCompra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Dialog states
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState<Cotacao | null>(null);
  const [cotacaoItens, setCotacaoItens] = useState<CotacaoItem[]>([]);
  const [cotacaoFornecedores, setCotacaoFornecedores] = useState<CotacaoFornecedor[]>([]);
  const [cotacaoPrecos, setCotacaoPrecos] = useState<CotacaoPreco[]>([]);

  // New cotacao form
  const [newForm, setNewForm] = useState({
    titulo: "",
    observacao: "",
    itens: [] as { produto_id: number; quantidade: number; produto_nome: string; unidade: string }[],
    fornecedor_ids: [] as number[],
  });
  const [produtoManual, setProdutoManual] = useState({ produto_id: "", quantidade: "1" });
  const [extractingFornecedor, setExtractingFornecedor] = useState<number | null>(null);
  
  // Edição de itens existentes
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemQtd, setEditingItemQtd] = useState<string>("");
  const [editingItemUnidade, setEditingItemUnidade] = useState<string>("");
  const [editingItemUnidadeCompra, setEditingItemUnidadeCompra] = useState<string>("");
  const [editingItemFator, setEditingItemFator] = useState<string>("1");
  
  // Adicionar item a cotação existente
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [addItemProduto, setAddItemProduto] = useState("");
  const [addItemQtd, setAddItemQtd] = useState("1");
  const [addItemUnidade, setAddItemUnidade] = useState("un");
  
  // Produtos em cotações ativas
  const [produtosEmCotacao, setProdutosEmCotacao] = useState<ProdutosEmCotacao>({});

  const fetchCotacoes = async () => {
    try {
      const res = await fetch("/api/cotacoes");
      if (res.ok) {
        const data = await res.json();
        setCotacoes(data);
      }
    } catch (err) {
      console.error("Erro ao carregar cotações:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [prodRes, fornRes, listaRes] = await Promise.all([
        fetch("/api/produtos"),
        fetch("/api/fornecedores"),
        fetch("/api/lista-compras?status=pendente,em_cotacao"),
      ]);

      if (prodRes.ok) setProdutos(await prodRes.json());
      if (fornRes.ok) setFornecedores(await fornRes.json());
      if (listaRes.ok) setListaCompras(await listaRes.json());
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  const fetchCotacaoDetails = async (cotacaoId: number) => {
    try {
      const [itensRes, fornRes, precosRes] = await Promise.all([
        fetch(`/api/cotacoes/${cotacaoId}/itens`),
        fetch(`/api/cotacoes/${cotacaoId}/fornecedores`),
        fetch(`/api/cotacoes/${cotacaoId}/precos`),
      ]);

      if (itensRes.ok) setCotacaoItens(await itensRes.json());
      if (fornRes.ok) setCotacaoFornecedores(await fornRes.json());
      if (precosRes.ok) setCotacaoPrecos(await precosRes.json());
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
    }
  };

  // Buscar produtos que já estão em cotações ativas
  const fetchProdutosEmCotacao = async () => {
    try {
      const cotacoesAtivas = cotacoes.filter(c => ['aberta', 'em_cotacao'].includes(c.status));
      const produtoMap: ProdutosEmCotacao = {};
      
      for (const cot of cotacoesAtivas) {
        const res = await fetch(`/api/cotacoes/${cot.id}/itens`);
        if (res.ok) {
          const itens = await res.json();
          for (const item of itens) {
            if (!produtoMap[item.produto_id]) {
              produtoMap[item.produto_id] = [];
            }
            if (!produtoMap[item.produto_id].includes(cot.id)) {
              produtoMap[item.produto_id].push(cot.id);
            }
          }
        }
      }
      setProdutosEmCotacao(produtoMap);
    } catch (err) {
      console.error("Erro ao buscar produtos em cotação:", err);
    }
  };

  // Excluir cotação
  const handleDeleteCotacao = async (cotacaoId: number) => {
    if (!confirm("Tem certeza que deseja excluir esta cotação?")) return;
    
    try {
      const res = await fetch(`/api/cotacoes/${cotacaoId}`, { method: "DELETE" });
      if (res.ok) {
        setIsDetailDialogOpen(false);
        fetchCotacoes();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  // Cancelar cotação
  const handleCancelarCotacao = async () => {
    if (!selectedCotacao) return;
    if (!confirm("Tem certeza que deseja cancelar esta cotação?")) return;
    
    try {
      const res = await fetch(`/api/cotacoes/${selectedCotacao.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelada" }),
      });
      
      if (res.ok) {
        fetchCotacoes();
        setSelectedCotacao({ ...selectedCotacao, status: "cancelada" });
      }
    } catch (err) {
      alert("Erro ao cancelar");
    }
  };

  // Editar item da cotação (quantidade e unidade)
  const handleSaveItemEdit = async (itemId: number) => {
    if (!selectedCotacao) return;
    
    try {
      const res = await fetch(`/api/cotacoes/${selectedCotacao.id}/itens/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantidade: parseFloat(editingItemQtd) || 1,
          unidade_medida: editingItemUnidade || "un",
          unidade_compra: editingItemUnidadeCompra || null,
          fator_conversao: parseFloat(editingItemFator) || 1,
        }),
      });
      
      if (res.ok) {
        await fetchCotacaoDetails(selectedCotacao.id);
        setEditingItemId(null);
        setEditingItemUnidadeCompra("");
        setEditingItemFator("1");
      }
    } catch (err) {
      alert("Erro ao salvar");
    }
  };

  // Adicionar item a cotação existente
  const handleAddItemToCotacao = async () => {
    if (!selectedCotacao || !addItemProduto) return;
    
    try {
      const res = await fetch(`/api/cotacoes/${selectedCotacao.id}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: parseInt(addItemProduto),
          quantidade: parseFloat(addItemQtd) || 1,
          unidade_medida: addItemUnidade || "un",
        }),
      });
      
      if (res.ok) {
        await fetchCotacaoDetails(selectedCotacao.id);
        setIsAddItemDialogOpen(false);
        setAddItemProduto("");
        setAddItemQtd("1");
        setAddItemUnidade("un");
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao adicionar");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  // Remover item de cotação
  const handleRemoveItemFromCotacao = async (itemId: number) => {
    if (!selectedCotacao) return;
    if (!confirm("Remover este item da cotação?")) return;
    
    try {
      const res = await fetch(`/api/cotacoes/${selectedCotacao.id}/itens/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchCotacaoDetails(selectedCotacao.id);
      }
    } catch (err) {
      alert("Erro ao remover");
    }
  };

  useEffect(() => {
    fetchCotacoes();
    fetchData();
  }, []);

  useEffect(() => {
    if (cotacoes.length > 0) {
      fetchProdutosEmCotacao();
    }
  }, [cotacoes]);

  const handleOpenDetail = async (cotacao: Cotacao) => {
    setSelectedCotacao(cotacao);
    await fetchCotacaoDetails(cotacao.id);
    setIsDetailDialogOpen(true);
  };

  const handleCreateCotacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newForm.itens.length === 0 || newForm.fornecedor_ids.length === 0) {
      alert("Selecione pelo menos um item e um fornecedor");
      return;
    }

    try {
      const res = await fetch("/api/cotacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });

      if (res.ok) {
        setIsNewDialogOpen(false);
        setNewForm({ titulo: "", observacao: "", itens: [], fornecedor_ids: [] });
        fetchCotacoes();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar cotação");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  const handleAddItemFromLista = (item: ListaCompra) => {
    if (newForm.itens.find((i) => i.produto_id === item.produto_id)) return;
    setNewForm({
      ...newForm,
      itens: [
        ...newForm.itens,
        {
          produto_id: item.produto_id,
          quantidade: item.quantidade_solicitada,
          produto_nome: item.produto_nome,
          unidade: item.unidade_medida,
        },
      ],
    });
  };

  const handleRemoveItem = (produtoId: number) => {
    setNewForm({
      ...newForm,
      itens: newForm.itens.filter((i) => i.produto_id !== produtoId),
    });
  };

  const handleAddProdutoManual = () => {
    const prodId = parseInt(produtoManual.produto_id);
    const qty = parseFloat(produtoManual.quantidade) || 1;
    if (!prodId) return;
    if (newForm.itens.find((i) => i.produto_id === prodId)) return;
    
    const produto = produtos.find(p => p.id === prodId);
    if (!produto) return;
    
    setNewForm({
      ...newForm,
      itens: [
        ...newForm.itens,
        {
          produto_id: prodId,
          quantidade: qty,
          produto_nome: produto.nome_produto,
          unidade: produto.unidade_medida || "un",
        },
      ],
    });
    setProdutoManual({ produto_id: "", quantidade: "1" });
  };

  const handleToggleFornecedor = (fornecedorId: number) => {
    const ids = newForm.fornecedor_ids;
    if (ids.includes(fornecedorId)) {
      setNewForm({ ...newForm, fornecedor_ids: ids.filter((id) => id !== fornecedorId) });
    } else {
      setNewForm({ ...newForm, fornecedor_ids: [...ids, fornecedorId] });
    }
  };

  const handleUpdatePreco = async (
    fornecedorId: number,
    produtoId: number,
    preco: number | null
  ) => {
    if (!selectedCotacao) return;

    try {
      await fetch(`/api/cotacoes/${selectedCotacao.id}/precos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fornecedor_id: fornecedorId, produto_id: produtoId, preco_unitario: preco }),
      });
      await fetchCotacaoDetails(selectedCotacao.id);
    } catch (err) {
      console.error("Erro ao atualizar preço:", err);
    }
  };

  const handleFinalizarCotacao = async () => {
    if (!selectedCotacao) return;

    try {
      const res = await fetch(`/api/cotacoes/${selectedCotacao.id}/finalizar`, {
        method: "POST",
      });

      if (res.ok) {
        fetchCotacoes();
        await fetchCotacaoDetails(selectedCotacao.id);
        setSelectedCotacao({ ...selectedCotacao, status: "fechada" });
      }
    } catch (err) {
      console.error("Erro ao finalizar:", err);
    }
  };

  const handleReabrirCotacao = async () => {
    if (!selectedCotacao) return;
    
    if (!confirm("Deseja reabrir esta cotação? Os vencedores serão desmarcados.")) return;

    try {
      const res = await fetch(`/api/cotacoes/${selectedCotacao.id}/reabrir`, {
        method: "POST",
      });

      if (res.ok) {
        fetchCotacoes();
        await fetchCotacaoDetails(selectedCotacao.id);
        setSelectedCotacao({ ...selectedCotacao, status: "em_cotacao" });
      }
    } catch (err) {
      console.error("Erro ao reabrir:", err);
    }
  };

  const generateWhatsAppCotacao = (fornecedor: CotacaoFornecedor, itens: CotacaoItem[]) => {
    const listaItens = itens
      .map((i) => `• ${i.produto_nome} - ${i.quantidade} ${i.unidade_medida || "un"}`)
      .join("\n");
    
    // Usa mensagem padrão do fornecedor se existir, senão usa mensagem padrão
    const fornecedorData = fornecedores.find(f => f.id === fornecedor.fornecedor_id);
    const msgPadrao = fornecedorData?.mensagem_padrao_cotacao;
    const nomeContato = fornecedorData?.contato_nome || fornecedor.fornecedor_nome;
    
    const msg = msgPadrao 
      ? `${msgPadrao}\n\n${listaItens}\n\nAguardo retorno.`
      : `Olá, ${nomeContato}, gostaria de solicitar cotação dos seguintes produtos:\n\n${listaItens}\n\nAguardo retorno com valores e prazo de entrega.`;
    
    const phone = (fornecedor.telefone_whatsapp || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const generateWhatsAppPedido = (fornecedor: CotacaoFornecedor, itensVencedores: CotacaoPreco[]) => {
    const listaItens = itensVencedores
      .map((p) => {
        const item = cotacaoItens.find((i) => i.produto_id === p.produto_id);
        return `• ${item?.produto_nome} - ${item?.quantidade} ${item?.unidade_medida || "un"} @ R$ ${p.preco_unitario?.toFixed(2)}`;
      })
      .join("\n");
    const fornecedorInfo = fornecedores.find(f => f.id === fornecedor.fornecedor_id);
    const nomeContatoPedido = fornecedorInfo?.contato_nome || fornecedor.fornecedor_nome;
    const msg = `Olá, ${nomeContatoPedido}, pedido aprovado! Segue a lista:\n\n${listaItens}\n\nFavor enviar a NF e o boleto no ato da entrega.`;
    const phone = (fornecedor.telefone_whatsapp || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  // Calcula o menor preço por produto
  const getMenorPreco = (produtoId: number): number | null => {
    const precos = cotacaoPrecos
      .filter((p) => p.produto_id === produtoId && p.preco_unitario != null)
      .map((p) => p.preco_unitario!);
    return precos.length > 0 ? Math.min(...precos) : null;
  };

  // Extrai preços de arquivo (PDF/imagem) via IA
  const handleExtractPrices = async (fornecedorId: number, file: File) => {
    if (!selectedCotacao) return;
    
    setExtractingFornecedor(fornecedorId);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Envia lista de produtos para a IA identificar
      const produtosNomes = cotacaoItens.map((i) => i.produto_nome);
      formData.append("produtos", JSON.stringify(produtosNomes));
      
      const res = await fetch("/api/ia/ler-cotacao", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao processar arquivo");
        return;
      }
      
      const data = await res.json();
      
      if (data.precos && Array.isArray(data.precos)) {
        // Para cada preço extraído, atualizar na cotação
        for (const p of data.precos) {
          const item = cotacaoItens.find(
            (i) => i.produto_nome?.toLowerCase() === p.produto?.toLowerCase()
          );
          if (item && p.preco_unitario != null) {
            await handleUpdatePreco(fornecedorId, item.produto_id, p.preco_unitario);
          }
        }
        
        // Recarregar dados
        await fetchCotacaoDetails(selectedCotacao.id);
        alert(`${data.precos.length} preço(s) extraído(s) com sucesso!`);
      } else {
        alert("Não foi possível identificar preços no arquivo");
      }
    } catch (err) {
      console.error("Erro ao extrair preços:", err);
      alert("Erro ao processar arquivo");
    } finally {
      setExtractingFornecedor(null);
    }
  };

  const filteredCotacoes = cotacoes.filter((c) => {
    if (filterStatus === "all") return true;
    return c.status === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Cotações</h1>
          <p className="text-sm sm:text-base text-gray-600">Compare preços e escolha os melhores fornecedores</p>
        </div>
        <Button onClick={() => setIsNewDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Cotação
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="aberta">Abertas</SelectItem>
            <SelectItem value="em_cotacao">Em Cotação</SelectItem>
            <SelectItem value="fechada">Fechadas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de cotações */}
      {filteredCotacoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma cotação encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCotacoes.map((cotacao) => {
            const statusInfo = STATUS_LABELS[cotacao.status] || STATUS_LABELS.aberta;
            return (
              <Card key={cotacao.id} className="hover:shadow-md transition cursor-pointer dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div onClick={() => handleOpenDetail(cotacao)} className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{cotacao.titulo}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(cotacao.data_abertura).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {(cotacao.status === "cancelada" || cotacao.status === "aberta") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCotacao(cotacao.id);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Excluir cotação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Nova Cotação */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Cotação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCotacao} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <Input
                value={newForm.titulo}
                onChange={(e) => setNewForm({ ...newForm, titulo: e.target.value })}
                placeholder="Ex: Cotação semanal de insumos"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Itens da Cotação ({newForm.itens.length})
              </label>
              
              {/* Adicionar produto do catálogo */}
              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Adicionar produto do catálogo:</p>
                <div className="flex gap-2">
                  <Select
                    value={produtoManual.produto_id}
                    onValueChange={(v) => setProdutoManual({ ...produtoManual, produto_id: v })}
                  >
                    <SelectTrigger className="flex-1 bg-white">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.filter(p => !newForm.itens.some(i => i.produto_id === p.id)).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nome_produto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={produtoManual.quantidade}
                    onChange={(e) => setProdutoManual({ ...produtoManual, quantidade: e.target.value })}
                    className="w-24 bg-white"
                    placeholder="Qtd"
                  />
                  <Button type="button" onClick={handleAddProdutoManual} disabled={!produtoManual.produto_id}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Itens da lista de compras */}
              {listaCompras.length > 0 && (
                <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">Ou adicionar da lista de compras pendentes:</p>
                  <div className="flex flex-wrap gap-2">
                    {listaCompras.map((l) => {
                      const emCotacao = produtosEmCotacao[l.produto_id];
                      const jaAdicionado = newForm.itens.some((i) => i.produto_id === l.produto_id);
                      return (
                        <Button
                          key={l.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddItemFromLista(l)}
                          disabled={jaAdicionado}
                          className={`${
                            emCotacao && emCotacao.length > 0
                              ? "bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300"
                              : "bg-white dark:bg-gray-800"
                          }`}
                          title={emCotacao && emCotacao.length > 0 ? `Já em ${emCotacao.length} cotação(ões)` : ""}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {l.produto_nome} ({l.quantidade_solicitada} {l.unidade_medida})
                          {emCotacao && emCotacao.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-200 dark:bg-purple-700 rounded-full">
                              {emCotacao.length}
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
              {newForm.itens.length > 0 && (
                <div className="space-y-2">
                  {newForm.itens.map((item) => (
                    <div key={item.produto_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1">{item.produto_nome}</span>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantidade}
                        onChange={(e) => {
                          const updated = newForm.itens.map((i) =>
                            i.produto_id === item.produto_id
                              ? { ...i, quantidade: parseFloat(e.target.value) || 0 }
                              : i
                          );
                          setNewForm({ ...newForm, itens: updated });
                        }}
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">{item.unidade}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.produto_id)}
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fornecedores ({newForm.fornecedor_ids.length})
              </label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                {fornecedores.map((f) => (
                  <Button
                    key={f.id}
                    type="button"
                    variant={newForm.fornecedor_ids.includes(f.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleFornecedor(f.id)}
                    className={newForm.fornecedor_ids.includes(f.id) ? "bg-orange-600 hover:bg-orange-700" : ""}
                  >
                    {f.nome_fantasia}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
              <Textarea
                value={newForm.observacao}
                onChange={(e) => setNewForm({ ...newForm, observacao: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsNewDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                Criar Cotação
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes da Cotação */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedCotacao?.titulo}
              {selectedCotacao && (
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_LABELS[selectedCotacao.status]?.color}`}>
                  {STATUS_LABELS[selectedCotacao.status]?.label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedCotacao && (
            <div className="mt-4 space-y-6">
              {/* Botões de ação WhatsApp - Enviar cotação */}
              {selectedCotacao.status === "aberta" || selectedCotacao.status === "em_cotacao" ? (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                      <MessageSquare className="w-4 h-4" />
                      Enviar Cotação via WhatsApp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {cotacaoFornecedores.map((f) => (
                        <a
                          key={f.id}
                          href={generateWhatsAppCotacao(f, cotacaoItens)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" className="bg-white">
                            <Send className="w-3 h-3 mr-1 text-green-600" />
                            {f.fornecedor_nome}
                          </Button>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Interface de preços - Cards para mobile, Tabela para desktop */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Comparação de Preços</h4>
                
                {/* Layout Mobile: Cards */}
                <div className="md:hidden space-y-4">
                  {cotacaoItens.map((item) => {
                    const menorPreco = getMenorPreco(item.produto_id);
                    const canEdit = selectedCotacao?.status === "aberta" || selectedCotacao?.status === "em_cotacao";
                    
                    return (
                      <Card key={item.id} className="dark:bg-gray-800">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">{item.produto_nome}</h5>
                              <p className="text-sm text-gray-500">{item.quantidade} {item.unidade_medida || "un"}</p>
                            </div>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItemFromCotacao(item.id)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {cotacaoFornecedores.map((f) => {
                              const preco = cotacaoPrecos.find(
                                (p) => p.fornecedor_id === f.fornecedor_id && p.produto_id === item.produto_id
                              );
                              const isMenor = preco?.preco_unitario != null && preco.preco_unitario === menorPreco;
                              const isVencedor = preco?.is_vencedor === 1;
                              
                              return (
                                <div key={f.id} className={`flex items-center justify-between p-2 rounded-lg ${
                                  isVencedor ? "bg-green-100 dark:bg-green-900/30" : 
                                  isMenor ? "bg-green-50 dark:bg-green-900/20" : 
                                  "bg-gray-50 dark:bg-gray-700"
                                }`}>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                                    {f.fornecedor_nome}
                                    {isVencedor && <Trophy className="w-3 h-3 inline ml-1 text-green-600" />}
                                  </span>
                                  {selectedCotacao.status === "fechada" ? (
                                    <span className={`font-semibold ${isVencedor ? "text-green-700" : "text-gray-900 dark:text-white"}`}>
                                      {preco?.preco_unitario != null ? `R$ ${preco.preco_unitario.toFixed(2)}` : "-"}
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500">R$</span>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        inputMode="decimal"
                                        value={preco?.preco_unitario ?? ""}
                                        onChange={(e) => {
                                          const val = e.target.value ? parseFloat(e.target.value) : null;
                                          handleUpdatePreco(f.fornecedor_id, item.produto_id, val);
                                        }}
                                        className={`w-28 text-right text-lg font-semibold ${
                                          isMenor ? "border-green-500 bg-green-50 dark:bg-green-900/30" : ""
                                        }`}
                                        placeholder="0,00"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Importar preços por fornecedor */}
                          {canEdit && cotacaoFornecedores.length > 0 && (
                            <div className="mt-3 pt-3 border-t dark:border-gray-600">
                              <p className="text-xs text-gray-500 mb-2">Importar preços via foto:</p>
                              <div className="flex flex-wrap gap-2">
                                {cotacaoFornecedores.map((f) => (
                                  <label key={f.id} className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleExtractPrices(f.fornecedor_id, file);
                                        e.target.value = "";
                                      }}
                                      disabled={extractingFornecedor !== null}
                                    />
                                    {extractingFornecedor === f.fornecedor_id ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Extraindo...
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                                        <Sparkles className="w-3 h-3" />
                                        {f.fornecedor_nome?.substring(0, 10)}...
                                      </span>
                                    )}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {/* Layout Desktop: Tabela */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Produto</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Qtd</th>
                        {cotacaoFornecedores.map((f) => (
                          <th key={f.id} className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                            <div className="flex flex-col items-center gap-1">
                              <span>{f.fornecedor_nome}</span>
                              {(selectedCotacao?.status === "aberta" || selectedCotacao?.status === "em_cotacao") && (
                                <label className="cursor-pointer" title="Envie uma imagem ou PDF da cotação">
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleExtractPrices(f.fornecedor_id, file);
                                      e.target.value = "";
                                    }}
                                    disabled={extractingFornecedor !== null}
                                  />
                                  {extractingFornecedor === f.fornecedor_id ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Extraindo...
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                                      <Sparkles className="w-3 h-3" />
                                      Importar preços
                                    </span>
                                  )}
                                </label>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {cotacaoItens.map((item) => {
                        const menorPreco = getMenorPreco(item.produto_id);
                        const isEditing = editingItemId === item.id;
                        const canEdit = selectedCotacao?.status === "aberta" || selectedCotacao?.status === "em_cotacao";
                        
                        return (
                          <tr key={item.id} className="dark:bg-gray-800">
                            <td className="px-3 py-2 font-medium dark:text-white">
                              <div className="flex items-center gap-2">
                                {item.produto_nome}
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItemFromCotacao(item.id)}
                                    className="text-red-400 hover:text-red-600 p-1 h-6"
                                    title="Remover item"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {isEditing ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1 justify-center">
                                    <Input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={editingItemQtd}
                                      onChange={(e) => setEditingItemQtd(e.target.value)}
                                      className="w-14 text-center text-sm"
                                      title="Quantidade pedida"
                                    />
                                    <Input
                                      value={editingItemUnidade}
                                      onChange={(e) => setEditingItemUnidade(e.target.value)}
                                      className="w-12 text-center text-sm"
                                      placeholder="un"
                                      title="Unidade do pedido"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1 justify-center text-xs text-gray-500">
                                    <span>=</span>
                                    <Input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={editingItemFator}
                                      onChange={(e) => setEditingItemFator(e.target.value)}
                                      className="w-12 text-center text-xs h-6"
                                      title="Fator de conversão (ex: 1 pc = 4 kg)"
                                    />
                                    <Input
                                      value={editingItemUnidadeCompra}
                                      onChange={(e) => setEditingItemUnidadeCompra(e.target.value)}
                                      className="w-10 text-center text-xs h-6"
                                      placeholder="kg"
                                      title="Unidade do preço"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1 justify-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSaveItemEdit(item.id)}
                                      className="text-green-600 p-1 h-6"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingItemId(null)}
                                      className="text-gray-400 p-1 h-6"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`flex flex-col items-center gap-0.5 ${canEdit ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1" : ""}`}
                                  onClick={() => {
                                    if (canEdit) {
                                      setEditingItemId(item.id);
                                      setEditingItemQtd(String(item.quantidade));
                                      setEditingItemUnidade(item.unidade_medida || "un");
                                      setEditingItemUnidadeCompra(item.unidade_compra || "");
                                      setEditingItemFator(String(item.fator_conversao || 1));
                                    }
                                  }}
                                  title={canEdit ? "Clique para editar qtd e conversão" : ""}
                                >
                                  <span>{item.quantidade} {item.unidade_medida || "un"}</span>
                                  {item.unidade_compra && item.fator_conversao && item.fator_conversao !== 1 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      = {(item.quantidade * item.fator_conversao).toFixed(2)} {item.unidade_compra}
                                    </span>
                                  )}
                                  {canEdit && <Edit2 className="w-3 h-3 text-gray-400" />}
                                </div>
                              )}
                            </td>
                            {cotacaoFornecedores.map((f) => {
                              const preco = cotacaoPrecos.find(
                                (p) => p.fornecedor_id === f.fornecedor_id && p.produto_id === item.produto_id
                              );
                              const isMenor = preco?.preco_unitario != null && preco.preco_unitario === menorPreco;
                              const isVencedor = preco?.is_vencedor === 1;
                              return (
                                <td key={f.id} className="px-3 py-2 text-center">
                                  {selectedCotacao.status === "fechada" ? (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                                        isVencedor
                                          ? "bg-green-100 text-green-700 font-bold"
                                          : isMenor
                                          ? "bg-green-50 text-green-600"
                                          : ""
                                      }`}
                                    >
                                      {isVencedor && <Trophy className="w-3 h-3" />}
                                      {preco?.preco_unitario != null
                                        ? `R$ ${preco.preco_unitario.toFixed(2)}`
                                        : "-"}
                                    </span>
                                  ) : (
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      inputMode="decimal"
                                      value={preco?.preco_unitario ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value ? parseFloat(e.target.value) : null;
                                        handleUpdatePreco(f.fornecedor_id, item.produto_id, val);
                                      }}
                                      className={`w-32 text-center text-base ${isMenor ? "border-green-500 bg-green-50 dark:bg-green-900/30" : ""}`}
                                      placeholder="R$ 0,00"
                                    />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botões de ação */}
              {(selectedCotacao.status === "aberta" || selectedCotacao.status === "em_cotacao") && (
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddItemDialogOpen(true)}
                      className="dark:bg-gray-700 dark:border-gray-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Item
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelarCotacao}
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Cancelar Cotação
                    </Button>
                  </div>
                  <Button
                    onClick={handleFinalizarCotacao}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={cotacaoPrecos.filter((p) => p.preco_unitario != null).length === 0}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Finalizar e Selecionar Vencedores
                  </Button>
                </div>
              )}
              
              {/* Botão excluir para cotações canceladas */}
              {selectedCotacao.status === "cancelada" && (
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteCotacao(selectedCotacao.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Cotação
                  </Button>
                </div>
              )}

              {/* Pedidos vencedores */}
              {selectedCotacao.status === "fechada" && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-400">
                      <ShoppingCart className="w-4 h-4" />
                      Enviar Pedido via WhatsApp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {cotacaoFornecedores.map((f) => {
                        const itensVencedores = cotacaoPrecos.filter(
                          (p) => p.fornecedor_id === f.fornecedor_id && p.is_vencedor === 1
                        );
                        if (itensVencedores.length === 0) return null;
                        return (
                          <a
                            key={f.id}
                            href={generateWhatsAppPedido(f, itensVencedores)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button className="bg-orange-600 hover:bg-orange-700">
                              <Send className="w-3 h-3 mr-1" />
                              {f.fornecedor_nome} ({itensVencedores.length} itens)
                            </Button>
                          </a>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Botão Reabrir Cotação */}
              {selectedCotacao.status === "fechada" && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleReabrirCotacao}
                    className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Reabrir para Edição
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Item a Cotação Existente */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Adicionar Item à Cotação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produto</label>
              <Select value={addItemProduto} onValueChange={setAddItemProduto}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos
                    .filter((p) => !cotacaoItens.some((i) => i.produto_id === p.id))
                    .map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nome_produto}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade</label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={addItemQtd}
                  onChange={(e) => setAddItemQtd(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
                <Input
                  value={addItemUnidade}
                  onChange={(e) => setAddItemUnidade(e.target.value)}
                  placeholder="un, kg, cx, fardo..."
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddItemDialogOpen(false)}
                className="flex-1 dark:bg-gray-700 dark:border-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddItemToCotacao}
                disabled={!addItemProduto}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
