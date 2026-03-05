"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Badge } from "@/react-app/components/ui/badge";
import { Input } from "@/react-app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/react-app/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/react-app/components/ui/dialog";
import { Label } from "@/react-app/components/ui/label";
import {
  Link2,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  Building2,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Search,
  Plus,
  Trash2,
} from "lucide-react";

type ConnectionStatus = "connected" | "syncing" | "error" | "pending";

type OpenFinanceConnection = {
  id: string;
  institutionName: string;
  status: ConnectionStatus;
  lastSyncAt?: string;
  createdAt: string;
  accounts: number;
};

type ImportJob = {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  createdAt: string;
  rows?: number;
  message?: string;
};

function formatDateTimeBR(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function statusBadge(status: ConnectionStatus) {
  switch (status) {
    case "connected":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Conectado</Badge>;
    case "syncing":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Sincronizando</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendente</Badge>;
    case "error":
    default:
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Erro</Badge>;
  }
}

function jobBadge(status: ImportJob["status"]) {
  switch (status) {
    case "done":
      return (
        <span className="inline-flex items-center gap-1 text-green-700">
          <CheckCircle2 className="w-4 h-4" /> Concluído
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 text-red-700">
          <XCircle className="w-4 h-4" /> Falhou
        </span>
      );
    case "running":
      return (
        <span className="inline-flex items-center gap-1 text-blue-700">
          <RefreshCw className="w-4 h-4 animate-spin" /> Processando
        </span>
      );
    case "queued":
    default:
      return (
        <span className="inline-flex items-center gap-1 text-yellow-700">
          <Clock className="w-4 h-4" /> Na fila
        </span>
      );
  }
}

export default function OpenFinanceClient() {
  const { localUser, hasPermission, isSuperAdmin } = useAppAuth();

  // Gate SaaS: só vê quem tem acesso (ajuste a permissão como quiser)
  const canUseOpenFinance = useMemo(() => {
    // 1) super admin ou dono
    if (isSuperAdmin) return true;
    // 2) permission fina (se você quiser controlar por permissões)
    if (hasPermission("open_finance:ver")) return true;
    // 3) ou feature do plano (se existir)
    // if (hasFeature("open_finance")) return true;
    return true; // deixe true por enquanto pra você desenvolver sem travar
  }, [hasPermission, isSuperAdmin]);

  const [connections, setConnections] = useState<OpenFinanceConnection[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState("");

  // Mock inicial (alto padrão + pronto pra trocar por API)
  useEffect(() => {
    if (!canUseOpenFinance) return;

    // Você vai substituir isso por fetch real:
    // GET /api/open-finance/connections
    // GET /api/open-finance/import-jobs
    const now = new Date().toISOString();

    setConnections([
      {
        id: "conn_1",
        institutionName: "Banco Inter",
        status: "connected",
        lastSyncAt: now,
        createdAt: now,
        accounts: 2,
      },
      {
        id: "conn_2",
        institutionName: "Itaú",
        status: "pending",
        createdAt: now,
        accounts: 0,
      },
      {
        id: "conn_3",
        institutionName: "Nubank",
        status: "error",
        createdAt: now,
        accounts: 1,
      },
    ]);

    setJobs([
      { id: "job_1", status: "done", createdAt: now, rows: 312 },
      { id: "job_2", status: "running", createdAt: now },
    ]);

    setLoading(false);
  }, [canUseOpenFinance]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return connections;
    return connections.filter((c) => c.institutionName.toLowerCase().includes(q));
  }, [connections, search]);

  const stats = useMemo(() => {
    const total = connections.length;
    const connected = connections.filter((c) => c.status === "connected").length;
    const syncing = connections.filter((c) => c.status === "syncing").length;
    const pending = connections.filter((c) => c.status === "pending").length;
    const error = connections.filter((c) => c.status === "error").length;
    const accounts = connections.reduce((acc, c) => acc + (c.accounts || 0), 0);
    return { total, connected, syncing, pending, error, accounts };
  }, [connections]);

  async function handleCreateConnection() {
    if (!institutionName.trim()) return;

    // TODO: POST /api/open-finance/connections { institutionName }
    // Aqui é mock:
    const now = new Date().toISOString();
    setConnections((prev) => [
      {
        id: `conn_${Math.random().toString(36).slice(2)}`,
        institutionName: institutionName.trim(),
        status: "pending",
        createdAt: now,
        accounts: 0,
      },
      ...prev,
    ]);

    setInstitutionName("");
    setCreateOpen(false);
  }

  async function handleSync(connId: string) {
    // TODO: POST /api/open-finance/connections/:id/sync
    setConnections((prev) =>
      prev.map((c) => (c.id === connId ? { ...c, status: "syncing" } : c))
    );

    // Simula fim do sync
    setTimeout(() => {
      const now = new Date().toISOString();
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connId
            ? { ...c, status: "connected", lastSyncAt: now, accounts: Math.max(1, c.accounts) }
            : c
        )
      );
    }, 1200);
  }

  async function handleRemove(connId: string) {
    if (!confirm("Remover esta conexão?")) return;
    // TODO: DELETE /api/open-finance/connections/:id
    setConnections((prev) => prev.filter((c) => c.id !== connId));
  }

  async function handleImport() {
    // TODO: POST /api/open-finance/import { empresa_id }
    const now = new Date().toISOString();
    setJobs((prev) => [
      { id: `job_${Math.random().toString(36).slice(2)}`, status: "queued", createdAt: now },
      ...prev,
    ]);

    // Simula processamento
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j, idx) =>
          idx === 0 ? { ...j, status: "done", rows: 200 + Math.floor(Math.random() * 400) } : j
        )
      );
    }, 1500);
  }

  if (!canUseOpenFinance) {
    return (
      <div className="p-6">
        <Card className="border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Acesso restrito
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">
            Seu usuário não tem permissão para acessar Open Finance.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-7 w-56 bg-gray-200 rounded" />
        <div className="grid md:grid-cols-4 gap-4">
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
        <div className="h-80 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Open Finance</h1>
          <p className="text-gray-600">
            Conecte bancos e importe transações automaticamente para o financeiro.
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Empresa: <span className="font-medium">{localUser?.nome_empresa ?? "-"}</span> •{" "}
            Usuário: <span className="font-medium">{localUser?.nome ?? "-"}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleImport} className="gap-2">
            <FileDown className="w-4 h-4" />
            Importar agora
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 gap-2">
                <Plus className="w-4 h-4" />
                Nova conexão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova conexão bancária</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-3">
                <div className="space-y-2">
                  <Label>Instituição</Label>
                  <Input
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="Ex: Banco Inter / Itaú / Nubank"
                  />
                </div>

                <div className="rounded-lg border border-gray-100 p-3 text-sm text-gray-600 flex gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <div>
                    Isso é um <b>placeholder SaaS</b>. Depois você troca por Pluggy/Celcoin/Outro
                    conector real.
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    onClick={handleCreateConnection}
                    disabled={!institutionName.trim()}
                  >
                    Criar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Conexões
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-gray-900">{stats.total}</CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Conectadas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-gray-900">{stats.connected}</CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Sincronizando
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-gray-900">{stats.syncing}</CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Com erro
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-gray-900">{stats.error}</CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Contas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-gray-900">{stats.accounts}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections" className="gap-2">
            <Building2 className="w-4 h-4" /> Conexões
          </TabsTrigger>
          <TabsTrigger value="imports" className="gap-2">
            <FileDown className="w-4 h-4" /> Importações
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="admin" className="gap-2">
              <ShieldCheck className="w-4 h-4" /> Admin
            </TabsTrigger>
          )}
        </TabsList>

        {/* Connections */}
        <TabsContent value="connections">
          <Card className="border border-gray-100">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="text-gray-900">Conexões bancárias</CardTitle>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar instituição..."
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-gray-600 text-sm py-8 text-center">
                  Nenhuma conexão encontrada.
                </div>
              ) : (
                filtered.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-gray-100 rounded-xl p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900">{c.institutionName}</div>
                        {statusBadge(c.status)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Criado: {formatDateTimeBR(c.createdAt)} • Último sync:{" "}
                        {formatDateTimeBR(c.lastSyncAt)} • Contas:{" "}
                        <span className="font-medium">{c.accounts}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleSync(c.id)}
                        disabled={c.status === "syncing"}
                      >
                        <RefreshCw className={`w-4 h-4 ${c.status === "syncing" ? "animate-spin" : ""}`} />
                        Sincronizar
                      </Button>

                      <Button
                        className="bg-orange-600 hover:bg-orange-700 gap-2"
                        onClick={handleImport}
                      >
                        Importar <ArrowRight className="w-4 h-4" />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => handleRemove(c.id)} title="Remover">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Imports */}
        <TabsContent value="imports">
          <Card className="border border-gray-100">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="text-gray-900">Importações / Jobs</CardTitle>
              <Button variant="outline" onClick={handleImport} className="gap-2">
                <FileDown className="w-4 h-4" />
                Nova importação
              </Button>
            </CardHeader>

            <CardContent className="space-y-3">
              {jobs.length === 0 ? (
                <div className="text-gray-600 text-sm py-8 text-center">
                  Nenhuma importação registrada.
                </div>
              ) : (
                jobs.map((j) => (
                  <div
                    key={j.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-gray-100 rounded-xl p-4"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">Job {j.id}</div>
                      <div className="text-xs text-gray-500">
                        Criado: {formatDateTimeBR(j.createdAt)}{" "}
                        {typeof j.rows === "number" ? `• Linhas: ${j.rows}` : ""}
                        {j.message ? `• ${j.message}` : ""}
                      </div>
                    </div>

                    <div className="text-sm">{jobBadge(j.status)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin */}
        {isSuperAdmin && (
          <TabsContent value="admin">
            <Card className="border border-gray-100">
              <CardHeader>
                <CardTitle className="text-gray-900">Admin (interno)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 space-y-2">
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="font-medium">Endpoints sugeridos (pra você plugar depois)</div>
                  <ul className="list-disc ml-5 mt-2 text-gray-600 space-y-1">
                    <li>GET /api/open-finance/connections</li>
                    <li>POST /api/open-finance/connections</li>
                    <li>POST /api/open-finance/connections/:id/sync</li>
                    <li>DELETE /api/open-finance/connections/:id</li>
                    <li>POST /api/open-finance/import</li>
                    <li>GET /api/open-finance/import-jobs</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-100 p-4 text-gray-600">
                  Regra SaaS: usar <b>RBAC</b> (permissions) + <b>features do plano</b> pra liberar
                  o Open Finance.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}   