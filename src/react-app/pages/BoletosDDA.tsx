"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  Wifi,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
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
import { useAppAuth } from "@/contexts/AppAuthContext";

interface BoletoDDA {
  id: string;
  fornecedor_nome: string;
  cnpj_cedente: string | null;
  valor: number;
  vencimento: string;
  linha_digitavel: string | null;
  codigo_barras: string | null;
  status_pagamento: "pendente" | "pago" | "cancelado";
  data_pagamento: string | null;
  created_at: string;
}

interface ConexaoBancaria {
  id: string;
  banco_nome: string;
  banco_logo_url: string | null;
  status: string;
}

type FormState = {
  fornecedor_nome: string;
  cnpj_cedente: string;
  valor: string;
  vencimento: string;
  linha_digitavel: string;
  codigo_barras: string;
};

const INITIAL_FORM: FormState = {
  fornecedor_nome: "",
  cnpj_cedente: "",
  valor: "",
  vencimento: "",
  linha_digitavel: "",
  codigo_barras: "",
};

export default function BoletosDDA() {
  const { localUser } = useAppAuth();

  const [empresaId, setEmpresaId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [boletos, setBoletos] = useState<BoletoDDA[]>([]);
  const [conexoes, setConexoes] = useState<ConexaoBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedEmpresaId =
      localStorage.getItem("empresa_id") ||
      localStorage.getItem("pizzariaId") ||
      "";

    const storedUserEmail = localStorage.getItem("userEmail") || "";

    setEmpresaId(localUser?.empresa_id || storedEmpresaId);
    setUserEmail(localUser?.email || storedUserEmail);
  }, [localUser?.empresa_id, localUser?.email]);

  const getAuthHeaders = (extra?: Record<string, string>) => ({
    "x-empresa-id": empresaId,
    "x-user-email": userEmail,
    ...extra,
  });

  async function fetchBoletos() {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const url =
        filter === "todos"
          ? "/api/boletos-dda"
          : `/api/boletos-dda?status=${encodeURIComponent(filter)}`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = (await res.json()) as BoletoDDA[];
      setBoletos(data);
    } catch (error) {
      console.error("Erro ao buscar boletos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchConexoes() {
    if (!empresaId) return;

    try {
      const res = await fetch("/api/conexoes-bancarias", {
        headers: getAuthHeaders(),
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = (await res.json()) as ConexaoBancaria[];
      setConexoes(data);
    } catch (error) {
      console.error("Erro ao buscar conexões:", error);
    }
  }

  useEffect(() => {
    if (!empresaId) return;
    void fetchBoletos();
    void fetchConexoes();
  }, [filter, empresaId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const res = await fetch("/api/boletos-dda", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          fornecedor_nome: formData.fornecedor_nome,
          cnpj_cedente: formData.cnpj_cedente || null,
          valor: parseFloat(formData.valor),
          vencimento: formData.vencimento,
          linha_digitavel: formData.linha_digitavel || null,
          codigo_barras: formData.codigo_barras || null,
        }),
      });

      if (!res.ok) return;

      setShowForm(false);
      setFormData(INITIAL_FORM);
      void fetchBoletos();
    } catch (error) {
      console.error("Erro ao criar boleto:", error);
    }
  }

  async function handlePagar(id: string) {
    try {
      const res = await fetch(`/api/boletos-dda/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          status_pagamento: "pago",
          data_pagamento: new Date().toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        void fetchBoletos();
      }
    } catch (error) {
      console.error("Erro ao pagar boleto:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este boleto?")) return;

    try {
      const res = await fetch(`/api/boletos-dda/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        void fetchBoletos();
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  }

  function getStatusInfo(boleto: BoletoDDA) {
    if (boleto.status_pagamento === "pago") {
      return {
        label: "Pago",
        color: "text-green-600 bg-green-50",
        icon: CheckCircle,
      };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = new Date(`${boleto.vencimento}T00:00:00`);

    if (vencimento < hoje) {
      return {
        label: "Vencido",
        color: "text-red-600 bg-red-50",
        icon: AlertTriangle,
      };
    }

    const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / 86400000);

    if (diffDays <= 3) {
      return {
        label: `Vence em ${diffDays}d`,
        color: "text-amber-600 bg-amber-50",
        icon: Clock,
      };
    }

    return {
      label: "Pendente",
      color: "text-blue-600 bg-blue-50",
      icon: Clock,
    };
  }

  const totalPendente = useMemo(
    () =>
      boletos
        .filter((b) => b.status_pagamento === "pendente")
        .reduce((sum, b) => sum + b.valor, 0),
    [boletos],
  );

  const totalVencido = useMemo(
    () =>
      boletos
        .filter(
          (b) =>
            b.status_pagamento !== "pago" &&
            new Date(`${b.vencimento}T00:00:00`) < new Date(),
        )
        .reduce((sum, b) => sum + b.valor, 0),
    [boletos],
  );

  const totalPago = useMemo(
    () =>
      boletos
        .filter((b) => b.status_pagamento === "pago")
        .reduce((sum, b) => sum + b.valor, 0),
    [boletos],
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Boletos DDA</h1>
          <p className="text-muted-foreground">
            Cadastro e controle de boletos com reflexo no financeiro
          </p>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Boleto
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Boleto</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Fornecedor / Cedente *</Label>
                <Input
                  value={formData.fornecedor_nome}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fornecedor_nome: e.target.value,
                    }))
                  }
                  placeholder="Nome do fornecedor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>CNPJ do Cedente</Label>
                <Input
                  value={formData.cnpj_cedente}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cnpj_cedente: e.target.value,
                    }))
                  }
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        valor: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vencimento *</Label>
                  <Input
                    type="date"
                    value={formData.vencimento}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vencimento: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Linha Digitável</Label>
                <Input
                  value={formData.linha_digitavel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      linha_digitavel: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Código de Barras</Label>
                <Input
                  value={formData.codigo_barras}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      codigo_barras: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 dark:border-purple-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/50">
              <Wifi className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>

            <div>
              <h3 className="font-semibold text-foreground">Open Finance</h3>
              {conexoes.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {conexoes.filter((c) => c.status === "ativo").length} banco(s)
                  conectado(s)
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Conecte seus bancos para importar boletos automaticamente
                </p>
              )}
            </div>
          </div>

          <Link href="/open-finance">
            <Button variant="outline" size="sm" className="gap-1">
              {conexoes.length > 0 ? "Gerenciar" : "Conectar"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalPendente)}</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Vencidos</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {formatCurrency(totalVencido)}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pagos</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatCurrency(totalPago)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="pago">Pagos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {boletos.map((boleto) => {
          const status = getStatusInfo(boleto);
          const Icon = status.icon;

          return (
            <div
              key={boleto.id}
              className="flex items-start justify-between gap-4 rounded-xl border bg-card p-4"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{boleto.fornecedor_nome}</h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${status.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  Vence em {formatDate(boleto.vencimento)}
                </p>

                {boleto.linha_digitavel ? (
                  <p className="break-all text-xs text-muted-foreground">
                    {boleto.linha_digitavel}
                  </p>
                ) : null}

                {boleto.codigo_barras ? (
                  <p className="break-all text-xs text-muted-foreground">
                    {boleto.codigo_barras}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(boleto.valor)}</p>
                </div>

                <div className="flex items-center gap-2">
                  {boleto.status_pagamento !== "pago" ? (
                    <Button size="sm" onClick={() => void handlePagar(boleto.id)}>
                      Marcar pago
                    </Button>
                  ) : null}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDelete(boleto.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {!boletos.length && (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhum boleto encontrado.
          </div>
        )}
      </div>
    </div>
  );
}