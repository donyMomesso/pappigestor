"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Package,
  AlertTriangle,
  DollarSign,
  Calendar,
  Building2,
  Loader2,
} from "lucide-react";

interface LancamentoPendente {
  id: number;
  data_pedido: string;
  fornecedor: string;
  categoria: string;
  valor_previsto: number;
  status_aprovacao: string;
  created_at: string;
  criado_por_nome?: string;
}

export default function AprovacoesPage() {
  const [pendentes, setPendentes] = useState<LancamentoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<number | null>(null);
  const [showRejeitar, setShowRejeitar] = useState<number | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  const fetchPendentes = useCallback(async () => {
    try {
      const response = await fetch("/api/lancamentos/pendentes-aprovacao", {
        cache: "no-store",
      });

      if (response.ok) {
        const data: LancamentoPendente[] = await response.json();
        setPendentes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar pendentes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendentes();
  }, [fetchPendentes]);

  const handleAprovar = async (id: number) => {
    setProcessando(id);

    try {
      const response = await fetch(`/api/lancamentos/${id}/aprovacao`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "aprovar" }),
      });

      if (response.ok) {
        setPendentes((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Erro ao aprovar:", error);
    } finally {
      setProcessando(null);
    }
  };

  const handleRejeitar = async () => {
    if (!showRejeitar) return;

    setProcessando(showRejeitar);

    try {
      const response = await fetch(
        `/api/lancamentos/${showRejeitar}/aprovacao`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acao: "rejeitar",
            motivo_rejeicao: motivoRejeicao,
          }),
        },
      );

      if (response.ok) {
        setPendentes((prev) => prev.filter((p) => p.id !== showRejeitar));
        setShowRejeitar(null);
        setMotivoRejeicao("");
      }
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
    } finally {
      setProcessando(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Clock className="h-7 w-7 text-orange-500" />
            Aprovações Pendentes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Compras aguardando aprovação por ultrapassarem o limite de alçada
          </p>
        </div>

        {pendentes.length > 0 && (
          <div className="rounded-full bg-orange-100 px-4 py-2 font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            {pendentes.length} pendente{pendentes.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {pendentes.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Tudo em dia! 🎉
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Não há compras pendentes de aprovação no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendentes.map((lancamento) => (
            <Card
              key={lancamento.id}
              className="overflow-hidden border-0 shadow-lg transition-shadow hover:shadow-xl"
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-4 md:p-6">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                          <Building2 className="h-5 w-5 text-gray-400" />
                          {lancamento.fornecedor}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {lancamento.categoria}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <Clock className="h-4 w-4" />
                        Pendente
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Valor:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(lancamento.valor_previsto)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Data:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(lancamento.data_pedido)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-purple-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Pedido:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          #{lancamento.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-2 bg-gray-50 p-4 md:w-48 md:flex-col md:p-6 dark:bg-gray-800/50">
                    <Button
                      onClick={() => handleAprovar(lancamento.id)}
                      disabled={processando === lancamento.id}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700 md:flex-none"
                    >
                      {processando === lancamento.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aprovar
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setShowRejeitar(lancamento.id)}
                      disabled={processando === lancamento.id}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50 md:flex-none dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={showRejeitar !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowRejeitar(null);
            setMotivoRejeicao("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Rejeitar Compra
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Informe o motivo da rejeição para que o comprador possa entender e
              corrigir se necessário.
            </p>

            <div>
              <Label htmlFor="motivo">Motivo da Rejeição</Label>
              <Input
                id="motivo"
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Ex: Valor acima do orçamento do mês..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejeitar(null);
                setMotivoRejeicao("");
              }}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleRejeitar}
              disabled={processando !== null}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {processando !== null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}