import { useState, useEffect, useCallback } from "react";

// Função debounce simples
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
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
  ClipboardPaste,
  Sparkles,
  Edit2,
  Check,
  Search,
} from "lucide-react";
import { Textarea } from "@/react-app/components/ui/textarea";
import { DialogFooter } from "@/react-app/components/ui/dialog";

interface Produto {
  id: number;
  nome_produto: string;
  categoria_produto: string;
  unidade_medida: string;
  ultimo_preco_pago: number | null;
  fornecedor_preferencial_id?: number | null;
}

interface Fornecedor {
  id: number;
  nome_fantasia: string;
  telefone_whatsapp: string;
  categoria_principal: string;
  mensagem_padrao_cotacao?: string;
}

interface Estoque {
  id: number;
  produto_id: number;
  quantidade_atual: number;
  estoque_minimo: number;
  produto_nome: string;
  unidade_medida: string;
}

interface ItemListaCompras {
  id: number;
  produto_id: number;
  quantidade_solicitada: number;
  status_solicitacao: string;
  data_solicitacao: string;
  usuario_solicitante_id: number;
  produto_nome?: string;
  unidade_medida?: string;
  solicitante_nome?: string;
}

const CATEGORIAS = ["Insumos", "Embalagens", "Bebidas", "Mercado", "Limpeza", "Outros"];
const UNIDADES = ["un", "kg", "g", "L", "ml", "cx", "pct", "fd"];

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Clock className="w-3 h-3" />,
  },
  em_cotacao: {
    label: "Em Cotação",
    color: "bg-blue-100 text-blue-700",
    icon: <Send className="w-3 h-3" />,
  },
  aprovado: {
    label: "Aprovado",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function ListaComprasPage() {
  const [itens, setItens] = useState<ItemListaCompras[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [estoqueBaixo, setEstoqueBaixo] = useState<Estoque[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [isImportTextDialogOpen, setIsImportTextDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  // Import text states
  const [importText, setImportText] = useState("");
  const [isImportingText, setIsImportingText] = useState(false);
  const [importResults, setImportResults] = useState<Array<{produto: string; quantidade: number; unidade: string; added: boolean}>>([]);
  
  
  
  // Estados para edição inline de quantidade
  const [editingQtdId, setEditingQtdId] = useState<number | null>(null);
  const [editingQtdValue, setEditingQtdValue] = useState("");
  
  // Estados para seleção múltipla de produtos
  const [selectedProdutos, setSelectedProdutos] = useState<number[]>([]);
  const [produtoQtds, setProdutoQtds] = useState<Record<number, string>>({});
  const [produtoSearch, setProdutoSearch] = useState("");
  const [addStep, setAddStep] = useState<"select" | "quantity">("select");
  
  const [newProductForm, setNewProductForm] = useState({
    nome_produto: "",
    categoria_produto: "Insumos",
    unidade_medida: "un",
    fornecedor_preferencial_id: "",
    codigo_barras: "",
  });
  
  // Busca Open Food Facts
  const [offSuggestions, setOffSuggestions] = useState<Array<{
    code: string;
    product_name: string;
    brands: string;
    categories: string;
    image_url: string;
  }>>([]);
  const [isSearchingOFF, setIsSearchingOFF] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchItens = async () => {
    try {
      const res = await fetch("/api/lista-compras");
      if (res.ok) {
        const data = await res.json();
        setItens(data);
      }
    } catch (err) {
      console.error("Erro ao carregar lista:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProdutos = async () => {
    try {
      const res = await fetch("/api/produtos");
      if (res.ok) {
        const data = await res.json();
        setProdutos(data);
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    }
  };

  const fetchFornecedores = async () => {
    try {
      const res = await fetch("/api/fornecedores");
      if (res.ok) {
        const data = await res.json();
        setFornecedores(data.filter((f: Fornecedor) => f.telefone_whatsapp));
      }
    } catch (err) {
      console.error("Erro ao carregar fornecedores:", err);
    }
  };

  const fetchEstoqueBaixo = async () => {
    try {
      const res = await fetch("/api/estoque");
      if (res.ok) {
        const data: Estoque[] = await res.json();
        setEstoqueBaixo(data.filter((e) => e.quantidade_atual <= e.estoque_minimo));
      }
    } catch (err) {
      console.error("Erro ao carregar estoque:", err);
    }
  };

  useEffect(() => {
    fetchItens();
    fetchProdutos();
    fetchFornecedores();
    fetchEstoqueBaixo();
  }, []);

  

  // Buscar sugestões no Open Food Facts
  const searchOFFDebounced = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setOffSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      setIsSearchingOFF(true);
      try {
        const res = await fetch(`/api/openfoodfacts/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setOffSuggestions(data.products || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Erro ao buscar OFF:", err);
      } finally {
        setIsSearchingOFF(false);
      }
    }, 500),
    []
  );

  const handleProductNameChange = (value: string) => {
    setNewProductForm({ ...newProductForm, nome_produto: value });
    searchOFFDebounced(value);
  };

  const selectOFFProduct = (product: typeof offSuggestions[0]) => {
    setNewProductForm({
      ...newProductForm,
      nome_produto: product.product_name + (product.brands ? ` - ${product.brands}` : ""),
      codigo_barras: product.code,
    });
    setShowSuggestions(false);
    setOffSuggestions([]);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProductForm,
          fornecedor_preferencial_id: newProductForm.fornecedor_preferencial_id && newProductForm.fornecedor_preferencial_id !== "none"
            ? parseInt(newProductForm.fornecedor_preferencial_id) 
            : null,
        }),
      });

      if (res.ok) {
        const novoProduto = await res.json();
        setIsNewProductDialogOpen(false);
        setNewProductForm({
          nome_produto: "",
          categoria_produto: "Insumos",
          unidade_medida: "un",
          fornecedor_preferencial_id: "",
          codigo_barras: "",
        });
        setOffSuggestions([]);
        setShowSuggestions(false);
        fetchProdutos();
        // Seleciona automaticamente o novo produto
        if (!selectedProdutos.includes(novoProduto.id)) {
          setSelectedProdutos([...selectedProdutos, novoProduto.id]);
          setProdutoQtds({ ...produtoQtds, [novoProduto.id]: "1" });
        }
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar produto");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  const handleAddFromEstoque = async (estoque: Estoque) => {
    const quantidade = estoque.estoque_minimo - estoque.quantidade_atual;
    try {
      const res = await fetch("/api/lista-compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: estoque.produto_id,
          quantidade_solicitada: Math.max(1, quantidade),
        }),
      });

      if (res.ok) {
        fetchItens();
        fetchEstoqueBaixo();
      }
    } catch (err) {
      console.error("Erro ao adicionar:", err);
    }
  };

  const handleImportText = async () => {
    if (!importText.trim()) return;
    setIsImportingText(true);
    setImportResults([]);

    try {
      const res = await fetch("/api/ia/interpretar-lista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: importText }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao interpretar lista");
        setIsImportingText(false);
        return;
      }

      const data = await res.json();
      const itensInterpretados = data.itens || [];
      const results: typeof importResults = [];

      for (const item of itensInterpretados) {
        // Tenta encontrar produto existente com nome similar
        const produtoExistente = produtos.find(
          (p) => p.nome_produto.toLowerCase().includes(item.produto.toLowerCase()) ||
                 item.produto.toLowerCase().includes(p.nome_produto.toLowerCase())
        );

        if (produtoExistente) {
          // Adiciona à lista de compras
          const addRes = await fetch("/api/lista-compras", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              produto_id: produtoExistente.id,
              quantidade_solicitada: item.quantidade || 1,
            }),
          });
          results.push({
            produto: item.produto,
            quantidade: item.quantidade || 1,
            unidade: item.unidade || "un",
            added: addRes.ok,
          });
        } else {
          results.push({
            produto: item.produto,
            quantidade: item.quantidade || 1,
            unidade: item.unidade || "un",
            added: false,
          });
        }
      }

      setImportResults(results);
      fetchItens();
    } catch (err) {
      console.error("Erro ao importar:", err);
      alert("Erro de conexão");
    } finally {
      setIsImportingText(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/lista-compras/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_solicitacao: status }),
      });

      if (res.ok) {
        fetchItens();
      }
    } catch (err) {
      console.error("Erro ao atualizar:", err);
    }
  };

  const handleUpdateQuantidade = async (id: number, quantidade: string) => {
    const qtd = parseFloat(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      setEditingQtdId(null);
      return;
    }
    
    try {
      const res = await fetch(`/api/lista-compras/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade_solicitada: qtd }),
      });

      if (res.ok) {
        fetchItens();
      }
    } catch (err) {
      console.error("Erro ao atualizar quantidade:", err);
    } finally {
      setEditingQtdId(null);
    }
  };

  const toggleProdutoSelection = (produtoId: number) => {
    if (selectedProdutos.includes(produtoId)) {
      setSelectedProdutos(selectedProdutos.filter(id => id !== produtoId));
      const newQtds = { ...produtoQtds };
      delete newQtds[produtoId];
      setProdutoQtds(newQtds);
    } else {
      setSelectedProdutos([...selectedProdutos, produtoId]);
      setProdutoQtds({ ...produtoQtds, [produtoId]: "1" });
    }
  };

  const handleAddMultipleItems = async () => {
    let addedCount = 0;
    
    for (const produtoId of selectedProdutos) {
      const quantidade = parseFloat(produtoQtds[produtoId] || "1");
      if (quantidade > 0) {
        try {
          const res = await fetch("/api/lista-compras", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              produto_id: produtoId,
              quantidade_solicitada: quantidade,
            }),
          });
          if (res.ok) addedCount++;
        } catch (err) {
          console.error("Erro ao adicionar:", err);
        }
      }
    }

    if (addedCount > 0) {
      fetchItens();
    }
    
    setIsAddDialogOpen(false);
    setSelectedProdutos([]);
    setProdutoQtds({});
    setAddStep("select");
    setProdutoSearch("");
  };

  const filteredProdutosForAdd = produtos.filter(p =>
    p.nome_produto.toLowerCase().includes(produtoSearch.toLowerCase()) ||
    p.categoria_produto?.toLowerCase().includes(produtoSearch.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este item da lista?")) return;

    try {
      const res = await fetch(`/api/lista-compras/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchItens();
        setSelectedItems(selectedItems.filter(i => i !== id));
      }
    } catch (err) {
      console.error("Erro ao remover:", err);
    }
  };

  const toggleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const selectAllPendentes = () => {
    const pendentesIds = itens
      .filter(i => i.status_solicitacao === "pendente")
      .map(i => i.id);
    setSelectedItems(pendentesIds);
  };

  const generateWhatsAppMessage = () => {
    const selectedItensData = itens.filter(i => selectedItems.includes(i.id));
    let message = " *Pappi Gestor - Solicitação de Cotação*\n\n";
    message += "Olá! Gostaria de solicitar cotação para os seguintes itens:\n\n";
    
    selectedItensData.forEach((item, idx) => {
      message += `${idx + 1}. *${item.produto_nome}*\n`;
      message += `   Quantidade: ${item.quantidade_solicitada} ${item.unidade_medida || 'un'}\n\n`;
    });
    
    message += "Por favor, envie os preços unitários e prazo de entrega.\n\n";
    message += "Obrigado! 🙏";
    
    return encodeURIComponent(message);
  };

  const openWhatsApp = (telefone: string, fornecedorId?: number) => {
    const phone = telefone.replace(/\D/g, '');
    
    // Verifica se o fornecedor tem mensagem padrão de cotação
    const fornecedor = fornecedores.find(f => f.id === fornecedorId);
    let message: string;
    
    if (fornecedor?.mensagem_padrao_cotacao) {
      // Usa mensagem padrão do fornecedor + lista de itens
      const itensSelecionados = itens.filter(item => selectedItems.includes(item.id));
      const listaItens = itensSelecionados.map(item => 
        `• ${item.produto_nome} - ${item.quantidade_solicitada} ${item.unidade_medida || "un"}`
      ).join("\n");
      message = encodeURIComponent(`${fornecedor.mensagem_padrao_cotacao}\n\n${listaItens}\n\nAguardo retorno.`);
    } else {
      message = generateWhatsAppMessage();
    }
    
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
    
    // Atualiza status dos itens selecionados para "em_cotacao"
    selectedItems.forEach(id => {
      handleUpdateStatus(id, "em_cotacao");
    });
    
    setIsWhatsAppDialogOpen(false);
    setSelectedItems([]);
  };

  const filteredItens = itens.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status_solicitacao === filterStatus;
  });

  const pendentesCount = itens.filter((i) => i.status_solicitacao === "pendente").length;

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lista de Compras</h1>
          <p className="text-sm sm:text-base text-gray-600">Solicitações de reposição de estoque</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {selectedItems.length > 0 && (
            <Button
              onClick={() => setIsWhatsAppDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Enviar WhatsApp ({selectedItems.length})
            </Button>
          )}
          <Button
            onClick={() => setIsImportTextDialogOpen(true)}
            variant="outline"
            className="w-full sm:w-auto border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-900/20"
          >
            <ClipboardPaste className="w-4 h-4 mr-2" />
            Importar Lista
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Solicitar Item
          </Button>
        </div>
      </div>

      {/* Alerta de estoque baixo */}
      {estoqueBaixo.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800">
                  {estoqueBaixo.length} produto(s) com estoque baixo
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {estoqueBaixo.slice(0, 5).map((e) => {
                    const jaAdicionado = itens.some(
                      (i) =>
                        i.produto_id === e.produto_id &&
                        ["pendente", "em_cotacao"].includes(i.status_solicitacao)
                    );
                    return (
                      <Button
                        key={e.id}
                        variant="outline"
                        size="sm"
                        disabled={jaAdicionado}
                        onClick={() => handleAddFromEstoque(e)}
                        className={`text-xs ${jaAdicionado ? "opacity-50" : "bg-white"}`}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {e.produto_nome}
                        {jaAdicionado && " (já solicitado)"}
                      </Button>
                    );
                  })}
                  {estoqueBaixo.length > 5 && (
                    <span className="text-sm text-yellow-700">
                      +{estoqueBaixo.length - 5} mais
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card
          className={`cursor-pointer transition ${
            filterStatus === "all" ? "ring-2 ring-orange-500" : ""
          }`}
          onClick={() => setFilterStatus("all")}
        >
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{itens.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition ${
            filterStatus === "pendente" ? "ring-2 ring-yellow-500" : ""
          }`}
          onClick={() => setFilterStatus("pendente")}
        >
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendentesCount}</p>
            <p className="text-sm text-gray-500">Pendentes</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition ${
            filterStatus === "em_cotacao" ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => setFilterStatus("em_cotacao")}
        >
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {itens.filter((i) => i.status_solicitacao === "em_cotacao").length}
            </p>
            <p className="text-sm text-gray-500">Em Cotação</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition ${
            filterStatus === "aprovado" ? "ring-2 ring-green-500" : ""
          }`}
          onClick={() => setFilterStatus("aprovado")}
        >
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {itens.filter((i) => i.status_solicitacao === "aprovado").length}
            </p>
            <p className="text-sm text-gray-500">Aprovados</p>
          </CardContent>
        </Card>
      </div>

      {/* Seleção rápida */}
      {pendentesCount > 0 && (
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" onClick={selectAllPendentes}>
            Selecionar todos pendentes ({pendentesCount})
          </Button>
          {selectedItems.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedItems([])}>
              Limpar seleção
            </Button>
          )}
        </div>
      )}

      {filteredItens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {filterStatus !== "all"
                ? `Nenhum item com status "${STATUS_LABELS[filterStatus]?.label}"`
                : "Nenhum item na lista de compras"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg overflow-hidden shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-12">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === pendentesCount && pendentesCount > 0}
                    onChange={() => {
                      if (selectedItems.length === pendentesCount) {
                        setSelectedItems([]);
                      } else {
                        selectAllPendentes();
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Produto
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  Quantidade
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Solicitante
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Data
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItens.map((item) => {
                const statusInfo = STATUS_LABELS[item.status_solicitacao] || STATUS_LABELS.pendente;
                const isSelected = selectedItems.includes(item.id);
                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-orange-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        disabled={item.status_solicitacao !== "pendente"}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{item.produto_nome}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.status_solicitacao === "pendente" && editingQtdId === item.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editingQtdValue}
                            onChange={(e) => setEditingQtdValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateQuantidade(item.id, editingQtdValue);
                              if (e.key === "Escape") setEditingQtdId(null);
                            }}
                            className="w-20 h-8 text-center text-sm"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantidade(item.id, editingQtdValue)}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                        </div>
                      ) : (
                        <span 
                          className={`font-bold text-orange-600 ${item.status_solicitacao === "pendente" ? "cursor-pointer hover:underline" : ""}`}
                          onClick={() => {
                            if (item.status_solicitacao === "pendente") {
                              setEditingQtdId(item.id);
                              setEditingQtdValue(String(item.quantidade_solicitada));
                            }
                          }}
                          title={item.status_solicitacao === "pendente" ? "Clique para editar" : ""}
                        >
                          {item.quantidade_solicitada} {item.unidade_medida}
                          {item.status_solicitacao === "pendente" && (
                            <Edit2 className="w-3 h-3 inline-block ml-1 text-gray-400" />
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusInfo.color}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.solicitante_nome || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(item.data_solicitacao).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {item.status_solicitacao === "pendente" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(item.id, "em_cotacao")}
                              title="Enviar para cotação"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(item.id, "cancelado")}
                              title="Cancelar"
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        {item.status_solicitacao === "em_cotacao" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(item.id, "aprovado")}
                            title="Aprovar"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog de Adicionar Item - Múltipla Seleção */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setSelectedProdutos([]);
          setProdutoQtds({});
          setAddStep("select");
          setProdutoSearch("");
        }
      }}>
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {addStep === "select" ? "Selecionar Produtos" : "Definir Quantidades"}
            </DialogTitle>
          </DialogHeader>
          
          {addStep === "select" ? (
            <div className="mt-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar produto..."
                  value={produtoSearch}
                  onChange={(e) => setProdutoSearch(e.target.value)}
                  className="pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="border rounded-lg max-h-64 overflow-auto dark:border-gray-600">
                {filteredProdutosForAdd.length === 0 ? (
                  <p className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhum produto encontrado
                  </p>
                ) : (
                  filteredProdutosForAdd.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 ${
                        selectedProdutos.includes(p.id) ? "bg-orange-50 dark:bg-orange-900/30" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProdutos.includes(p.id)}
                        onChange={() => toggleProdutoSelection(p.id)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white">{p.nome_produto}</span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({p.unidade_medida})</span>
                        {p.categoria_produto && (
                          <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                            {p.categoria_produto}
                          </span>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
              
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-orange-600 p-0 h-auto"
                onClick={() => setIsNewProductDialogOpen(true)}
              >
                <Package className="w-3 h-3 mr-1" />
                Cadastrar novo produto
              </Button>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1 dark:border-gray-600 dark:text-gray-200"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => setAddStep("quantity")}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={selectedProdutos.length === 0}
                >
                  Próximo ({selectedProdutos.length})
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Defina a quantidade para cada produto selecionado:
              </p>
              
              <div className="border rounded-lg max-h-64 overflow-auto dark:border-gray-600">
                {selectedProdutos.map((prodId) => {
                  const produto = produtos.find(p => p.id === prodId);
                  if (!produto) return null;
                  return (
                    <div key={prodId} className="flex items-center gap-3 p-3 border-b last:border-b-0 dark:border-gray-600">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white">{produto.nome_produto}</span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({produto.unidade_medida})</span>
                      </div>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={produtoQtds[prodId] || "1"}
                        onChange={(e) => setProdutoQtds({ ...produtoQtds, [prodId]: e.target.value })}
                        className="w-24 text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setAddStep("select")}
                  className="flex-1 dark:border-gray-600 dark:text-gray-200"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleAddMultipleItems}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar {selectedProdutos.length} item(ns)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Novo Produto */}
      <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Produto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProduct} className="space-y-4 mt-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto *
              </label>
              <div className="relative">
                <Input
                  value={newProductForm.nome_produto}
                  onChange={(e) => handleProductNameChange(e.target.value)}
                  onFocus={() => offSuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Digite para buscar no Open Food Facts..."
                  required
                  autoComplete="off"
                />
                {isSearchingOFF && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              {showSuggestions && offSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                    Sugestões do Open Food Facts
                  </div>
                  {offSuggestions.map((product, idx) => (
                    <button
                      key={product.code || idx}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-orange-50 flex items-center gap-3 border-b last:border-b-0"
                      onClick={() => selectOFFProduct(product)}
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{product.product_name}</div>
                        {product.brands && (
                          <div className="text-xs text-gray-500 truncate">{product.brands}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {newProductForm.codigo_barras && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Código de barras: {newProductForm.codigo_barras}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <Select
                  value={newProductForm.categoria_produto}
                  onValueChange={(v) => setNewProductForm({ ...newProductForm, categoria_produto: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade *
                </label>
                <Select
                  value={newProductForm.unidade_medida}
                  onValueChange={(v) => setNewProductForm({ ...newProductForm, unidade_medida: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fornecedor Preferencial
              </label>
              <Select
                value={newProductForm.fornecedor_preferencial_id}
                onValueChange={(v) => setNewProductForm({ ...newProductForm, fornecedor_preferencial_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewProductDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={!newProductForm.nome_produto}
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Importar Lista de Texto */}
      <Dialog open={isImportTextDialogOpen} onOpenChange={(open) => {
        setIsImportTextDialogOpen(open);
        if (!open) {
          setImportText("");
          setImportResults([]);
        }
      }}>
        <DialogContent className="max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Importar Lista de Texto
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cole a lista recebida por WhatsApp ou digite os itens. A IA vai interpretar automaticamente.
            </p>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Exemplos:\nFubá 2kg\nMussarela 5kg\nCalabresa 4cx\nCaixa ovos - 10un\nFarinha de trigo, queijo prato, presunto`}
              className="min-h-[150px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            
            {importResults.length > 0 && (
              <div className="border rounded-lg p-3 max-h-48 overflow-auto dark:border-gray-600">
                <p className="text-sm font-medium mb-2 dark:text-white">Resultado da importação:</p>
                <div className="space-y-1">
                  {importResults.map((r, idx) => (
                    <div key={idx} className={`text-sm flex items-center gap-2 ${r.added ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                      {r.added ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{r.produto} - {r.quantidade} {r.unidade}</span>
                      {!r.added && <span className="text-xs">(produto não cadastrado)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsImportTextDialogOpen(false)}
              className="dark:border-gray-600 dark:text-gray-200"
            >
              {importResults.length > 0 ? "Fechar" : "Cancelar"}
            </Button>
            {importResults.length === 0 && (
              <Button
                onClick={handleImportText}
                disabled={!importText.trim() || isImportingText}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isImportingText ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Interpretar Lista
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Envio WhatsApp */}
      <Dialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Cotação via WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">
              Selecione o fornecedor para enviar a cotação de {selectedItems.length} item(ns):
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-32 overflow-auto">
              {itens.filter(i => selectedItems.includes(i.id)).map(item => (
                <div key={item.id} className="text-sm text-gray-700">
                  • {item.produto_nome} - {item.quantidade_solicitada} {item.unidade_medida}
                </div>
              ))}
            </div>

            {fornecedores.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Nenhum fornecedor com WhatsApp cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {fornecedores.map((f) => (
                  <Button
                    key={f.id}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => openWhatsApp(f.telefone_whatsapp, f.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{f.nome_fantasia}</p>
                      <p className="text-xs text-gray-500">{f.telefone_whatsapp}</p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
