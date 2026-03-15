"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Star,
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Badge } from "@/react-app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/react-app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";

type Empresa = {
  id: string;
  name: string;
  plano?: string | null;
  status?: string | null;
  cnpj?: string | null;
  created_at?: string | null;
};

type EmpresaScore = {
  company_id: string;
  score_total: number;
  score_financeiro: number;
  score_estoque: number;
  score_compras: number;
  score_organizacao: number;
  updated_at?: string | null;
};

type FormState = {
  name: string;
  plano: string;
  status: string;
  cnpj: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  plano: "basico",
  status: "ativa",
  cnpj: "",
};

function getPlanoLabel(plano?: string | null) {
  const value = String(plano || "basico").toLowerCase();
  if (value === "profissional" || value === "pro") return "Profissional";
  return "Básico";
}

function getStatusLabel(status?: string | null) {
  const value = String(status || "ativa").toLowerCase();
  if (value === "ativo" || value === "ativa") return "Ativa";
  if (value === "inativo" || value === "inativa") return "Inativa";
  if (value === "cancelado" || value === "cancelada") return "Cancelada";
  return status || "Ativa";
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Excelente";
  if (score >= 75) return "Saudável";
  if (score >= 55) return "Atenção";
  return "Crítico";
}

function getScoreClasses(score: number) {
  if (score >= 90) return "bg-emerald-100 text-emerald-700";
  if (score >= 75) return "bg-blue-100 text-blue-700";
  if (score >= 55) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function getInitials(name: string) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [scores, setScores] = useState<Record<string, EmpresaScore>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [empresaAtivaId, setEmpresaAtivaId] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErro(null);

      const [empresasRes, sessionRes] = await Promise.all([
        fetch("/api/empresas", { cache: "no-store" }),
        fetch("/api/app/session", { cache: "no-store" }),
      ]);

      const empresasData = await empresasRes.json();
      const sessionData = await sessionRes.json().catch(() => null);

      if (!empresasRes.ok) {
        throw new Error(empresasData?.error || "Erro ao carregar empresas");
      }

      const lista = Array.isArray(empresasData) ? empresasData : [];
      setEmpresas(lista);
      setEmpresaAtivaId(sessionData?.empresaAtual?.id || null);

      await loadScores(lista);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  }

  async function loadScores(lista: Empresa[]) {
    try {
      const entries = await Promise.all(
        lista.map(async (empresa) => {
          const res = await fetch(`/api/empresas/score?empresa=${empresa.id}`, {
            cache: "no-store",
          });

          if (!res.ok) {
            return [empresa.id, null] as const;
          }

          const data = (await res.json()) as EmpresaScore;
          return [empresa.id, data] as const;
        })
      );

      const nextScores: Record<string, EmpresaScore> = {};
      for (const [empresaId, score] of entries) {
        if (score) {
          nextScores[empresaId] = score;
        }
      }
      setScores(nextScores);
    } catch {
      setScores({});
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpenModal(true);
  }

  function openEdit(empresa: Empresa) {
    setEditing(empresa);
    setForm({
      name: empresa.name || "",
      plano: String(empresa.plano || "basico"),
      status: String(empresa.status || "ativa"),
      cnpj: String(empresa.cnpj || ""),
    });
    setOpenModal(true);
  }

  async function salvar() {
    try {
      if (!form.name.trim()) {
        alert("Informe o nome da empresa");
        return;
      }

      setSaving(true);

      const payload = {
        name: form.name.trim(),
        plano: form.plano,
        status: form.status,
        cnpj: form.cnpj.trim() || null,
      };

      const res = await fetch(
        editing ? `/api/empresas/${editing.id}` : "/api/empresas",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar empresa");
      }

      setOpenModal(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar empresa");
    } finally {
      setSaving(false);
    }
  }

  async function excluir(id: string) {
    const ok = window.confirm("Tem certeza que deseja excluir esta empresa?");
    if (!ok) return;

    try {
      setDeletingId(id);

      const res = await fetch(`/api/empresas/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao excluir empresa");
      }

      await load();
    } catch (e: any) {
      alert(e?.message || "Erro ao excluir empresa");
    } finally {
      setDeletingId(null);
    }
  }

  async function definirAtiva(empresaId: string) {
    try {
      setSwitchingId(empresaId);

      const res = await fetch("/api/empresas/ativa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ empresa_id: empresaId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao trocar empresa ativa");
      }

      setEmpresaAtivaId(empresaId);
    } catch (e: any) {
      alert(e?.message || "Erro ao trocar empresa ativa");
    } finally {
      setSwitchingId(null);
    }
  }

  const resumo = useMemo(() => {
    const total = empresas.length;
    const ativas = empresas.filter((e) =>
      ["ativa", "ativo"].includes(String(e.status || "").toLowerCase())
    ).length;
    const profissional = empresas.filter((e) =>
      ["profissional", "pro"].includes(String(e.plano || "").toLowerCase())
    ).length;

    const mediaScore =
      empresas.length > 0
        ? Math.round(
            empresas.reduce((acc, empresa) => {
              return acc + Number(scores[empresa.id]?.score_total || 0);
            }, 0) / empresas.length
          )
        : 0;

    return { total, ativas, profissional, mediaScore };
  }, [empresas, scores]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="overflow-hidden rounded-[32px] bg-gradient-to-r from-orange-500 via-orange-500 to-rose-500 p-6 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/15 backdrop-blur">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Gestão Multiempresa
            </h1>
            <p className="mt-2 text-sm text-white/90 sm:text-base">
              Controle suas empresas, acompanhe score operacional e organize o
              ambiente com visual premium.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-wider text-white/70">
                Empresas
              </div>
              <div className="mt-1 text-2xl font-black">{resumo.total}</div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-wider text-white/70">
                Ativas
              </div>
              <div className="mt-1 text-2xl font-black">{resumo.ativas}</div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-wider text-white/70">
                Pro
              </div>
              <div className="mt-1 text-2xl font-black">{resumo.profissional}</div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-wider text-white/70">
                Score médio
              </div>
              <div className="mt-1 text-2xl font-black">{resumo.mediaScore}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            onClick={openCreate}
            className="bg-white text-orange-600 hover:bg-orange-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Button>

          <Button
            onClick={load}
            variant="secondary"
            className="border-0 bg-white/15 text-white hover:bg-white/20"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {erro && (
        <Card className="rounded-3xl border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-5 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span>{erro}</span>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Empresas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-14 text-zinc-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando empresas...
            </div>
          ) : empresas.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-zinc-500">
              Nenhuma empresa cadastrada ainda.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {empresas.map((empresa) => {
                const score = Number(scores[empresa.id]?.score_total || 0);
                const scoreFinanceiro = Number(
                  scores[empresa.id]?.score_financeiro || 0
                );
                const scoreEstoque = Number(scores[empresa.id]?.score_estoque || 0);
                const scoreCompras = Number(scores[empresa.id]?.score_compras || 0);
                const scoreOrganizacao = Number(
                  scores[empresa.id]?.score_organizacao || 0
                );

                const ativa = empresaAtivaId === empresa.id;

                return (
                  <div
                    key={empresa.id}
                    className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-lg font-black text-white shadow-lg">
                          {getInitials(empresa.name || "EM")}
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-zinc-900">
                              {empresa.name || "Sem nome"}
                            </h3>

                            {ativa && (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                Ativa
                              </Badge>
                            )}

                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                              {getPlanoLabel(empresa.plano)}
                            </Badge>

                            <Badge
                              className={
                                ["ativa", "ativo"].includes(
                                  String(empresa.status || "").toLowerCase()
                                )
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-100"
                              }
                            >
                              {getStatusLabel(empresa.status)}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm text-zinc-600">
                            <div>
                              <span className="font-medium text-zinc-800">CNPJ:</span>{" "}
                              {empresa.cnpj || "-"}
                            </div>
                            <div>
                              <span className="font-medium text-zinc-800">ID:</span>{" "}
                              {empresa.id}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`inline-flex rounded-2xl px-3 py-2 text-sm font-bold ${getScoreClasses(
                            score
                          )}`}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Score {score}
                        </div>
                        <div className="mt-1 text-xs font-medium text-zinc-500">
                          {getScoreLabel(score)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-700">Pappi Score</span>
                        <span className="font-bold text-zinc-900">{score}/100</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all"
                          style={{ width: `${Math.max(0, Math.min(score, 100))}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">Financeiro</div>
                        <div className="mt-1 font-black text-zinc-900">
                          {scoreFinanceiro}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">Estoque</div>
                        <div className="mt-1 font-black text-zinc-900">
                          {scoreEstoque}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">Compras</div>
                        <div className="mt-1 font-black text-zinc-900">
                          {scoreCompras}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">Organização</div>
                        <div className="mt-1 font-black text-zinc-900">
                          {scoreOrganizacao}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button
                        onClick={() => definirAtiva(empresa.id)}
                        disabled={switchingId === empresa.id || ativa}
                        variant="outline"
                        className="rounded-2xl"
                      >
                        {switchingId === empresa.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                        )}
                        {ativa ? "Empresa ativa" : "Tornar ativa"}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => openEdit(empresa)}
                        className="rounded-2xl"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>

                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() =>
                          alert("Próximo passo: tela de administração e associação de usuários.")
                        }
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Administrar
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => excluir(empresa.id)}
                        disabled={deletingId === empresa.id}
                        className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {deletingId === empresa.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Excluir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar empresa" : "Nova empresa"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="empresa-name">Nome da empresa</Label>
              <Input
                id="empresa-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex.: Pappi Matriz"
              />
            </div>

            <div>
              <Label htmlFor="empresa-cnpj">CNPJ</Label>
              <Input
                id="empresa-cnpj"
                value={form.cnpj}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, cnpj: e.target.value }))
                }
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Plano</Label>
                <Select
                  value={form.plano}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, plano: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setOpenModal(false)}
              className="rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={salvar}
              disabled={saving}
              className="rounded-2xl bg-orange-600 hover:bg-orange-700"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {editing ? "Salvar alterações" : "Criar empresa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}