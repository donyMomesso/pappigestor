import { useState, useEffect } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/react-app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import { Plus, Edit2, Trash2, Building2, Loader2, Users, Calendar, Crown } from "lucide-react";
import { STATUS_LABELS } from "@/react-app/types/auth";

interface Empresa {
  id: number;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  status_assinatura: string;
  plano: string;
  limite_admins: number;
  limite_usuarios_total: number;
  data_vencimento_assinatura: string | null;
  created_at: string;
  usuario_count?: number;
}

const STATUS_OPTIONS = [
  { value: "teste_gratis", label: "Teste Grátis", color: "bg-blue-100 text-blue-700" },
  { value: "ativo", label: "Ativo", color: "bg-green-100 text-green-700" },
  { value: "inadimplente", label: "Inadimplente", color: "bg-yellow-100 text-yellow-700" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700" },
];

const PLANO_OPTIONS = [
  { value: "basico", label: "Básico", color: "bg-gray-100 text-gray-700", icon: "🥉" },
  { value: "profissional", label: "Profissional", color: "bg-purple-100 text-purple-700", icon: "🥇" },
];

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);

  const [form, setForm] = useState({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    status_assinatura: "teste_gratis",
    plano: "basico",
    limite_admins: 1,
    limite_usuarios_total: 3,
    data_vencimento_assinatura: "",
  });

  const fetchEmpresas = async () => {
    try {
      const res = await fetch("/api/empresas");
      if (res.ok) {
        const data = await res.json();
        setEmpresas(data);
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingEmpresa ? `/api/empresas/${editingEmpresa.id}` : "/api/empresas";
      const method = editingEmpresa ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          limite_admins: Number(form.limite_admins),
          limite_usuarios_total: Number(form.limite_usuarios_total),
          data_vencimento_assinatura: form.data_vencimento_assinatura || null,
        }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setEditingEmpresa(null);
        setForm({
          razao_social: "",
          nome_fantasia: "",
          cnpj: "",
          status_assinatura: "teste_gratis",
          plano: "basico",
          limite_admins: 1,
          limite_usuarios_total: 3,
          data_vencimento_assinatura: "",
        });
        fetchEmpresas();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar empresa");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setForm({
      razao_social: empresa.razao_social,
      nome_fantasia: empresa.nome_fantasia,
      cnpj: empresa.cnpj || "",
      status_assinatura: empresa.status_assinatura,
      plano: empresa.plano || "basico",
      limite_admins: empresa.limite_admins || 1,
      limite_usuarios_total: empresa.limite_usuarios_total || 3,
      data_vencimento_assinatura: empresa.data_vencimento_assinatura || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa? Todos os usuários associados serão afetados.")) return;

    try {
      const res = await fetch(`/api/empresas/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEmpresas();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir empresa");
      }
    } catch (err) {
      alert("Erro ao excluir empresa");
    }
  };

  const openNewDialog = () => {
    setEditingEmpresa(null);
    setForm({
      razao_social: "",
      nome_fantasia: "",
      cnpj: "",
      status_assinatura: "teste_gratis",
      plano: "basico",
      limite_admins: 1,
      limite_usuarios_total: 3,
      data_vencimento_assinatura: "",
    });
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-700";
  };

  const getPlanoInfo = (plano: string) => {
    return PLANO_OPTIONS.find((p) => p.value === plano) || PLANO_OPTIONS[0];
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-600">Gerencie as empresas do sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEmpresa ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razão Social
                </label>
                <Input
                  value={form.razao_social}
                  onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
                  placeholder="Razão Social da empresa"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Fantasia
                </label>
                <Input
                  value={form.nome_fantasia}
                  onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
                  placeholder="Nome Fantasia"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <Input
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status da Assinatura
                </label>
                <Select
                  value={form.status_assinatura}
                  onValueChange={(v) => setForm({ ...form, status_assinatura: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plano
                </label>
                <Select
                  value={form.plano}
                  onValueChange={(v) => {
                    const limites = v === "profissional" 
                      ? { limite_admins: 3, limite_usuarios_total: 10 }
                      : { limite_admins: 1, limite_usuarios_total: 3 };
                    setForm({ ...form, plano: v, ...limites });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANO_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.icon} {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite Admins
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={form.limite_admins}
                    onChange={(e) => setForm({ ...form, limite_admins: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite Usuários
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={form.limite_usuarios_total}
                    onChange={(e) => setForm({ ...form, limite_usuarios_total: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento
                </label>
                <Input
                  type="date"
                  value={form.data_vencimento_assinatura}
                  onChange={(e) =>
                    setForm({ ...form, data_vencimento_assinatura: e.target.value })
                  }
                />
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
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                  {editingEmpresa ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STATUS_OPTIONS.map((status) => {
          const count = empresas.filter((e) => e.status_assinatura === status.value).length;
          return (
            <Card key={status.value}>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className={`text-sm px-2 py-0.5 rounded-full inline-block mt-1 ${status.color}`}>
                  {status.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {empresas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma empresa cadastrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {empresas.map((empresa) => (
            <Card
              key={empresa.id}
              className={
                empresa.status_assinatura === "cancelado" ||
                empresa.status_assinatura === "inadimplente"
                  ? "opacity-70 border-red-200"
                  : ""
              }
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{empresa.nome_fantasia}</h3>
                      <p className="text-sm text-gray-500">{empresa.razao_social}</p>
                      {empresa.cnpj && (
                        <p className="text-xs text-gray-400 mt-0.5">CNPJ: {empresa.cnpj}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(empresa.status_assinatura)}`}>
                          {STATUS_LABELS[empresa.status_assinatura] || empresa.status_assinatura}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getPlanoInfo(empresa.plano).color}`}>
                          <Crown className="w-3 h-3" />
                          {getPlanoInfo(empresa.plano).label}
                        </span>
                        {empresa.data_vencimento_assinatura && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Vence: {formatDate(empresa.data_vencimento_assinatura)}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {empresa.usuario_count || 0}/{empresa.limite_usuarios_total || 3} usuários
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(empresa)}>
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(empresa.id)}>
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
