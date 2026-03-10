"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  CreditCard,
  Building2,
  Barcode,
  CheckCircle,
  AlertTriangle,
  Clock,
  Wifi,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface BoletoDDA {
  id: number;
  fornecedor: string;
  cnpj_cedente: string | null;
  valor: number;
  vencimento: string;
  linha_digitavel: string | null;
  codigo_barras: string | null;
  status_pagamento: string;
  data_pagamento: string | null;
  created_at: string;
}

interface ConexaoBancaria {
  id: number;
  banco_nome: string;
  banco_logo_url: string | null;
  status: string;
}

interface BoletoFormData {
  fornecedor: string;
  cnpj_cedente: string;
  valor: string;
  vencimento: string;
  linha_digitavel: string;
  codigo_barras: string;
}

const initialFormData: BoletoFormData = {
  fornecedor: "",
  cnpj_cedente: "",
  valor: "",
  vencimento: "",
  linha_digitavel: "",
  codigo_barras: "",
};

export default function BoletosDDAPage() {
  const [boletos, setBoletos] = useState<BoletoDDA[]>([]);
  const [conexoes, setConexoes] = useState<ConexaoBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BoletoFormData>(initialFormData);

  const fetchBoletos = async () => {
    try {
      const url =
        filter === "todos"
          ? "/api/boletos-dda"
          : `/api/boletos-dda?status=${filter}`;

      const res = await fetch(url, { cache: "no-store" });

      if (res.ok) {
        const data: BoletoDDA[] = await res.json();
        setBoletos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar boletos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConexoes = async () => {
    try {
      const res = await fetch("/api/conexoes-bancarias", { cache: "no-store" });

      if (res.ok) {
        const data: ConexaoBancaria[] = await res.json();
        setConexoes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar conexões:", error);
    }
  };

  useEffect(() => {
    fetchBoletos();
    fetchConexoes();
  }, [filter]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/boletos-dda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fornecedor: formData.fornecedor,
          cnpj_cedente: formData.cnpj_cedente || null,
          valor: parseFloat(formData.valor),
          vencimento: formData.vencimento,
          linha_digitavel: formData.linha_digitavel || null,
          codigo_barras: formData.codigo_barras || null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData(initialFormData);
        await fetchBoletos();
      }
    } catch (error) {
      console.error("Erro ao criar boleto:", error);
    }
  };

  const handlePagar = async (id: number) => {
    try {
      const res = await fetch(`/api/boletos-dda/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_pagamento: "pago",
          data_pagamento: new Date().toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        await fetchBoletos();
      }
    } catch (error) {
      console.error("Erro ao pagar boleto:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Excluir este boleto?")) return;

    try {
      const res = await fetch(`/api/boletos-dda/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchBoletos();
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const getStatusInfo = (boleto: BoletoDDA) => {
    if (boleto.status_pagamento === "pago") {
      return {
        label: "Pago",
        color: "text-green-600 bg-green-50",
        icon: CheckCircle,
      };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = new Date(boleto.vencimento);
    vencimento.setHours(0, 0, 0, 0);

    if (vencimento < hoje) {
      return {
        label: "Vencido",
        color: "text-red-600 bg-red-50",
        icon: AlertTriangle,
      };
    }

    const diffDays = Math.ceil(
      (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );

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
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const totalPendente = boletos
    .filter((b) => b.status_pagamento === "pendente")
    .reduce((sum, b) => sum + b.valor, 0);

  const totalVencido = boletos
    .filter((b) => {
      if (b.status_pagamento === "pago") return false;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const vencimento = new Date(b.vencimento);
      vencimento.setHours(0, 0, 0, 0);

      return vencimento < hoje;
    })
    .reduce((sum, b) => sum + b.valor, 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Boletos DDA</h1>
          <p className="text-muted-foreground">
            Cadastro manual de boletos para controle financeiro
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
                <Label htmlFor="fornecedor">Fornecedor / Cedente *</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fornecedor: e.target.value,
                    }))
                  }
                  placeholder="Nome do fornecedor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj_cedente">CNPJ do Cedente</Label>
                <Input
                  id="cnpj_cedente"
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        valor: e.target.value,
                      }))
                    }
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vencimento">Vencimento *</Label>
                  <Input
                    id="vencimento"
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
                <Label htmlFor="linha_digitavel">Linha Digitável</Label>
                <Input
                  id="linha_digitavel"
                  value={formData.linha_digitavel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      linha_digitavel: e.target.value,
                    }))
                  }
                  placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_barras">Código de Barras</Label>
                <Input
                  id="codigo_barras"
                  value={formData.codigo_barras}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      codigo_barras: e.target.value,
                    }))
                  }
                  placeholder="Código numérico do boleto"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
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
                  conectado(s) • Boletos são importados automaticamente
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Conecte seus bancos para importar boletos automaticamente
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {conexoes.slice(0, 3).map(
              (c) =>
                c.banco_logo_url && (
                  <img
                    key={c.id}
                    src={c.banco_logo_url}
                    alt={c.banco_nome}
                    className="h-8 w-8 rounded-lg bg-white object-contain p-1"
                    title={c.banco_nome}
                  />
                ),
            )}

            <Link href="/app/open-finance">
              <Button variant="outline" size="sm" className="gap-1">
                {conexoes.length > 0 ? "Gerenciar" : "Conectar"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pendente</p>
              <p className="text-xl font-bold">
                {formatCurrency(totalPendente)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Vencido</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(totalVencido)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Boletos Cadastrados
              </p>
              <p className="text-xl font-bold">{boletos.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="pago">Pagos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {boletos.length === 0 ? (
          <div className="rounded-xl border bg-card py-12 text-center">
            <Barcode className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum boleto cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Clique em &quot;Novo Boleto&quot; para adicionar
            </p>
          </div>
        ) : (
          boletos.map((boleto) => {
            const status = getStatusInfo(boleto);
            const StatusIcon = status.icon;

            return (
              <div
                key={boleto.id}
                className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <Building2 className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <h3 className="truncate font-semibold">
                        {boleto.fornecedor}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <div>
                        <span className="text-muted-foreground">Valor:</span>
                        <p className="font-semibold">
                          {formatCurrency(boleto.valor)}
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground">
                          Vencimento:
                        </span>
                        <p className="font-medium">
                          {formatDate(boleto.vencimento)}
                        </p>
                      </div>

                      {boleto.cnpj_cedente && (
                        <div>
                          <span className="text-muted-foreground">CNPJ:</span>
                          <p className="font-mono text-xs">
                            {boleto.cnpj_cedente}
                          </p>
                        </div>
                      )}

                      {boleto.data_pagamento && (
                        <div>
                          <span className="text-muted-foreground">
                            Pago em:
                          </span>
                          <p className="font-medium text-green-600">
                            {formatDate(boleto.data_pagamento)}
                          </p>
                        </div>
                      )}
                    </div>

                    {boleto.linha_digitavel && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">
                          Linha Digitável:
                        </span>
                        <p className="mt-1 break-all rounded bg-muted/50 px-2 py-1 font-mono text-xs">
                          {boleto.linha_digitavel}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {boleto.status_pagamento === "pendente" && (
                      <Button
                        size="sm"
                        onClick={() => handlePagar(boleto.id)}
                        className="gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Pagar
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(boleto.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}