import { useState, useEffect } from "react";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/react-app/components/ui/tabs";
import {
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Loader2,
  Users,
  Mail,
  Clock,
  CheckCircle,
  Copy,
  Send,
} from "lucide-react";
import { NIVEL_LABELS, type NivelAcesso } from "@/react-app/types/auth";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  empresa_id: number;
  nivel_acesso: NivelAcesso | string; // <- vem do backend como string às vezes
  is_ativo: number;
  created_at: string;
  empresa_nome?: string;
}

interface Empresa {
  id: number;
  nome_fantasia: string;
}

interface Convite {
  id: number;
  email: string;
  nivel_acesso: NivelAcesso | string; // <- idem
  status: string;
  empresa_id: number;
  empresa_nome?: string;
  created_at: string;
  aceito_at?: string;
  token?: string;
}

const NIVEIS: Array<{ value: string; label: string }> = [
  { value: "operador", label: "Operador" },
  { value: "comprador", label: "Comprador" },
  { value: "financeiro", label: "Financeiro" },
  { value: "admin_empresa", label: "Admin da Empresa" },
];

// helper seguro: só usa label se a key existir no Record
function nivelLabel(nivel: string): string {
  return (NIVEL_LABELS as Record<string, string>)[nivel] ?? nivel;
}

export default function UsuariosPage() {
  const { localUser, isSuperAdmin } = useAppAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConviteDialogOpen, setIsConviteDialogOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [isSendingConvite, setIsSendingConvite] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    empresa_id: "",
    nivel_acesso: "comprador",
  });

  const [conviteForm, setConviteForm] = useState({
    email: "",
    nivel_acesso: "comprador",
    empresa_id: "",
  });

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios");
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmpresas = async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch("/api/empresas");
      if (res.ok) {
        const data = await res.json();
        setEmpresas(data);
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    }
  };

  const fetchConvites = async () => {
    try {
      const res = await fetch("/api/convites");
      if (res.ok) {
        const data = await res.json();
        setConvites(data);
      }
    } catch (err) {
      console.error("Erro ao carregar convites:", err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchEmpresas();
    fetchConvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      empresa_id: isSuperAdmin ? Number(form.empresa_id) : localUser?.empresa_id,
    };

    try {
      const url = editingUser ? `/api/usuarios/${editingUser.id}` : "/api/usuarios";
      const method = editingUser ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setEditingUser(null);
        setForm({ nome: "", email: "", empresa_id: "", nivel_acesso: "comprador" });
        fetchUsuarios();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar usuário");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      empresa_id: String(usuario.empresa_id),
      nivel_acesso: String(usuario.nivel_acesso),
    });
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (usuario: Usuario) => {
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_ativo: usuario.is_ativo ? 0 : 1 }),
      });

      if (res.ok) fetchUsuarios();
    } catch (err) {
      alert("Erro ao alterar status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (res.ok) fetchUsuarios();
    } catch (err) {
      alert("Erro ao excluir usuário");
    }
  };

  const openNewDialog = () => {
    setEditingUser(null);
    setForm({
      nome: "",
      email: "",
      empresa_id: String(localUser?.empresa_id || ""),
      nivel_acesso: "comprador",
    });
    setIsDialogOpen(true);
  };

  const openConviteDialog = () => {
    setConviteForm({
      email: "",
      nivel_acesso: "comprador",
      empresa_id: String(localUser?.empresa_id || ""),
    });
    setIsConviteDialogOpen(true);
  };

  const handleSendConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingConvite(true);

    try {
      const res = await fetch("/api/convites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: conviteForm.email,
          nivel_acesso: conviteForm.nivel_acesso,
          empresa_id: isSuperAdmin ? Number(conviteForm.empresa_id) : localUser?.empresa_id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsConviteDialogOpen(false);
        fetchConvites();
        alert("Convite enviado com sucesso!");
      } else {
        alert(data.error || "Erro ao enviar convite");
      }
    } catch (err) {
      alert("Erro de conexão");
    } finally {
      setIsSendingConvite(false);
    }
  };

  const handleDeleteConvite = async (id: number) => {
    if (!confirm("Tem certeza que deseja cancelar este convite?")) return;

    try {
      const res = await fetch(`/api/convites/${id}`, { method: "DELETE" });
      if (res.ok) fetchConvites();
    } catch (err) {
      alert("Erro ao cancelar convite");
    }
  };

  const copyConviteLink = (token?: string) => {
    if (!token) return;
    const url = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const niveisDisponiveis = isSuperAdmin
    ? [...NIVEIS, { value: "super_admin", label: "Super Admin" }]
    : NIVEIS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const convitesPendentes = convites.filter((c) => c.status === "pendente");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie os usuários e convites do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="usuarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários ({usuarios.length})
          </TabsTrigger>
          <TabsTrigger value="convites" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Convites ({convitesPendentes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <div className="flex justify-end mb-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog} className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <Input
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Nome completo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>

                  {isSuperAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                      <Select
                        value={form.empresa_id}
                        onValueChange={(v) => setForm({ ...form, empresa_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {empresas.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>
                              {e.nome_fantasia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso</label>
                    <Select
                      value={form.nivel_acesso}
                      onValueChange={(v) => setForm({ ...form, nivel_acesso: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {niveisDisponiveis.map((n) => (
                          <SelectItem key={n.value} value={n.value}>
                            {n.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      {editingUser ? "Salvar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {usuarios.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum usuário cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {usuarios.map((usuario) => (
                <Card key={usuario.id} className={!usuario.is_ativo ? "opacity-60" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            usuario.is_ativo ? "bg-orange-500" : "bg-gray-400"
                          }`}
                        >
                          {usuario.nome.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <h3 className="font-medium text-gray-900">{usuario.nome}</h3>
                          <p className="text-sm text-gray-500">{usuario.email}</p>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                              {nivelLabel(String(usuario.nivel_acesso))}
                            </span>

                            {isSuperAdmin && usuario.empresa_nome && (
                              <span className="text-xs text-gray-500">{usuario.empresa_nome}</span>
                            )}

                            {!usuario.is_ativo && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                Inativo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(usuario)}
                          title={usuario.is_ativo ? "Desativar" : "Ativar"}
                        >
                          {usuario.is_ativo ? (
                            <UserX className="w-4 h-4 text-red-500" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-500" />
                          )}
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => handleEdit(usuario)}>
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => handleDelete(usuario.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="convites">
          <div className="flex justify-end mb-4">
            <Button onClick={openConviteDialog} className="bg-orange-600 hover:bg-orange-700">
              <Send className="w-4 h-4 mr-2" />
              Enviar Convite
            </Button>
          </div>

          {convitesPendentes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum convite pendente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {convitesPendentes.map((convite) => (
                <Card key={convite.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>

                        <div>
                          <h3 className="font-medium text-gray-900">{convite.email}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                              {nivelLabel(String(convite.nivel_acesso))}
                            </span>
                            <span className="text-xs text-gray-500">
                              Enviado em {formatDate(convite.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyConviteLink(convite.token)}
                        >
                          {copiedLink === convite.token ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" /> Copiar Link
                            </>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteConvite(convite.id)}
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
        </TabsContent>
      </Tabs>

      {/* Dialog de Convite */}
      <Dialog open={isConviteDialogOpen} onOpenChange={setIsConviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Convite</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSendConvite} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={conviteForm.email}
                onChange={(e) => setConviteForm({ ...conviteForm, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>

            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <Select
                  value={conviteForm.empresa_id}
                  onValueChange={(v) => setConviteForm({ ...conviteForm, empresa_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nome_fantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso</label>
              <Select
                value={conviteForm.nivel_acesso}
                onValueChange={(v) => setConviteForm({ ...conviteForm, nivel_acesso: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {niveisDisponiveis.map((n) => (
                    <SelectItem key={n.value} value={n.value}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConviteDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={isSendingConvite}
              >
                {isSendingConvite ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enviar Convite
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}