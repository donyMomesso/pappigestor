"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/react-app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/react-app/components/ui/card";
import { Checkbox } from "@/react-app/components/ui/checkbox";

import {
  QrCode,
  Camera,
  ShoppingCart,
  Store,
  Receipt,
  Check,
  X,
  Loader2,
  Package,
  DollarSign,
  AlertCircle,
  Link as LinkIcon,
  RefreshCw,
  Barcode,
  ClipboardList,
  CheckCircle2,
  Upload,
  ImageIcon,
} from "lucide-react";

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface ItemNfce {
  codigo?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
}

interface DadosNfce {
  emitente: {
    razao_social: string;
    nome_fantasia?: string;
    cnpj: string;
    endereco?: string;
  };
  itens: ItemNfce[];
  totais: {
    subtotal: number;
    desconto: number;
    acrescimo: number;
    total: number;
  };
  pagamento: {
    forma: string;
    valor_pago: number;
    troco: number;
  };
  dados_nfce: {
    numero: string;
    serie: string;
    data_emissao: string;
    chave_acesso: string;
  };
}

interface CompraRegistrada {
  fornecedor_id: number | null;
  fornecedor_criado: boolean;
  lancamento_id: number;
  itens_registrados: number;
  valor_total: number;
}

interface ItemListaCompras {
  id: number;
  produto_id: number;
  quantidade_solicitada: number;
  status_solicitacao: string;
  produto_nome: string;
  unidade_medida: string;
}

interface ItemMatch {
  itemNfce: ItemNfce;
  itemLista: ItemListaCompras;
  similaridade: number;
}

type ApiErr = { error?: string; sugestao?: string };
type ApiNfceOk = { dados: DadosNfce };
type ApiNfceResp = ApiErr & Partial<ApiNfceOk>;

type ApiLancamentosResp = any[] | { lancamentos?: any[] };

type ApiCompraMercadoResp = ApiErr & Partial<CompraRegistrada>;

/** ✅ resolve seu TS: response.json() como unknown */
async function safeJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

// Função para calcular similaridade entre strings
function calcularSimilaridade(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const s2 = str2.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  const palavras1 = s1.split(/\s+/).filter((p) => p.length > 2);
  const palavras2 = s2.split(/\s+/).filter((p) => p.length > 2);

  let matches = 0;
  for (const p1 of palavras1) {
    for (const p2 of palavras2) {
      if (p1.includes(p2) || p2.includes(p1)) {
        matches++;
        break;
      }
    }
  }

  if (matches > 0) return matches / Math.max(palavras1.length, palavras2.length);
  return 0;
}

const CATEGORIAS = ["Mercado", "Insumos", "Embalagens", "Bebidas", "Limpeza", "Outros"];

export default function CompraMercado() {
  const { isSubscriptionExpired } = useAppAuth();

  const [scannerActive, setScannerActive] = useState(false);
  const [urlManual, setUrlManual] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dadosNfce, setDadosNfce] = useState<DadosNfce | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [categoria, setCategoria] = useState("Mercado");
  const [salvando, setSalvando] = useState(false);

  const [compraRegistrada, setCompraRegistrada] = useState<CompraRegistrada | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [historicoCompras, setHistoricoCompras] = useState<any[]>([]);

  const [matchesEncontrados, setMatchesEncontrados] = useState<ItemMatch[]>([]);
  const [matchesSelecionados, setMatchesSelecionados] = useState<Set<number>>(new Set());
  const [showMatchesDialog, setShowMatchesDialog] = useState(false);
  const [dandoBaixa, setDandoBaixa] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scannerContainerVisible, setScannerContainerVisible] = useState(false);
  const [scanMode, setScanMode] = useState<"qrcode" | "barcode">("qrcode");

  const fetchHistorico = useCallback(async () => {
    try {
      const pId = localStorage.getItem("pId") || "";
      if (!pId) return;

      const response = await fetch("/api/lancamentos?categoria=Mercado&limit=5", {
        headers: { "x-pizzaria-id": pId },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await safeJson<ApiLancamentosResp>(response);
        const arr = Array.isArray(data) ? data : data.lancamentos || [];
        setHistoricoCompras(arr);
      }
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    }
  }, []);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const buscarMatchesListaCompras = useCallback(async (itensNfce: ItemNfce[]) => {
    try {
      const pId = localStorage.getItem("pId") || "";
      if (!pId) return;

      const response = await fetch("/api/lista-compras?status=pendente,em_cotacao", {
        headers: { "x-pizzaria-id": pId },
        cache: "no-store",
      });
      if (!response.ok) return;

      const itensLista = await safeJson<ItemListaCompras[]>(response);
      if (!Array.isArray(itensLista) || itensLista.length === 0) return;

      const matches: ItemMatch[] = [];

      for (const itemNfce of itensNfce) {
        for (const itemLista of itensLista) {
          const similaridade = calcularSimilaridade(itemNfce.descricao, itemLista.produto_nome);
          if (similaridade >= 0.3) matches.push({ itemNfce, itemLista, similaridade });
        }
      }

      matches.sort((a, b) => b.similaridade - a.similaridade);

      const uniqueMatches: ItemMatch[] = [];
      const listaIdsUsados = new Set<number>();

      for (const match of matches) {
        if (!listaIdsUsados.has(match.itemLista.id)) {
          uniqueMatches.push(match);
          listaIdsUsados.add(match.itemLista.id);
        }
      }

      setMatchesEncontrados(uniqueMatches);

      if (uniqueMatches.length > 0) {
        const preSelected = new Set<number>();
        for (const match of uniqueMatches) if (match.similaridade >= 0.5) preSelected.add(match.itemLista.id);
        setMatchesSelecionados(preSelected);
      }
    } catch (err) {
      console.error("Erro ao buscar lista de compras:", err);
    }
  }, []);

  const darBaixaItens = async () => {
    if (matchesSelecionados.size === 0) {
      setShowMatchesDialog(false);
      return;
    }

    setDandoBaixa(true);
    setError(null);

    try {
      const pId = localStorage.getItem("pId") || "";
      if (!pId) throw new Error("Selecione a pizzaria (pId) antes de dar baixa.");

      const response = await fetch("/api/lista-compras/dar-baixa", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pizzaria-id": pId },
        body: JSON.stringify({ ids: Array.from(matchesSelecionados) }),
      });

      if (!response.ok) {
        const j = await safeJson<ApiErr>(response).catch(() => ({} as ApiErr));
        throw new Error(j?.error || "Erro ao dar baixa nos itens");
      }

      setShowMatchesDialog(false);
      setMatchesEncontrados([]);
      setMatchesSelecionados(new Set());
      setShowSuccessDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao dar baixa");
    } finally {
      setDandoBaixa(false);
    }
  };

  const toggleMatchSelecionado = (listaId: number) => {
    setMatchesSelecionados((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(listaId)) newSet.delete(listaId);
      else newSet.add(listaId);
      return newSet;
    });
  };

  const startScanner = () => {
    setError(null);
    setScannerContainerVisible(true);
  };

  useEffect(() => {
    if (!scannerContainerVisible || scannerActive) return;

    const initScanner = async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const element = document.getElementById("qr-reader");
      if (!element) {
        setError("Erro ao inicializar scanner. Tente novamente.");
        setScannerContainerVisible(false);
        return;
      }

      try {
        const formatsToSupport =
          scanMode === "barcode"
            ? [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.ITF,
              ]
            : [Html5QrcodeSupportedFormats.QR_CODE];

        const html5QrCode = new Html5Qrcode("qr-reader", {
          formatsToSupport,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        const containerWidth = element.offsetWidth || 300;
        const qrboxWidth = Math.min(containerWidth - 40, scanMode === "barcode" ? 320 : 250);
        const qrboxHeight = scanMode === "barcode" ? 120 : qrboxWidth;

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: qrboxWidth, height: qrboxHeight } },
          (decodedText) => {
            stopScanner();
            if (scanMode === "barcode") {
              setError(null);
              alert(`Código de barras: ${decodedText}\n\nUse este código para buscar o produto no catálogo.`);
            } else {
              processarUrl(decodedText);
            }
          },
          () => {}
        );

        setScannerActive(true);
      } catch (err: any) {
        console.error("Erro ao iniciar câmera:", err);
        setScannerContainerVisible(false);

        const errorName = err?.name || "";
        const errorMessage = err?.message || "";

        if (errorName === "NotAllowedError" || errorMessage.includes("Permission")) {
          setError(
            "Câmera bloqueada pelo navegador. Para liberar:\n\n" +
              "1. Clique no ícone de cadeado (🔒) na barra de endereço\n" +
              "2. Procure por 'Câmera' ou 'Permissões'\n" +
              "3. Selecione 'Permitir'\n" +
              "4. Recarregue a página e tente novamente"
          );
        } else if (errorName === "NotFoundError") {
          setError("Nenhuma câmera encontrada no dispositivo. Use a opção de digitar a URL manualmente.");
        } else if (errorName === "NotReadableError") {
          setError("A câmera está sendo usada por outro aplicativo. Feche outros apps e tente novamente.");
        } else {
          setError("Não foi possível acessar a câmera. Use a opção de digitar a URL manualmente.");
        }
      }
    };

    initScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerContainerVisible, scannerActive, scanMode]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Erro ao parar scanner:", err);
      }
    }
    setScannerActive(false);
    setScannerContainerVisible(false);
  };

  const processarUrl = async (url: string) => {
    if (!url?.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let response = await fetch("/api/nfce/ler-direto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      let data = await safeJson<ApiNfceResp>(response).catch(() => ({} as ApiNfceResp));

      if (!response.ok && data?.sugestao) {
        response = await fetch("/api/nfce/ler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        data = await safeJson<ApiNfceResp>(response).catch(() => ({} as ApiNfceResp));
      }

      if (!response.ok || !data?.dados) {
        const errorMsg = data?.error || "Erro ao ler NFC-e";
        const sugestao = data?.sugestao || "Tire uma foto ou screenshot da nota e use a opção de upload de imagem.";
        throw new Error(`${errorMsg}\n\n💡 ${sugestao}`);
      }

      setDadosNfce(data.dados);
      setShowConfirmDialog(true);
      setUrlManual("");

      if (data.dados?.itens?.length > 0) buscarMatchesListaCompras(data.dados.itens);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar NFC-e");
    } finally {
      setLoading(false);
    }
  };

  const processarImagem = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ia/ler-nota", {
        method: "POST",
        body: formData,
      });

      const data = await safeJson<any>(response).catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao processar imagem");
      }

      const dadosConvertidos: DadosNfce = {
        emitente: {
          razao_social: data?.fornecedor || "Mercado",
          nome_fantasia: data?.fornecedor,
          cnpj: "",
          endereco: "",
        },
        itens: (data?.itens || []).map((item: any) => {
          const qtd = Number(item?.quantidade || 1);
          const vu = Number(item?.valor_unitario || 0);
          return {
            codigo: "",
            descricao: item?.produto || item?.descricao || "",
            quantidade: qtd,
            unidade: item?.unidade || "UN",
            valor_unitario: vu,
            valor_total: qtd * vu,
          };
        }),
        totais: {
          subtotal: Number(data?.valor_total || 0),
          desconto: 0,
          acrescimo: 0,
          total: Number(data?.valor_total || 0),
        },
        pagamento: {
          forma: "Não identificado",
          valor_pago: Number(data?.valor_total || 0),
          troco: 0,
        },
        dados_nfce: {
          numero: "",
          serie: "",
          data_emissao: data?.data || new Date().toISOString().split("T")[0],
          chave_acesso: "",
        },
      };

      setDadosNfce(dadosConvertidos);
      setShowConfirmDialog(true);

      if (dadosConvertidos.itens?.length > 0) buscarMatchesListaCompras(dadosConvertidos.itens);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar imagem");
    } finally {
      setLoading(false);
    }
  };

  const salvarCompra = async () => {
    if (!dadosNfce) return;

    setSalvando(true);
    setError(null);

    try {
      const pId = localStorage.getItem("pId") || "";
      if (!pId) throw new Error("Selecione a pizzaria (pId) antes de salvar.");

      const response = await fetch("/api/compra-mercado", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pizzaria-id": pId },
        body: JSON.stringify({ dados_nfce: dadosNfce, categoria }),
      });

      const data = await safeJson<ApiCompraMercadoResp>(response).catch(() => ({} as ApiCompraMercadoResp));

      if (!response.ok) throw new Error(data?.error || "Erro ao salvar compra");

      // data aqui pode vir como objeto “compra registrada”
      setCompraRegistrada(data as unknown as CompraRegistrada);

      setShowConfirmDialog(false);
      setDadosNfce(null);
      fetchHistorico();

      if (matchesEncontrados.length > 0) setShowMatchesDialog(true);
      else setShowSuccessDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar compra");
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    };
  }, []);

  if (isSubscriptionExpired()) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <p className="text-red-700 dark:text-red-300">Sua assinatura expirou. Renove para continuar usando.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-orange-500" />
            Compra no Mercado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Escaneie o QR Code da NFC-e para registrar automaticamente
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 whitespace-pre-wrap">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 mt-2 p-0 h-auto"
              onClick={() => setError(null)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              {scanMode === "barcode" ? (
                <Barcode className="w-5 h-5 text-orange-500" />
              ) : (
                <QrCode className="w-5 h-5 text-orange-500" />
              )}
              Escanear {scanMode === "barcode" ? "Código de Barras" : "QR Code"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              id="qr-reader"
              className={`w-full rounded-lg overflow-hidden bg-black qr-scanner-container ${
                scannerContainerVisible ? "" : "hidden"
              }`}
              style={{ minHeight: scannerContainerVisible ? "300px" : "0" }}
            />
            <style>{`
              .qr-scanner-container video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
              .qr-scanner-container #qr-shaded-region { border-width: 50px !important; }
              #html5-qrcode-button-camera-permission,
              #html5-qrcode-button-camera-start,
              #html5-qrcode-button-camera-stop,
              #html5-qrcode-anchor-scan-type-change,
              #html5-qrcode-button-file-selection { display: none !important; }
            `}</style>

            {!scannerContainerVisible && !loading && (
              <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 flex flex-col items-center justify-center border-2 border-dashed border-orange-200 dark:border-orange-800">
                {scanMode === "barcode" ? (
                  <Barcode className="w-20 h-20 text-orange-300 dark:text-orange-700 mb-4" />
                ) : (
                  <QrCode className="w-20 h-20 text-orange-300 dark:text-orange-700 mb-4" />
                )}
                <p className="text-gray-600 dark:text-gray-400 text-center px-4">
                  {scanMode === "barcode"
                    ? "Aponte a câmera para o código de barras do produto"
                    : "Aponte a câmera para o QR Code do cupom fiscal"}
                </p>
              </div>
            )}

            {loading && (
              <div className="w-full aspect-square rounded-lg bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Lendo NFC-e...</p>
              </div>
            )}

            {!scannerContainerVisible && (
              <div className="flex gap-2 mb-3">
                <Button
                  variant={scanMode === "qrcode" ? "default" : "outline"}
                  className={`flex-1 ${scanMode === "qrcode" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                  onClick={() => setScanMode("qrcode")}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </Button>
                <Button
                  variant={scanMode === "barcode" ? "default" : "outline"}
                  className={`flex-1 ${scanMode === "barcode" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                  onClick={() => setScanMode("barcode")}
                >
                  <Barcode className="w-4 h-4 mr-2" />
                  Código de Barras
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              {!scannerContainerVisible ? (
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={startScanner} disabled={loading}>
                  <Camera className="w-4 h-4 mr-2" />
                  Abrir Câmera
                </Button>
              ) : (
                <Button className="flex-1" variant="outline" onClick={stopScanner}>
                  <X className="w-4 h-4 mr-2" />
                  Parar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <LinkIcon className="w-5 h-5 text-blue-500" />
              Digitar URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Se preferir, cole a URL do QR Code diretamente.
            </p>

            <div className="space-y-2">
              <Label>URL da NFC-e</Label>
              <Input
                value={urlManual}
                onChange={(e) => setUrlManual(e.target.value)}
                placeholder="https://www.nfce.fazenda..."
                className="dark:bg-gray-900 dark:border-gray-600"
              />
            </div>

            <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={() => processarUrl(urlManual)} disabled={!urlManual || loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  Ler NFC-e
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <ImageIcon className="w-5 h-5 text-purple-500" />
              Upload de Foto / Screenshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Se a SEFAZ bloquear, envie uma foto/screenshot do cupom fiscal e a IA extrai os dados.
            </p>

            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    processarImagem(file);
                    e.target.value = "";
                  }
                }}
                disabled={loading}
              />
              <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg cursor-pointer hover:border-purple-500 transition-colors bg-purple-50 dark:bg-purple-900/20">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                    <span className="text-purple-700 dark:text-purple-300">Processando imagem...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-purple-500" />
                    <span className="text-purple-700 dark:text-purple-300">Clique para enviar foto ou screenshot</span>
                  </>
                )}
              </div>
            </label>
          </CardContent>
        </Card>
      </div>

      {historicoCompras.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Receipt className="w-5 h-5 text-green-500" />
              Últimas Compras
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchHistorico}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historicoCompras.slice(0, 5).map((compra: any) => (
                <div key={compra.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{compra.fornecedor}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(compra.data_pedido).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      R$ {(compra.valor_real || compra.valor_previsto || 0).toFixed(2)}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      Entregue
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Receipt className="w-5 h-5 text-green-500" />
              Confirmar Compra
            </DialogTitle>
          </DialogHeader>

          {dadosNfce && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-900 dark:text-blue-300">
                    {dadosNfce.emitente.nome_fantasia || dadosNfce.emitente.razao_social}
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  CNPJ: {dadosNfce.emitente.cnpj || "—"}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Itens ({dadosNfce.itens.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {dadosNfce.itens.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-900 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-gray-900 dark:text-white">{item.descricao}</p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {item.quantidade} {item.unidade} × R$ {Number(item.valor_unitario || 0).toFixed(2)}
                        </p>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white ml-2">
                        R$ {Number(item.valor_total || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-green-800 dark:text-green-300">
                    <DollarSign className="w-5 h-5" />
                    Total
                  </span>
                  <span className="text-xl font-bold text-green-700 dark:text-green-400">
                    R$ {Number(dadosNfce.totais?.total || 0).toFixed(2)}
                  </span>
                </div>
                {dadosNfce.pagamento?.forma && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Pago em: {dadosNfce.pagamento.forma}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600">
                    <SelectValue />
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

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setDadosNfce(null);
                  }}
                  disabled={salvando}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={salvarCompra} disabled={salvando}>
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm dark:bg-gray-800">
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Compra Registrada!</h3>

            {compraRegistrada && (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>{compraRegistrada.itens_registrados} itens registrados</p>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">
                  R$ {Number(compraRegistrada.valor_total || 0).toFixed(2)}
                </p>
                {compraRegistrada.fornecedor_criado && (
                  <p className="text-blue-600 dark:text-blue-400">✨ Novo fornecedor cadastrado automaticamente</p>
                )}
              </div>
            )}

            <Button
              className="mt-6 bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                setShowSuccessDialog(false);
                setCompraRegistrada(null);
              }}
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showMatchesDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowMatchesDialog(false);
            setShowSuccessDialog(true);
          } else setShowMatchesDialog(true);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              Itens Encontrados na Lista de Compras
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Encontramos {matchesEncontrados.length} itens da nota que podem corresponder a itens na sua Lista de Compras.
              Selecione os que deseja marcar como <strong>comprados</strong>:
            </p>

            <div className="max-h-64 overflow-y-auto space-y-3">
              {matchesEncontrados.map((match, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    matchesSelecionados.has(match.itemLista.id)
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => toggleMatchSelecionado(match.itemLista.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={matchesSelecionados.has(match.itemLista.id)}
                      onCheckedChange={() => toggleMatchSelecionado(match.itemLista.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            match.similaridade >= 0.7
                              ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                              : match.similaridade >= 0.5
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {Math.round(match.similaridade * 100)}% similar
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Nota: {match.itemNfce.descricao}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Lista: {match.itemLista.produto_nome} ({match.itemLista.quantidade_solicitada}{" "}
                        {match.itemLista.unidade_medida || "un"})
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowMatchesDialog(false);
                  setShowSuccessDialog(true);
                }}
                disabled={dandoBaixa}
              >
                Pular
              </Button>

              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={darBaixaItens}
                disabled={dandoBaixa || matchesSelecionados.size === 0}
              >
                {dandoBaixa ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Dar Baixa ({matchesSelecionados.size})
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}