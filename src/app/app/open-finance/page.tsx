"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle,
  User,
  Briefcase,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppAuth } from "@/contexts/AppAuthContext";

interface Connector {
  id: number;
  name: string;
  imageUrl: string;
  primaryColor?: string;
  type?: string;
  country?: string;
}

type StatusConexao = "ativo" | "erro" | "pendente";

interface ConexaoBancaria {
  id: string;
  empresa_id: string;
  pluggy_item_id: string | null;
  banco_nome: string;
  banco_codigo: string | null;
  banco_logo_url: string | null;
  status: StatusConexao;
  ultima_sincronizacao: string | null;
  created_at: string;
}

interface SyncResult {
  success: boolean;
  importados?: number;
  duplicados?: number;
  total?: number;
  error?: string;
}

type DocType = "PF" | "PJ";

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export default function OpenFinancePage() {
  const { localUser } = useAppAuth();

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [conexoes, setConexoes] = useState<ConexaoBancaria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingConnectors, setLoadingConnectors] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [showConnectorDialog, setShowConnectorDialog] =
    useState<boolean>(false);
  const [selectedConnector, setSelectedConnector] =
    useState<Connector | null>(null);

  const [connecting, setConnecting] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const [connectError, setConnectError] = useState<string | null>(null);

  const [docType, setDocType] = useState<DocType>("PJ");
  const [docNumber, setDocNumber] = useState<string>("");
  const [responsibleCpf, setResponsibleCpf] = useState<string>("");
  const [docError, setDocError] = useState<string | null>(null);

  const empresaId =
    localUser?.empresa_id ||
    localStorage.getItem("empresa_id") ||
    localStorage.getItem("pId") ||
    localStorage.getItem("empresaId") ||
    "";

  const userEmail = localUser?.email || localStorage.getItem("userEmail") || "";

  const getHeaders = useCallback(
    (withJson = true): HeadersInit => {
      const headers: Record<string, string> = {
        "x-empresa-id": empresaId,
        "x-user-email": userEmail,
      };

      if (withJson) {
        headers["Content-Type"] = "application/json";
      }

      return headers;
    },
    [empresaId, userEmail],
  );

  const fetchConexoes = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/conexoes-bancarias", {
        headers: getHeaders(false),
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Falha ao buscar conexões bancárias");
      }

      const data = (await res.json()) as ConexaoBancaria[];
      setConexoes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar conexões:", error);
      setConexoes([]);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const fetchConnectors = useCallback(async () => {
    setLoadingConnectors(true);
    setSelectedConnector(null);

    try {
      const res = await fetch("/api/pluggy/connectors", {
        headers: getHeaders(false),
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Falha ao buscar bancos");
      }

      const data = await res.json();
      setConnectors(Array.isArray(data?.results) ? data.results : []);
    } catch (error) {
      console.error("Erro ao buscar bancos:", error);
      setConnectors([]);
    } finally {
      setLoadingConnectors(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    void fetchConexoes();
  }, [fetchConexoes]);

  function handleOpenConnectorList(): void {
    setShowConnectorDialog(true);
    setConnectError(null);
    setDocError(null);
    void fetchConnectors();
  }

  function handleDocTypeChange(newType: DocType): void {
    setDocType(newType);
    setDocError(null);
  }

  function handleSelectConnector(connector: Connector): void {
    setSelectedConnector(connector);
    setConnectError(null);
  }

  function validateDocument(): boolean {
    setDocError(null);

    const cleanDoc = onlyDigits(docNumber);

    if (docType === "PF") {
      if (cleanDoc.length !== 11) {
        setDocError("CPF deve ter 11 dígitos");
        return false;
      }
    } else {
      if (cleanDoc.length !== 14) {
        setDocError("CNPJ deve ter 14 dígitos");
        return false;
      }

      const cleanCpf = onlyDigits(responsibleCpf);
      if (cleanCpf.length !== 11) {
        setDocError("Informe o CPF do responsável com 11 dígitos");
        return false;
      }
    }

    return true;
  }

  async function handleConnect(): Promise<void> {
    if (!selectedConnector) return;
    if (!validateDocument()) return;

    try {
      setConnecting(true);
      setConnectError(null);

      const res = await fetch("/api/pluggy/conexao", {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({
          connectorId: selectedConnector.id,
          connectorName: selectedConnector.name,
          connectorLogo: selectedConnector.imageUrl,
          bancoCodigo: String(selectedConnector.id),
          docType,
          docNumber: onlyDigits(docNumber),
          responsibleCpf: docType === "PJ" ? onlyDigits(responsibleCpf) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setConnectError(data?.error || "Erro ao salvar conexão");
        setConnecting(false);
        return;
      }

      setShowConnectorDialog(false);
      setSelectedConnector(null);
      setDocNumber("");
      setResponsibleCpf("");
      setDocError(null);
      setConnecting(false);

      await fetchConexoes();
    } catch (error) {
      console.error("Erro ao conectar:", error);
      setConnectError("Erro ao criar conexão bancária");
      setConnecting(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    const confirmed = window.confirm("Deseja remover esta conexão bancária?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/conexoes-bancarias/${id}`, {
        method: "DELETE",
        headers: getHeaders(false),
      });

      if (!res.ok) {
        throw new Error("Erro ao remover conexão");
      }

      await fetchConexoes();
    } catch (error) {
      console.error("Erro ao remover conexão:", error);
      window.alert("Não foi possível remover a conexão bancária.");
    }
  }

  async function handleSyncBoletos(conexao: ConexaoBancaria): Promise<void> {
    setSyncing(conexao.id);
    setSyncResult(null);

    try {
      const res = await fetch(`/api/pluggy/sincronizar-boletos/${conexao.id}`, {
        method: "POST",
        headers: getHeaders(false),
      });

      const data = await res.json();

      if (!res.ok) {
        setSyncResult({
          success: false,
          error: data?.error || "Erro ao sincronizar boletos",
        });
        return;
      }

      setSyncResult({
        success: true,
        importados: data.importados,
        duplicados: data.duplicados,
        total: data.total,
      });

      await fetchConexoes();
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      setSyncResult({
        success: false,
        error: "Erro ao sincronizar boletos",
      });
    } finally {
      setSyncing(null);
    }
  }

  const filteredConnectors = useMemo(() => {
    return connectors.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [connectors, searchTerm]);

  function getStatusBadge(conexao: ConexaoBancaria) {
    if (conexao.status === "ativo") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          <Wifi className="h-3 w-3" />
          Conectado
        </span>
      );
    }

    if (conexao.status === "erro") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          <WifiOff className="h-3 w-3" />
          Erro
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        <AlertCircle className="h-3 w-3" />
        Pendente
      </span>
    );
  }

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
          <h1 className="text-2xl font-bold text-foreground">Open Finance</h1>
          <p className="text-muted-foreground">
            Conecte bancos manualmente e simule importação de boletos no Pappi
            Gestor
          </p>
        </div>

        <Button onClick={handleOpenConnectorList} className="gap-2">
          <Building2 className="h-4 w-4" />
          Conectar Banco
        </Button>
      </div>

      {syncResult && (
        <div
          className={`rounded-lg border p-4 ${
            syncResult.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncResult.success ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">
                  Sincronização concluída. {syncResult.importados || 0} boleto(s)
                  importado(s)
                  {syncResult.duplicados
                    ? `, ${syncResult.duplicados} duplicado(s)`
                    : ""}
                  {typeof syncResult.total === "number"
                    ? ` de ${syncResult.total}`
                    : ""}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{syncResult.error}</span>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setSyncResult(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-purple-100 p-3">
            <Wifi className="h-6 w-6 text-purple-600" />
          </div>

          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-foreground">
              Modo atual do Open Finance
            </h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Você conecta o banco manualmente</li>
              <li>O sistema salva a conexão por empresa</li>
              <li>O botão importar gera boletos DDA de teste no banco de dados</li>
              <li>Isso já permite validar o fluxo financeiro sem Pluggy</li>
            </ol>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Bancos Conectados</h2>

        {conexoes.length === 0 ? (
          <div className="rounded-xl border bg-card py-12 text-center">
            <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum banco conectado</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Conecte um banco para começar a alimentar o financeiro
            </p>
            <Button onClick={handleOpenConnectorList} variant="outline">
              Conectar Primeiro Banco
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conexoes.map((conexao) => (
              <div
                key={conexao.id}
                className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {conexao.banco_logo_url ? (
                      <img
                        src={conexao.banco_logo_url}
                        alt={conexao.banco_nome}
                        className="h-10 w-10 rounded-lg bg-white p-1 object-contain"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold">{conexao.banco_nome}</h3>
                      {getStatusBadge(conexao)}
                    </div>
                  </div>
                </div>

                {conexao.ultima_sincronizacao && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    Última sync:{" "}
                    {new Date(conexao.ultima_sincronizacao).toLocaleString(
                      "pt-BR",
                    )}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleSyncBoletos(conexao)}
                    disabled={syncing === conexao.id}
                    className="flex-1 gap-1"
                  >
                    {syncing === conexao.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {syncing === conexao.id
                      ? "Importando..."
                      : "Importar Boletos"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleDelete(conexao.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showConnectorDialog} onOpenChange={setShowConnectorDialog}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-h-[80vh] sm:max-w-2xl">
          <DialogHeader className="px-6 pb-4 pt-6">
            <DialogTitle>Selecione seu Banco</DialogTitle>
          </DialogHeader>

          {selectedConnector ? (
            <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-6">
              <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
                <img
                  src={selectedConnector.imageUrl}
                  alt={selectedConnector.name}
                  className="h-12 w-12 rounded-lg bg-white p-1 object-contain"
                />
                <div>
                  <h3 className="font-semibold">{selectedConnector.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Preencha os dados para cadastrar a conexão manual
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    Tipo de Conta
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={docType === "PF" ? "default" : "outline"}
                      onClick={() => handleDocTypeChange("PF")}
                      className="flex-1 gap-2"
                    >
                      <User className="h-4 w-4" />
                      Pessoa Física
                    </Button>

                    <Button
                      type="button"
                      variant={docType === "PJ" ? "default" : "outline"}
                      onClick={() => handleDocTypeChange("PJ")}
                      className="flex-1 gap-2"
                    >
                      <Briefcase className="h-4 w-4" />
                      Empresa
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    {docType === "PF" ? "CPF" : "CNPJ"}
                  </Label>
                  <Input
                    placeholder={
                      docType === "PF"
                        ? "000.000.000-00"
                        : "00.000.000/0001-00"
                    }
                    value={docNumber}
                    onChange={(e) => {
                      setDocNumber(e.target.value);
                      setDocError(null);
                    }}
                    className="font-mono"
                  />
                </div>

                {docType === "PJ" && (
                  <div>
                    <Label className="mb-2 block text-sm font-medium">
                      CPF do Responsável
                    </Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={responsibleCpf}
                      onChange={(e) => {
                        setResponsibleCpf(e.target.value);
                        setDocError(null);
                      }}
                      className="font-mono"
                    />
                  </div>
                )}

                {docError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{docError}</span>
                    </div>
                  </div>
                )}
              </div>

              {connectError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{connectError}</span>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  Este modo funciona sem Pluggy. Ele cria a conexão bancária no
                  banco e permite testar importação de boletos no financeiro do
                  Pappi Gestor.
                </p>
              </div>

              <div className="sticky bottom-0 mt-4 flex justify-end gap-2 border-t bg-background pb-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedConnector(null)}
                >
                  Voltar
                </Button>

                <Button
                  onClick={() => void handleConnect()}
                  disabled={connecting}
                  size="lg"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      {docType === "PF" ? (
                        <User className="mr-2 h-4 w-4" />
                      ) : (
                        <Briefcase className="mr-2 h-4 w-4" />
                      )}
                      Conectar Banco
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar banco..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loadingConnectors ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {filteredConnectors.map((connector) => (
                    <button
                      key={connector.id}
                      type="button"
                      onClick={() => handleSelectConnector(connector)}
                      className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <img
                        src={connector.imageUrl}
                        alt={connector.name}
                        className="h-10 w-10 rounded-lg object-contain"
                      />
                      <span className="line-clamp-2 text-sm font-medium">
                        {connector.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!loadingConnectors && filteredConnectors.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum banco encontrado
                </div>
              )}

              <div className="mt-4 border-t pt-4">
                <a
                  href="https://pluggy.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Preparado para futura integração real
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}