import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Building2, Phone, Loader2, CheckCircle, XCircle, Mail, User, MessageSquare, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Fornecedor {
  id: number;
  cnpj_cpf: string;
  razao_social: string;
  nome_fantasia: string;
  categoria_principal: string;
  telefone_whatsapp: string;
  prazo_pagamento_padrao: number;
  email: string;
  contato_nome: string;
  mensagem_padrao_cotacao: string;
  is_ativo: number;
  created_at: string;
}

const CATEGORIAS = [
  "Insumos",
  "Embalagens",
  "Bebidas",
  "Gás",
  "Serviços",
  "Mercado",
];

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);

  const [form, setForm] = useState({
    cnpj_cpf: "",
    razao_social: "",
    nome_fantasia: "",
    categoria_principal: "",
    telefone_whatsapp: "",
    prazo_pagamento_padrao: "0",
    email: "",
    contato_nome: "",
    mensagem_padrao_cotacao: "",
  });

  const formatCnpjCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 18);
    }
  };

  const buscarCnpjCpf = async () => {
    const numbers = form.cnpj_cpf.replace(/\D/g, "");
    
    if (numbers.length === 14) {
      // CNPJ - usar BrasilAPI
      setBuscandoCnpj(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numbers}`);
        if (res.ok) {
          const data = await res.json();
          setForm(prev => ({
            ...prev,
            razao_social: data.razao_social || "",
            nome_fantasia: data.nome_fantasia || data.razao_social || "",
            email: data.email || prev.email,
            telefone_whatsapp: data.ddd_telefone_1 ? 
              `(${data.ddd_telefone_1.slice(0,2)}) ${data.ddd_telefone_1.slice(2)}` : prev.telefone_whatsapp,
          }));
        } else {
          alert("CNPJ não encontrado na Receita Federal");
        }
      } catch {
        alert("Erro ao buscar CNPJ");
      } finally {
        setBuscandoCnpj(false);
      }
    } else if (numbers.length === 11) {
      // CPF - não tem API pública, apenas formata
      alert("Para CPF, preencha os dados manualmente");
    } else {
      alert("Digite um CNPJ (14 dígitos) ou CPF (11 dígitos) válido");
    }
  };

  const fetchFornecedores = async () => {
    try {
      const res = await fetch("/api/fornecedores");
      if (res.ok) {
        const data = await res.json();
        setFornecedores(data);
      }
    } catch (err) {
      console.error("Erro ao carregar fornecedores:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      prazo_pagamento_padrao: parseInt(form.prazo_pagamento_padrao) || 0,
    };

    try {
      const url = editingFornecedor
        ? `/api/fornecedores/${editingFornecedor.id}`
        : "/api/fornecedores";
      const method = editingFornecedor ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setEditingFornecedor(null);
        setForm({
          cnpj_cpf: "",
          razao_social: "",
          nome_fantasia: "",
          categoria_principal: "",
          telefone_whatsapp: "",
          prazo_pagamento_padrao: "0",
          email: "",
          contato_nome: "",
          mensagem_padrao_cotacao: "",
        });
        fetchFornecedores();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar fornecedor");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setForm({
      cnpj_cpf: fornecedor.cnpj_cpf || "",
      razao_social: fornecedor.razao_social || "",
      nome_fantasia: fornecedor.nome_fantasia,
      categoria_principal: fornecedor.categoria_principal || "",
      telefone_whatsapp: fornecedor.telefone_whatsapp || "",
      prazo_pagamento_padrao: String(fornecedor.prazo_pagamento_padrao || 0),
      email: fornecedor.email || "",
      contato_nome: fornecedor.contato_nome || "",
      mensagem_padrao_cotacao: fornecedor.mensagem_padrao_cotacao || "",
    });
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (fornecedor: Fornecedor) => {
    try {
      const res = await fetch(`/api/fornecedores/${fornecedor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_ativo: fornecedor.is_ativo ? 0 : 1 }),
      });

      if (res.ok) {
        fetchFornecedores();
      }
    } catch (err) {
      alert("Erro ao alterar status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;

    try {
      const res = await fetch(`/api/fornecedores/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchFornecedores();
      }
    } catch (err) {
      alert("Erro ao excluir fornecedor");
    }
  };

  const openNewDialog = () => {
    setEditingFornecedor(null);
    setForm({
      cnpj_cpf: "",
      razao_social: "",
      nome_fantasia: "",
      categoria_principal: "",
      telefone_whatsapp: "",
      prazo_pagamento_padrao: "0",
      email: "",
      contato_nome: "",
      mensagem_padrao_cotacao: "",
    });
    setIsDialogOpen(true);
  };

  const formatWhatsApp = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    return `https://wa.me/55${cleaned}`;
  };

  const filteredFornecedores = fornecedores.filter(
    (f) => filterCategoria === "all" || f.categoria_principal === filterCategoria
  );

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-sm sm:text-base text-gray-600">Gerencie seus fornecedores e contatos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ ou CPF
                </label>
                <div className="flex gap-2">
                  <Input
                    value={form.cnpj_cpf}
                    onChange={(e) => setForm({ ...form, cnpj_cpf: formatCnpjCpf(e.target.value) })}
                    placeholder="00.000.000/0000-00 ou 000.000.000-00"
                    maxLength={18}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={buscarCnpjCpf}
                    disabled={buscandoCnpj || form.cnpj_cpf.replace(/\D/g, "").length < 11}
                  >
                    {buscandoCnpj ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razão Social
                </label>
                <Input
                  value={form.razao_social}
                  onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
                  placeholder="Razão social da empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Fantasia *
                </label>
                <Input
                  value={form.nome_fantasia}
                  onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
                  placeholder="Ex: Embalaer, Ambev"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria Principal
                </label>
                <Select
                  value={form.categoria_principal}
                  onValueChange={(v) => setForm({ ...form, categoria_principal: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp
                </label>
                <Input
                  value={form.telefone_whatsapp}
                  onChange={(e) => setForm({ ...form, telefone_whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prazo de Pagamento Padrão (dias)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.prazo_pagamento_padrao}
                  onChange={(e) => setForm({ ...form, prazo_pagamento_padrao: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contato@fornecedor.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Contato
                </label>
                <Input
                  value={form.contato_nome}
                  onChange={(e) => setForm({ ...form, contato_nome: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem Padrão para Cotação (WhatsApp)
                </label>
                <Textarea
                  value={form.mensagem_padrao_cotacao}
                  onChange={(e) => setForm({ ...form, mensagem_padrao_cotacao: e.target.value })}
                  placeholder="Ex: Olá, {nome}, gostaria de solicitar cotação dos produtos listados abaixo..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se preenchido, esta mensagem será usada ao enviar cotação via WhatsApp para este fornecedor.
                  A lista de produtos será adicionada automaticamente.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                  {editingFornecedor ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtro */}
      <div className="mb-4">
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIAS.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredFornecedores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum fornecedor cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFornecedores.map((fornecedor) => (
            <Card
              key={fornecedor.id}
              className={`relative overflow-hidden ${!fornecedor.is_ativo ? "opacity-60" : ""}`}
            >
              <div
                className={`absolute top-0 left-0 w-1 h-full ${
                  fornecedor.is_ativo ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <CardContent className="py-4 pl-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{fornecedor.nome_fantasia}</h3>
                    {fornecedor.categoria_principal && (
                      <span className="inline-block text-xs px-2 py-0.5 mt-1 rounded-full bg-orange-100 text-orange-700">
                        {fornecedor.categoria_principal}
                      </span>
                    )}
                    {fornecedor.contato_nome && (
                      <p className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <User className="w-3 h-3" />
                        {fornecedor.contato_nome}
                      </p>
                    )}
                    {fornecedor.telefone_whatsapp && (
                      <a
                        href={formatWhatsApp(fornecedor.telefone_whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 mt-1"
                      >
                        <Phone className="w-3 h-3" />
                        {fornecedor.telefone_whatsapp}
                      </a>
                    )}
                    {fornecedor.email && (
                      <a
                        href={`mailto:${fornecedor.email}`}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-1"
                      >
                        <Mail className="w-3 h-3" />
                        {fornecedor.email}
                      </a>
                    )}
                    {fornecedor.mensagem_padrao_cotacao && (
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MessageSquare className="w-3 h-3" />
                        Mensagem cotação configurada
                      </p>
                    )}
                    {fornecedor.prazo_pagamento_padrao > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Prazo: {fornecedor.prazo_pagamento_padrao} dias
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(fornecedor)}
                      title={fornecedor.is_ativo ? "Desativar" : "Ativar"}
                    >
                      {fornecedor.is_ativo ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(fornecedor)}>
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(fornecedor.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
