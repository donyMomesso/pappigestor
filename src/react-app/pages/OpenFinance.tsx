import { useState, useEffect, useCallback } from "react";
import { Building2, Search, Wifi, WifiOff, RefreshCw, Trash2, ExternalLink, Download, AlertCircle, CheckCircle, User, Briefcase } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/react-app/components/ui/dialog";
import { PluggyConnect } from "react-pluggy-connect";
import { useAppAuth } from "@/contexts/AppAuthContext"; // ✅ IMPORTADO O CONTEXTO AQUI

interface Connector {
  id: number;
  name: string;
  imageUrl: string;
  primaryColor: string;
  type: string;
  country: string;
}

interface ConexaoBancaria {
  id: number;
  pluggy_item_id: string | null;
  banco_nome: string;
  banco_codigo: string | null;
  banco_logo_url: string | null;
  status: string;
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

export default function OpenFinance() {
  const { localUser } = useAppAuth(); // ✅ PUXANDO O USUÁRIO
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [conexoes, setConexoes] = useState<ConexaoBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConnectors, setLoadingConnectors] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConnectorDialog, setShowConnectorDialog] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [showPluggyWidget, setShowPluggyWidget] = useState(false);
  
  // Campos PF/PJ
  const [docType, setDocType] = useState<"PF" | "PJ">("PF");
  const [docNumber, setDocNumber] = useState("");
  const [responsibleCpf, setResponsibleCpf] = useState("");
  const [docError, setDocError] = useState<string | null>(null);

  // ✅ FUNÇÃO QUE GERA OS HEADERS COM O CRACHÁ
  const getHeaders = useCallback(() => {
    const pId = localStorage.getItem("pId") || localStorage.getItem("pizzariaId") || "";
    const email = localUser?.email || localStorage.getItem("userEmail") || "";
    return {
      "Content-Type": "application/json",
      "x-pizzaria-id": pId,
      "x-empresa-id": pId,
      "x-user-email": email
    };
  }, [localUser]);

  // Buscar conexões existentes
  const fetchConexoes = useCallback(async () => {
    try {
      const res = await fetch("/api/conexoes-bancarias", {
        headers: getHeaders() // ✅ CABEÇALHOS APLICADOS
      });
      if (res.ok) {
        const data = await res.json();
        setConexoes(data);
      }
    } catch (error) {
      console.error("Erro ao buscar conexões:", error);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // Buscar conectores da Pluggy via backend (evita CORS)
  const fetchConnectors = async (accountType: "PF" | "PJ" = docType) => {
    setLoadingConnectors(true);
    setSelectedConnector(null);
    try {
      const res = await fetch(`/api/pluggy/connectors?accountType=${accountType}`, {
        headers: getHeaders() // ✅ CABEÇALHOS APLICADOS
      });
      if (res.ok) {
        const data = await res.json();
        setConnectors(data.results || []);
      }
    } catch (error) {
      console.error("Erro ao buscar conectores:", error);
    } finally {
      setLoadingConnectors(false);
    }
  };

  useEffect(() => {
    fetchConexoes();
  }, [fetchConexoes]);

  const handleOpenConnectorList = () => {
    setShowConnectorDialog(true);
    setConnectError(null);
    fetchConnectors(docType);
  };
  
  const handleDocTypeChange = (newType: "PF" | "PJ") => {
    setDocType(newType);
    setDocError(null);
    setSelectedConnector(null);
    if (showConnectorDialog) {
      fetchConnectors(newType);
    }
  };

  const handleSelectConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    setConnectError(null);
  };

  // Validar documento
  const validateDocument = (): boolean => {
    setDocError(null);
    const cleanDoc = docNumber.replace(/\D/g, '');
    
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
      const cleanCpf = responsibleCpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        setDocError("Para conta PJ, informe CPF do responsável (11 dígitos)");
        return false;
      }
    }
    return true;
  };

  // Iniciar conexão via Pluggy Connect Widget
  const handleConnect = async () => {
    if (!selectedConnector) return;
    if (!validateDocument()) return;
    
    setConnecting(true);
    setConnectError(null);

    try {
      const tokenRes = await fetch("/api/pluggy/connect-token", { 
        method: "POST",
        headers: getHeaders(), // ✅ CABEÇALHOS APLICADOS
        body: JSON.stringify({
          docType,
          docNumber: docNumber.replace(/\D/g, ''),
          responsibleCpf: docType === "PJ" ? responsibleCpf.replace(/\D/g, '') : undefined,
        }),
      });
      
      if (!tokenRes.ok) {
        const error = await tokenRes.json();
        setConnectError(error.error || "Erro ao obter token de conexão");
        setConnecting(false);
        return;
      }

      const { connectToken: token } = await tokenRes.json();
      setConnectToken(token);
      setShowPluggyWidget(true);
    } catch (error) {
      console.error("Erro ao conectar:", error);
      setConnectError("Erro ao iniciar conexão");
      setConnecting(false);
    }
  };

  // Callback de sucesso do Pluggy Connect
  const handlePluggySuccess = async (data: { item: { id: string; connector?: { name?: string; imageUrl?: string } } }) => {
    try {
      const connectorName = selectedConnector?.name || data.item.connector?.name || "Banco conectado";
      const connectorLogo = selectedConnector?.imageUrl || data.item.connector?.imageUrl || "";
      
      await fetch("/api/pluggy/conexao", {
        method: "POST",
        headers: getHeaders(), // ✅ CABEÇALHOS APLICADOS
        body: JSON.stringify({
          itemId: data.item.id,
          connectorName,
          connectorLogo,
        }),
      });
      
      setShowPluggyWidget(false);
      setConnectToken(null);
      setShowConnectorDialog(false);
      setSelectedConnector(null);
      setConnecting(false);
      fetchConexoes();
    } catch (error) {
      console.error("Erro ao salvar conexão:", error);
      setConnectError("Erro ao salvar conexão");
    }
  };

  // Callback de erro do Pluggy Connect
  const handlePluggyError = (error: { message?: string }) => {
    console.error("Erro no Pluggy Connect:", error);
    setConnectError(error.message || "Erro ao conectar com o banco");
    setShowPluggyWidget(false);
    setConnectToken(null);
    setConnecting(false);
  };

  const handlePluggyClose = () => {
    setShowPluggyWidget(false);
    setConnectToken(null);
    setConnecting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja remover esta conexão bancária?")) return;
    try {
      const res = await fetch(`/api/conexoes-bancarias/${id}`, { 
        method: "DELETE",
        headers: getHeaders() // ✅ CABEÇALHOS APLICADOS
      });
      if (res.ok) {
        fetchConexoes();
      }
    } catch (error) {
      console.error("Erro ao remover conexão:", error);
    }
  };

  // Sincronizar boletos de uma conexão
  const handleSyncBoletos = async (conexao: ConexaoBancaria) => {
    if (!conexao.pluggy_item_id) {
      setSyncResult({ success: false, error: "Conexão não possui itemId do Pluggy" });
      return;
    }

    setSyncing(conexao.id);
    setSyncResult(null);

    try {
      const res = await fetch(`/api/pluggy/sincronizar-boletos/${conexao.pluggy_item_id}`, {
        method: "POST",
        headers: getHeaders() // ✅ CABEÇALHOS APLICADOS
      });

      const data = await res.json();
      
      if (res.ok) {
        setSyncResult({
          success: true,
          importados: data.importados,
          duplicados: data.duplicados,
          total: data.total,
        });
        fetchConexoes();
      } else {
        setSyncResult({ success: false, error: data.error || "Erro ao sincronizar" });
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      setSyncResult({ success: false, error: "Erro de conexão" });
    } finally {
      setSyncing(null);
    }
  };

  const filteredConnectors = connectors.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (conexao: ConexaoBancaria) => {
    if (conexao.status === "ativo" && conexao.pluggy_item_id) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <Wifi className="h-3 w-3" />
          Conectado
        </span>
      );
    }
    if (conexao.status === "erro") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <WifiOff className="h-3 w-3" />
          Erro
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <AlertCircle className="h-3 w-3" />
        Pendente Autorização
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pluggy Connect Widget */}
      {showPluggyWidget && connectToken && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
            <PluggyConnect
              connectToken={connectToken}
              connectorTypes={docType === "PJ" ? ["BUSINESS_BANK"] : ["PERSONAL_BANK"]}
              onSuccess={handlePluggySuccess}
              onError={handlePluggyError}
              onClose={handlePluggyClose}
            />
            <div className="p-3 border-t bg-gray-50 text-center">
              <button 
                onClick={handlePluggyClose}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Cancelar e fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Open Finance</h1>
          <p className="text-muted-foreground">
            Conecte suas contas bancárias para importar boletos automaticamente via DDA
          </p>
        </div>
        <Button onClick={handleOpenConnectorList} className="gap-2">
          <Building2 className="h-4 w-4" />
          Conectar Banco
        </Button>
      </div>

      {/* Sync Result Alert */}
      {syncResult && (
        <div className={`p-4 rounded-lg border ${
          syncResult.success 
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
            : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
        }`}>
          <div className="flex items-center gap-2">
            {syncResult.success ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-200">
                  Sincronização concluída! {syncResult.importados} boleto(s) importado(s)
                  {syncResult.duplicados ? `, ${syncResult.duplicados} já existente(s)` : ""}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-red-800 dark:text-red-200">{syncResult.error}</span>
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

      {/* Info Card */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <Wifi className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Como funciona?</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Clique em "Conectar Banco" e selecione sua instituição financeira</li>
              <li>Autorize o acesso via widget seguro do Pluggy</li>
              <li>Seus boletos DDA serão importados automaticamente</li>
              <li>Use o botão "Sincronizar" para buscar novos boletos</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Connected Banks */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Bancos Conectados</h2>
        
        {conexoes.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum banco conectado</p>
            <p className="text-sm text-muted-foreground mb-4">
              Conecte um banco para começar a importar boletos automaticamente
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
                className="bg-card rounded-xl p-4 border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {conexao.banco_logo_url ? (
                      <img
                        src={conexao.banco_logo_url}
                        alt={conexao.banco_nome}
                        className="w-10 h-10 rounded-lg object-contain bg-white p-1"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
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
                  <p className="text-xs text-muted-foreground mb-3">
                    Última sync: {new Date(conexao.ultima_sincronizacao).toLocaleString("pt-BR")}
                  </p>
                )}
                
                <div className="flex items-center gap-2">
                  {conexao.pluggy_item_id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncBoletos(conexao)}
                      disabled={syncing === conexao.id}
                      className="flex-1 gap-1"
                    >
                      {syncing === conexao.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {syncing === conexao.id ? "Sincronizando..." : "Importar Boletos"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleOpenConnectorList}
                      className="flex-1 gap-1"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reconectar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(conexao.id)}
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

      {/* Connector Selection Dialog */}
      <Dialog open={showConnectorDialog} onOpenChange={setShowConnectorDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Selecione seu Banco</DialogTitle>
          </DialogHeader>
          
          {selectedConnector ? (
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <img
                  src={selectedConnector.imageUrl}
                  alt={selectedConnector.name}
                  className="w-12 h-12 rounded-lg object-contain bg-white p-1"
                />
                <div>
                  <h3 className="font-semibold">{selectedConnector.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Preencha os dados abaixo para autorizar acesso aos seus boletos
                  </p>
                </div>
              </div>
              
              {/* Seletor PF/PJ */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Tipo de Conta</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={docType === "PF" ? "default" : "outline"}
                      onClick={() => handleDocTypeChange("PF")}
                      className={`flex-1 gap-2 ${docType === "PF" ? "bg-primary" : ""}`}
                    >
                      <User className="h-4 w-4" />
                      Pessoa Física (CPF)
                    </Button>
                    <Button
                      type="button"
                      variant={docType === "PJ" ? "default" : "outline"}
                      onClick={() => handleDocTypeChange("PJ")}
                      className={`flex-1 gap-2 ${docType === "PJ" ? "bg-primary" : ""}`}
                    >
                      <Briefcase className="h-4 w-4" />
                      Empresa (CNPJ)
                    </Button>
                  </div>
                </div>
                
                {/* Campo CPF ou CNPJ */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    {docType === "PF" ? "CPF" : "CNPJ"}
                  </Label>
                  <Input
                    placeholder={docType === "PF" ? "000.000.000-00" : "00.000.000/0001-00"}
                    value={docNumber}
                    onChange={(e) => { setDocNumber(e.target.value); setDocError(null); }}
                    className="font-mono"
                  />
                </div>
                
                {/* CPF do Responsável (apenas PJ) */}
                {docType === "PJ" && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      CPF do Responsável
                    </Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={responsibleCpf}
                      onChange={(e) => { setResponsibleCpf(e.target.value); setDocError(null); }}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      CPF do sócio ou responsável legal pela conta bancária
                    </p>
                  </div>
                )}
                
                {/* Erro de validação */}
                {docError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{docError}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Instrução para PJ */}
              {docType === "PJ" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>📋 Importante:</strong> No Pluggy, selecione a aba <strong>EMPRESAS</strong> e 
                    escolha o banco PJ (ex: Itaú Empresas, Bradesco PJ, Santander Empresas).
                  </p>
                </div>
              )}
              
              {connectError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{connectError}</span>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>🔒 Segurança:</strong> A conexão é feita via Pluggy, plataforma certificada 
                  pelo Banco Central para Open Finance. Suas credenciais bancárias são processadas 
                  diretamente pelo Pluggy e nunca ficam armazenadas em nosso sistema.
                </p>
              </div>
              
              <div className="sticky bottom-0 bg-background border-t pt-4 pb-2 mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedConnector(null)}>
                  Voltar
                </Button>
                <Button onClick={handleConnect} disabled={connecting} size="lg" className="px-6">
                  {connecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      {docType === "PF" ? <User className="h-4 w-4 mr-2" /> : <Briefcase className="h-4 w-4 mr-2" />}
                      {docType === "PF" ? "Conectar (CPF)" : "Conectar (CNPJ)"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar banco..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="min-h-0">
                {loadingConnectors ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredConnectors.map((connector) => (
                      <button
                        key={connector.id}
                        onClick={() => handleSelectConnector(connector)}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-center"
                      >
                        <img
                          src={connector.imageUrl}
                          alt={connector.name}
                          className="w-10 h-10 rounded-lg object-contain"
                        />
                        <span className="text-sm font-medium line-clamp-2">
                          {connector.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                
                {!loadingConnectors && filteredConnectors.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum banco encontrado
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t mt-4">
                <a
                  href="https://pluggy.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Powered by Pluggy - Open Finance Brasil
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