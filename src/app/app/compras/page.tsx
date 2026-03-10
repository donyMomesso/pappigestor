"use client";
export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ListChecks,
  PackageCheck,
  Sparkles,
} from "lucide-react";

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
  observacao?: string | null;
}

interface ItemMatch {
  itemNfce: ItemNfce;
  itemLista: ItemListaCompras;
  similaridade: number;
}

type ApiErr = { error?: string; sugestao?: string };
type ApiNfceOk = { dados: DadosNfce };
type ApiNfceResp = ApiErr & Partial<ApiNfceOk>;
type ApiCompraMercadoResp = ApiErr & Partial<CompraRegistrada>;

type CompraHistorico = {
  id: number | string;
  fornecedor: string;
  data_pedido: string;
  valor_previsto?: number | null;
  valor_real?: number | null;
  categoria?: string;
};

type UseAuthMin = {
  isSubscriptionExpired?: () => boolean;
};

type LancamentosResponse = {
  lancamentos?: CompraHistorico[];
};

type LerNotaIaItem = {
  produto?: string;
  descricao?: string;
  quantidade?: number | string;
  valor_unitario?: number | string;
  unidade?: string;
};

type LerNotaIaResponse = {
  error?: string;
  fornecedor?: string;
  itens?: LerNotaIaItem[];
  valor_total?: number | string;
  data?: string;
};

type Html5QrcodeFormatValue = number;

type Html5QrcodeScannerInstance = {
  start(
    cameraConfig: { facingMode: string },
    config: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decodedText: string) => void,
    onError?: (errorMessage: string) => void,
  ): Promise<void>;
  stop(): Promise<void>;
};

type Html5QrcodeCtor = new (
  elementId: string,
  config: { formatsToSupport: Html5QrcodeFormatValue[]; verbose: boolean },
) => Html5QrcodeScannerInstance;

type Html5QrcodeFormats = {
  QR_CODE: Html5QrcodeFormatValue;
  EAN_13: Html5QrcodeFormatValue;
  EAN_8: Html5QrcodeFormatValue;
  CODE_128: Html5QrcodeFormatValue;
  CODE_39: Html5QrcodeFormatValue;
  UPC_A: Html5QrcodeFormatValue;
  UPC_E: Html5QrcodeFormatValue;
  ITF: Html5QrcodeFormatValue;
};

type Html5QrcodeModule = {
  Html5Qrcode: Html5QrcodeCtor;
  Html5QrcodeSupportedFormats: Html5QrcodeFormats;
};

async function safeJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

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

export default function ComprasPage() {
  const { isSubscriptionExpired } = useAppAuth() as UseAuthMin;

  const [activeTab, setActiveTab] = useState("painel");

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

  const [historicoCompras, setHistoricoCompras] = useState<CompraHistorico[]>([]);
  const [listaCompras, setListaCompras] = useState<ItemListaCompras[]>([]);
  const [loadingLista, setLoadingLista] = useState(false);

  const [matchesEncontrados, setMatchesEncontrados] = useState<ItemMatch[]>([]);
  const [matchesSelecionados, setMatchesSelecionados] = useState<Set<number>>(new Set());
  const [showMatchesDialog, setShowMatchesDialog] = useState(false);
  const [dandoBaixa, setDandoBaixa] = useState(false);

  const scannerRef = useRef<Html5QrcodeScannerInstance | null>(null);
  const html5QrcodeCtorRef = useRef<Html5QrcodeCtor | null>(null);
  const html5QrcodeFormatsRef = useRef<Html5QrcodeFormats | null>(null);

  const [scannerContainerVisible, setScannerContainerVisible] = useState(false);
  const [scanMode, setScanMode] = useState<"qrcode" | "barcode">("qrcode");

  function getEmpresaId() {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem("pId") ||
      localStorage.getItem("empresa_id") ||
      localStorage.getItem("empresaId") ||
      ""
    );
  }

  const ensureScannerLib = useCallback(async () => {
    if (html5QrcodeCtorRef.current && html5QrcodeFormatsRef.current) {
      return {
        Html5Qrcode: html5QrcodeCtorRef.current,
        Html5QrcodeSupportedFormats: html5QrcodeFormatsRef.current,
      };
    }

    const lib = (await import("html5-qrcode")) as unknown as Html5QrcodeModule;
    html5QrcodeCtorRef.current = lib.Html5Qrcode;
    html5QrcodeFormatsRef.current = lib.Html5QrcodeSupportedFormats;

    return {
      Html5Qrcode: lib.Html5Qrcode,
      Html5QrcodeSupportedFormats: lib.Html5QrcodeSupportedFormats,
    };
  }, []);

  const fetchHistorico = useCallback(async () => {
    try {
      const pId = getEmpresaId();
      if (!pId) return;

      const response = await fetch("/api/lancamentos?limit=10", {
        headers: { "x-empresa-id": pId },
        cache: "no-store",
      });

      if (!response.ok) {
        setHistoricoCompras([]);
        return;
      }

      const data = await safeJson<CompraHistorico[] | LancamentosResponse>(response);
      const arr = Array.isArray(data) ? data : data.lancamentos || [];

      const compras = arr.filter((item) => {
        const cat = String(item?.categoria || "").toLowerCase();
        return (
          cat.includes("mercado") ||
          cat.includes("insumo") ||
          cat.includes("embalagem") ||
          cat.includes("bebida") ||
          cat.includes("limpeza") ||
          cat.includes("outro")
        );
      });

      setHistoricoCompras(compras);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
      setHistoricoCompras([]);
    }
  }, []);

  const fetchListaCompras = useCallback(async () => {
    try {
      setLoadingLista(true);

      const pId = getEmpresaId();
      if (!pId) {
        setListaCompras([]);
        return;
      }

      const response = await fetch("/api/lista-compras?status=pendente,em_cotacao", {
        headers: { "x-empresa-id": pId },
        cache: "no-store",
      });

      if (!response.ok) {
        setListaCompras([]);
        return;
      }

      const data = await safeJson<ItemListaCompras[]>(response);
      setListaCompras(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar lista de compras:", err);
      setListaCompras([]);
    } finally {
      setLoadingLista(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistorico();
    void fetchListaCompras();
  }, [fetchHistorico, fetchListaCompras]);

  const buscarMatchesListaCompras = useCallback(async (itensNfce: ItemNfce[]) => {
    try {
      const pId = getEmpresaId();
      if (!pId) return;

      const response = await fetch("/api/lista-compras?status=pendente,em_cotacao", {
        headers: { "x-empresa-id": pId },
        cache: "no-store",
      });
      if (!response.ok) return;

      const itensLista = await safeJson<ItemListaCompras[]>(response);
      if (!Array.isArray(itensLista) || itensLista.length === 0) return;

      const matches: ItemMatch[] = [];

      for (const itemNfce of itensNfce) {
        for (const itemLista of itensLista) {
          const similaridade = calcularSimilaridade(itemNfce.descricao, itemLista.produto_nome);
          if (similaridade >= 0.3) {
            matches.push({ itemNfce, itemLista, similaridade });
          }
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
        for (const match of uniqueMatches) {
          if (match.similaridade >= 0.5) preSelected.add(match.itemLista.id);
        }
        setMatchesSelecionados(preSelected);
      }
    } catch (err) {
      console.error("Erro ao buscar lista de compras:", err);
    }
  }, []);

  const darBaixaItens = async () => {
    if (matchesSelecionados.size === 0) {
      setShowMatchesDialog(false);
      setShowSuccessDialog(true);
      return;
    }

    setDandoBaixa(true);
    setError(null);

    try {
      const pId = getEmpresaId();
      if (!pId) throw new Error("Selecione a empresa (pId) antes de dar baixa.");

      const response = await fetch("/api/lista-compras/dar-baixa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-empresa-id": pId,
        },
        body: JSON.stringify({ ids: Array.from(matchesSelecionados) }),
      });

      if (!response.ok) {
        const j = await safeJson<ApiErr>(response).catch(() => ({} as ApiErr));
        throw new Error(j.error || "Erro ao dar baixa nos itens");
      }

      setShowMatchesDialog(false);
      setMatchesEncontrados([]);
      setMatchesSelecionados(new Set());

      await fetchListaCompras();
      setShowSuccessDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao dar baixa");
    } finally {
      setDandoBaixa(false);
    }
  };

  const darBaixaManualLista = async (id: number) => {
    setError(null);

    try {
      const pId = getEmpresaId();
      if (!pId) throw new Error("Empresa não encontrada.");

      const response = await fetch("/api/lista-compras/dar-baixa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-empresa-id": pId,
        },
        body: JSON.stringify({ ids: [id] }),
      });

      if (!response.ok) {
        const j = await safeJson<ApiErr>(response).catch(() => ({} as ApiErr));
        throw new Error(j.error || "Erro ao dar baixa no item");
      }

      await fetchListaCompras();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao dar baixa no item");
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

  const stopScanner = useCallback(async () => {
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
  }, []);

  const processarUrl = useCallback(
    async (url: string) => {
      if (!url.trim()) return;

      setLoading(true);
      setError(null);

      try {
        let response = await fetch("/api/nfce/ler-direto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        let data = await safeJson<ApiNfceResp>(response).catch(() => ({} as ApiNfceResp));

        if (!response.ok && data.sugestao) {
          response = await fetch("/api/nfce/ler", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          data = await safeJson<ApiNfceResp>(response).catch(() => ({} as ApiNfceResp));
        }

        if (!response.ok || !data.dados) {
          const errorMsg = data.error || "Erro ao ler NFC-e";
          const sugestao =
            data.sugestao ||
            "Tire uma foto ou screenshot da nota e use a opção de upload de imagem.";
          throw new Error(`${errorMsg}\n\n💡 ${sugestao}`);
        }

        setDadosNfce(data.dados);
        setShowConfirmDialog(true);
        setUrlManual("");
        setActiveTab("mercado");

        if (data.dados.itens.length > 0) {
          void buscarMatchesListaCompras(data.dados.itens);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao processar NFC-e");
      } finally {
        setLoading(false);
      }
    },
    [buscarMatchesListaCompras],
  );

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
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await ensureScannerLib();

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
          (decodedText: string) => {
            void stopScanner();
            if (scanMode === "barcode") {
              setError(null);
              alert(
                `Código de barras: ${decodedText}\n\nUse este código para buscar o produto no catálogo.`,
              );
            } else {
              void processarUrl(decodedText);
            }
          },
          () => {},
        );

        setScannerActive(true);
      } catch (err: unknown) {
        console.error("Erro ao iniciar câmera:", err);
        setScannerContainerVisible(false);

        const errorName = err instanceof Error ? err.name : "";
        const errorMessage = err instanceof Error ? err.message : "";

        if (errorName === "NotAllowedError" || errorMessage.includes("Permission")) {
          setError(
            "Câmera bloqueada pelo navegador. Para liberar:\n\n" +
              "1. Clique no ícone de cadeado (🔒) na barra de endereço\n" +
              "2. Procure por 'Câmera' ou 'Permissões'\n" +
              "3. Selecione 'Permitir'\n" +
              "4. Recarregue a página e tente novamente",
          );
        } else if (errorName === "NotFoundError") {
          setError(
            "Nenhuma câmera encontrada no dispositivo. Use a opção de digitar a URL manualmente.",
          );
        } else if (errorName === "NotReadableError") {
          setError(
            "A câmera está sendo usada por outro aplicativo. Feche outros apps e tente novamente.",
          );
        } else {
          setError(
            "Não foi possível acessar a câmera. Use a opção de digitar a URL manualmente.",
          );
        }
      }
    };

    void initScanner();
  }, [ensureScannerLib, processarUrl, scanMode, scannerActive, scannerContainerVisible, stopScanner]);

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

      const data = await safeJson<LerNotaIaResponse>(response).catch(
        () => ({}) as LerNotaIaResponse,
      );

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar imagem");
      }

      const itensConvertidos: ItemNfce[] = (data.itens || []).map((item) => {
        const qtd = Number(item.quantidade || 1);
        const vu = Number(item.valor_unitario || 0);

        return {
          codigo: "",
          descricao: item.produto || item.descricao || "",
          quantidade: qtd,
          unidade: item.unidade || "UN",
          valor_unitario: vu,
          valor_total: qtd * vu,
        };
      });

      const dadosConvertidos: DadosNfce = {
        emitente: {
          razao_social: data.fornecedor || "Mercado",
          nome_fantasia: data.fornecedor,
          cnpj: "",
          endereco: "",
        },
        itens: itensConvertidos,
        totais: {
          subtotal: Number(data.valor_total || 0),
          desconto: 0,
          acrescimo: 0,
          total: Number(data.valor_total || 0),
        },
        pagamento: {
          forma: "Não identificado",
          valor_pago: Number(data.valor_total || 0),
          troco: 0,
        },
        dados_nfce: {
          numero: "",
          serie: "",
          data_emissao: data.data || new Date().toISOString().split("T")[0],
          chave_acesso: "",
        },
      };

      setDadosNfce(dadosConvertidos);
      setShowConfirmDialog(true);
      setActiveTab("mercado");

      if (dadosConvertidos.itens.length > 0) {
        void buscarMatchesListaCompras(dadosConvertidos.itens);
      }
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
      const pId = getEmpresaId();
      if (!pId) throw new Error("Selecione a empresa (pId) antes de salvar.");

      const response = await fetch("/api/compra-mercado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-empresa-id": pId,
        },
        body: JSON.stringify({ dados_nfce: dadosNfce, categoria }),
      });

      const data = await safeJson<ApiCompraMercadoResp>(response).catch(
        () => ({} as ApiCompraMercadoResp),
      );

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar compra");
      }

      setCompraRegistrada(data as CompraRegistrada);
      setShowConfirmDialog(false);
      setDadosNfce(null);

      await fetchHistorico();
      await fetchListaCompras();

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
      void stopScanner();
    };
  }, [stopScanner]);

  const totalItensLista = useMemo(() => listaCompras.length, [listaCompras]);

  const totalQtdLista = useMemo(() => {
    return listaCompras.reduce((acc, item) => acc + Number(item.quantidade_solicitada || 0), 0);
  }, [listaCompras]);

  const totalHistorico = useMemo(() => historicoCompras.length, [historicoCompras]);

  if (typeof isSubscriptionExpired === "function" && isSubscriptionExpired()) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-300">
            Sua assinatura expirou. Renove para continuar usando.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <ShoppingCart className="h-7 w-7 text-orange-500" />
            Compras
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Centralize lista, compra de mercado e baixa de itens em um só lugar
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-auto p-0 text-red-600 hover:text-red-700"
              onClick={() => setError(null)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="painel" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Painel
          </TabsTrigger>
          <TabsTrigger value="mercado" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Compra Mercado
          </TabsTrigger>
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Lista Compras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="painel" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100">
                  <ClipboardList className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Itens na Lista</p>
                  <p className="text-2xl font-bold text-gray-900">{totalItensLista}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quantidade Solicitada</p>
                  <p className="text-2xl font-bold text-gray-900">{totalQtdLista}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100">
                  <PackageCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Últimas Compras</p>
                  <p className="text-2xl font-bold text-gray-900">{totalHistorico}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Receipt className="h-5 w-5 text-green-500" />
                Últimas Compras
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => void fetchHistorico()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {historicoCompras.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Nenhuma compra encontrada ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {historicoCompras.slice(0, 6).map((compra) => (
                    <div
                      key={compra.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900"
                    >
                      <div className="flex items-center gap-3">
                        <Store className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {compra.fornecedor}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(compra.data_pedido).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          R$ {Number(compra.valor_real || compra.valor_previsto || 0).toFixed(2)}
                        </p>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Registrada
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <ListChecks className="h-5 w-5 text-blue-500" />
                Lista de Compras Pendente
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => void fetchListaCompras()}>
                <RefreshCw className={`h-4 w-4 ${loadingLista ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingLista ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : listaCompras.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Nenhum item pendente na lista.
                </div>
              ) : (
                <div className="space-y-3">
                  {listaCompras.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.produto_nome}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantidade_solicitada} {item.unidade_medida || "un"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.status_solicitacao}</Badge>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => void darBaixaManualLista(item.id)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Dar baixa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mercado" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  {scanMode === "barcode" ? (
                    <Barcode className="h-5 w-5 text-orange-500" />
                  ) : (
                    <QrCode className="h-5 w-5 text-orange-500" />
                  )}
                  Escanear {scanMode === "barcode" ? "Código de Barras" : "QR Code"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  id="qr-reader"
                  className={`qr-scanner-container w-full overflow-hidden rounded-lg bg-black ${
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
                  <div className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:border-orange-800 dark:from-orange-900/20 dark:to-amber-900/20">
                    {scanMode === "barcode" ? (
                      <Barcode className="mb-4 h-20 w-20 text-orange-300 dark:text-orange-700" />
                    ) : (
                      <QrCode className="mb-4 h-20 w-20 text-orange-300 dark:text-orange-700" />
                    )}
                    <p className="px-4 text-center text-gray-600 dark:text-gray-400">
                      {scanMode === "barcode"
                        ? "Aponte a câmera para o código de barras do produto"
                        : "Aponte a câmera para o QR Code do cupom fiscal"}
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="flex aspect-square w-full flex-col items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900">
                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-orange-500" />
                    <p className="text-gray-600 dark:text-gray-400">Lendo NFC-e...</p>
                  </div>
                )}

                {!scannerContainerVisible && (
                  <div className="mb-3 flex gap-2">
                    <Button
                      variant={scanMode === "qrcode" ? "default" : "outline"}
                      className={`flex-1 ${
                        scanMode === "qrcode" ? "bg-orange-500 hover:bg-orange-600" : ""
                      }`}
                      onClick={() => setScanMode("qrcode")}
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      QR Code
                    </Button>
                    <Button
                      variant={scanMode === "barcode" ? "default" : "outline"}
                      className={`flex-1 ${
                        scanMode === "barcode" ? "bg-orange-500 hover:bg-orange-600" : ""
                      }`}
                      onClick={() => setScanMode("barcode")}
                    >
                      <Barcode className="mr-2 h-4 w-4" />
                      Código
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  {!scannerContainerVisible ? (
                    <Button
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      onClick={startScanner}
                      disabled={loading}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Abrir Câmera
                    </Button>
                  ) : (
                    <Button className="flex-1" variant="outline" onClick={() => void stopScanner()}>
                      <X className="mr-2 h-4 w-4" />
                      Parar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <LinkIcon className="h-5 w-5 text-blue-500" />
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
                    className="dark:border-gray-600 dark:bg-gray-900"
                  />
                </div>

                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  onClick={() => void processarUrl(urlManual)}
                  disabled={!urlManual || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-4 w-4" />
                      Ler NFC-e
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <ImageIcon className="h-5 w-5 text-purple-500" />
                  Upload de Foto / Screenshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Se a SEFAZ bloquear, envie uma foto/screenshot do cupom fiscal e a IA extrai os
                  dados.
                </p>

                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void processarImagem(file);
                        e.target.value = "";
                      }
                    }}
                    disabled={loading}
                  />
                  <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 p-4 transition-colors hover:border-purple-500 dark:border-purple-700 dark:bg-purple-900/20">
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                        <span className="text-purple-700 dark:text-purple-300">
                          Processando imagem...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-purple-500" />
                        <span className="text-purple-700 dark:text-purple-300">
                          Clique para enviar foto ou screenshot
                        </span>
                      </>
                    )}
                  </div>
                </label>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lista" className="mt-6 space-y-6">
          <Card className="dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <ListChecks className="h-5 w-5 text-blue-500" />
                Lista de Compras
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => void fetchListaCompras()}>
                <RefreshCw className={`h-4 w-4 ${loadingLista ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingLista ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : listaCompras.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Nenhum item pendente na lista.
                </div>
              ) : (
                <div className="space-y-3">
                  {listaCompras.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-3 rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900 md:flex-row md:items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.produto_nome}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantidade_solicitada} {item.unidade_medida || "un"}
                        </p>
                        {item.observacao ? (
                          <p className="mt-1 text-xs text-gray-400">{item.observacao}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.status_solicitacao}</Badge>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => void darBaixaManualLista(item.id)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Dar baixa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Receipt className="h-5 w-5 text-green-500" />
              Confirmar Compra
            </DialogTitle>
          </DialogHeader>

          {dadosNfce && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <div className="mb-2 flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-900 dark:text-blue-300">
                    {dadosNfce.emitente.nome_fantasia || dadosNfce.emitente.razao_social}
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  CNPJ: {dadosNfce.emitente.cnpj || "—"}
                </p>
              </div>

              <div>
                <h4 className="mb-2 flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                  <Package className="h-4 w-4" />
                  Itens ({dadosNfce.itens.length})
                </h4>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {dadosNfce.itens.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between rounded bg-gray-50 p-2 text-sm dark:bg-gray-900"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-gray-900 dark:text-white">{item.descricao}</p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {item.quantidade} {item.unidade} × R${" "}
                          {Number(item.valor_unitario || 0).toFixed(2)}
                        </p>
                      </div>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        R$ {Number(item.valor_total || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-green-800 dark:text-green-300">
                    <DollarSign className="h-5 w-5" />
                    Total
                  </span>
                  <span className="text-xl font-bold text-green-700 dark:text-green-400">
                    R$ {Number(dadosNfce.totais.total || 0).toFixed(2)}
                  </span>
                </div>
                {dadosNfce.pagamento.forma && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    Pago em: {dadosNfce.pagamento.forma}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="dark:border-gray-600 dark:bg-gray-900">
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
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={() => void salvarCompra()}
                  disabled={salvando}
                >
                  {salvando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
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
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Compra Registrada!
            </h3>

            {compraRegistrada && (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>{compraRegistrada.itens_registrados} itens registrados</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  R$ {Number(compraRegistrada.valor_total || 0).toFixed(2)}
                </p>
                {compraRegistrada.fornecedor_criado && (
                  <p className="text-blue-600 dark:text-blue-400">
                    ✨ Novo fornecedor cadastrado automaticamente
                  </p>
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
          } else {
            setShowMatchesDialog(true);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              Itens Encontrados na Lista de Compras
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Encontramos {matchesEncontrados.length} itens da nota que podem corresponder a itens
              na sua Lista de Compras. Selecione os que deseja marcar como <strong>comprados</strong>.
            </p>

            <div className="max-h-64 space-y-3 overflow-y-auto">
              {matchesEncontrados.map((match, idx) => (
                <div
                  key={idx}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    matchesSelecionados.has(match.itemLista.id)
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                  onClick={() => toggleMatchSelecionado(match.itemLista.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={matchesSelecionados.has(match.itemLista.id)}
                      onCheckedChange={() => toggleMatchSelecionado(match.itemLista.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
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
                        Lista: {match.itemLista.produto_nome} (
                        {match.itemLista.quantidade_solicitada} {match.itemLista.unidade_medida || "un"})
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
                onClick={() => void darBaixaItens()}
                disabled={dandoBaixa || matchesSelecionados.size === 0}
              >
                {dandoBaixa ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
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