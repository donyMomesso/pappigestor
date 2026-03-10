"use client";

export const dynamic = "force-dynamic";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type ChangeEvent,
} from "react";
import {
  Trash2,
  Loader2,
  ArrowRight,
  Receipt,
  Package,
  AlertCircle,
  Upload,
  MessageSquare,
  FileText,
  Info,
  Camera,
  QrCode,
  Link as LinkIcon,
  Check,
  X,
  Sparkles,
  DollarSign,
  Brain,
  Clock3,
  Inbox,
  CheckCircle2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { processarNotaXML } from "@/app/actions/processar-nota";

type ProdutoExtraido = {
  produto?: string;
  nome?: string;
  qtd?: number | string;
  quantidade?: number | string;
  preco_un?: number | string;
  preco?: number | string;
  valor_unitario?: number | string;
};

type InboxItem = {
  id: number | string;
  fornecedor_nome?: string;
  valor_total?: number;
  json_extraido?: ProdutoExtraido[] | string;
  criado_em: string;
  isTemp?: boolean;
};

type LerIAResponse = {
  error?: string;
  dados?: any;
  data?: any;
};

type ArquivoProcessado = {
  id: string;
  file: File;
  preview: string;
  status: "pendente" | "processando" | "processado" | "erro";
  dados?: any;
  erro?: string;
};

type ProcessarNotaXMLResult =
  | {
      success: true;
      message: string;
      data?: any;
    }
  | {
      success: false;
      error: unknown;
      message?: string;
    };

const StatusBadge = ({ children }: { children: ReactNode }) => (
  <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[9px] font-black uppercase italic text-orange-600">
    {children}
  </span>
);

function HeroMini({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <p className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-orange-200 italic">
        {label}
      </p>
      <p className="text-2xl font-black uppercase tracking-tighter text-white italic">
        {value}
      </p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300 italic">
        {helper}
      </p>
    </div>
  );
}

function MiniAction({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <div className="mb-2 flex items-center gap-2 text-orange-300">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.18em] italic">
          entrada
        </span>
      </div>
      <p className="text-sm font-black uppercase tracking-tight text-white italic">
        {label}
      </p>
    </div>
  );
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizarLinkNfe(valor: string): string {
  let url = valor.trim();
  url = url.replace(/\s+/g, "");

  const match = url.match(/https?:\/\/[^\s]+/i);
  if (match?.[0]) {
    url = match[0];
  }

  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  return url;
}

function extrairPayloadIA(payload: LerIAResponse | any) {
  return payload?.dados || payload?.data || payload || {};
}

function parseItensExtraidos(raw: unknown): ProdutoExtraido[] {
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    const parsed = safeJsonParse<unknown>(raw, []);
    return Array.isArray(parsed) ? (parsed as ProdutoExtraido[]) : [];
  }

  return [];
}

function formatMoney(value?: number) {
  return `R$ ${Number(value || 0).toFixed(2)}`;
}

export default function CaixaEntradaPage() {
  const { localUser } = useAppAuth();

  const [items, setItems] = useState<InboxItem[]>([]);
  const [arquivos, setArquivos] = useState<ArquivoProcessado[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extraindo, setExtraindo] = useState(false);

  const [processingId, setProcessingId] = useState<number | string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkNfe, setLinkNfe] = useState("");
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const qrLoopRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const getHeaders = useCallback(
    (isFormData = false) => {
      const empresaId =
        localStorage.getItem("pId") ||
        localStorage.getItem("empresaId") ||
        String((localUser as any)?.empresa_id || "");

      const email = localUser?.email || localStorage.getItem("userEmail") || "";

      const headers: Record<string, string> = {
        "x-empresa-id": empresaId,
        "x-user-email": email,
      };

      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }

      return headers;
    },
    [localUser]
  );

  const montarItemTemporario = useCallback((payload: any): InboxItem => {
    const responseIA = extrairPayloadIA(payload);
    const itensExtraidos = Array.isArray(responseIA?.itens) ? responseIA.itens : [];
    const valorTotal = Number(responseIA?.valor_total ?? responseIA?.total ?? 0) || 0;

    return {
      id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fornecedor_nome:
        responseIA?.fornecedor ||
        responseIA?.emitente ||
        responseIA?.razao_social ||
        "Documento lido pela IA",
      valor_total: valorTotal,
      json_extraido: itensExtraidos,
      criado_em: new Date().toISOString(),
      isTemp: true,
    };
  }, []);

  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/ia/inbox", {
        headers: getHeaders(),
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Falha ao carregar inbox.");
      }

      const data = (await res.json()) as InboxItem[] | { results?: InboxItem[] };
      const extractedData = Array.isArray(data) ? data : data?.results || [];
      setItems(extractedData);
    } catch (e) {
      console.error("Erro ao carregar Inbox", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    void fetchInbox();
  }, [fetchInbox]);

  const uploadArquivo = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "nota_fiscal");

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: getHeaders(true),
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || "Falha ao enviar arquivo.");
      }

      return payload.url as string;
    },
    [getHeaders]
  );

  const processarLeituraPorArquivo = useCallback(
    async (file: File) => {
      const fileUrl = await uploadArquivo(file);

      const response = await fetch("/api/ia/ler-nota", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ image_url: fileUrl }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Erro ao ler documento.");
      }

      const itemTemporario = montarItemTemporario(payload);
      setItems((prev) => [itemTemporario, ...prev]);

      return payload;
    },
    [getHeaders, montarItemTemporario, uploadArquivo]
  );

  const handleEntradaRapida = useCallback(
    async (file: File) => {
      setUploading(true);
      setLinkError(null);

      try {
        await processarLeituraPorArquivo(file);
      } catch (error: any) {
        console.error(error);
        alert(error?.message || "Falha ao enviar documento para a IA.");
      } finally {
        setUploading(false);

        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
      }
    },
    [processarLeituraPorArquivo]
  );

  const handleFileUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await handleEntradaRapida(file);
    },
    [handleEntradaRapida]
  );

  const handleFilaArquivos = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const novos: ArquivoProcessado[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      status: "pendente",
    }));

    setArquivos((prev) => [...prev, ...novos]);
    e.target.value = "";
  }, []);

  const executarProcessamento = useCallback(
    async (arquivo: ArquivoProcessado) => {
      setArquivos((prev) =>
        prev.map((a) =>
          a.id === arquivo.id ? { ...a, status: "processando", erro: undefined } : a
        )
      );

      try {
        const isXml =
          arquivo.file.type.includes("xml") ||
          arquivo.file.name.toLowerCase().endsWith(".xml");

        if (isXml) {
          const formData = new FormData();
          formData.append("file", arquivo.file);
          formData.append("empresa_id", String((localUser as any)?.empresa_id || ""));

          const result = (await processarNotaXML(formData)) as ProcessarNotaXMLResult;

          if (!result.success) {
            throw new Error(String(result.error || "Falha ao processar XML."));
          }

          const resultData = "data" in result ? result.data : undefined;

          if (resultData) {
            const itemTemporario = montarItemTemporario(resultData);
            setItems((prev) => [itemTemporario, ...prev]);
          }

          setArquivos((prev) =>
            prev.map((a) =>
              a.id === arquivo.id
                ? { ...a, status: "processado", dados: resultData }
                : a
            )
          );

          return;
        }

        const payload = await processarLeituraPorArquivo(arquivo.file);

        setArquivos((prev) =>
          prev.map((a) =>
            a.id === arquivo.id
              ? { ...a, status: "processado", dados: payload }
              : a
          )
        );
      } catch (err: any) {
        setArquivos((prev) =>
          prev.map((a) =>
            a.id === arquivo.id
              ? { ...a, status: "erro", erro: err?.message || "Erro no processamento" }
              : a
          )
        );
      }
    },
    [localUser, montarItemTemporario, processarLeituraPorArquivo]
  );

  const extrairDadosPorLink = useCallback(async () => {
    const linkNormalizado = normalizarLinkNfe(linkNfe);

    if (!linkNormalizado) {
      setLinkError("Cole um link válido da NFC-e.");
      return;
    }

    setExtraindo(true);
    setLinkError(null);

    try {
      const response = await fetch("/api/ia/ler-link", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ url: linkNormalizado }),
      });

      const dados = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(dados?.error || dados?.details || "Falha ao ler link da NFC-e.");
      }

      const mockItem = montarItemTemporario(dados);
      setItems((prev) => [mockItem, ...prev]);
      setLinkNfe("");
      setShowLinkInput(false);
    } catch (err: any) {
      setLinkError(err?.message || "Não foi possível ler a nota a partir deste link.");
    } finally {
      setExtraindo(false);
    }
  }, [getHeaders, linkNfe, montarItemTemporario]);

  const stopQr = useCallback(() => {
    if (qrLoopRef.current) {
      cancelAnimationFrame(qrLoopRef.current);
      qrLoopRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startQr = useCallback(async () => {
    setQrError(null);

    try {
      if (!("mediaDevices" in navigator)) {
        throw new Error("Sem suporte a câmera.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("Vídeo não inicializado.");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const hasDetector = "BarcodeDetector" in window;
      if (!hasDetector) {
        setQrError("Leitor QR não disponível. Use o botão de Colar Link Sefaz.");
        return;
      }

      const DetectorCtor = (window as any).BarcodeDetector;
      const detector = new DetectorCtor({ formats: ["qr_code"] });

      const scan = async () => {
        if (!videoRef.current) return;

        try {
          const barcodes = await detector.detect(videoRef.current);

          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0]?.rawValue || "";

            if (raw) {
              stopQr();
              setShowQrDialog(false);
              setShowLinkInput(true);
              setLinkNfe(normalizarLinkNfe(raw));
              return;
            }
          }
        } catch {
          //
        }

        qrLoopRef.current = requestAnimationFrame(scan);
      };

      qrLoopRef.current = requestAnimationFrame(scan);
    } catch (err: any) {
      setQrError(err?.message || "Erro ao abrir a câmera.");
    }
  }, [stopQr]);

  useEffect(() => {
    if (!showQrDialog) {
      stopQr();
    }
  }, [showQrDialog, stopQr]);

  useEffect(() => {
    return () => {
      stopQr();
      arquivos.forEach((arquivo) => {
        if (arquivo.preview) URL.revokeObjectURL(arquivo.preview);
      });
    };
  }, [arquivos, stopQr]);

  const handleApprove = async (item: InboxItem) => {
    setProcessingId(item.id);

    try {
      const jsonExtraido =
        typeof item.json_extraido === "string"
          ? item.json_extraido
          : JSON.stringify(item.json_extraido || []);

      const res = await fetch("/api/ia/inbox/approve", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          id: item.id,
          json_extraido: jsonExtraido,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(payload?.error || "Falha ao aprovar");
      }

      alert("Nota lançada no estoque com sucesso! Custos atualizados.");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Ocorreu um erro ao processar a nota para o estoque.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Tem certeza que deseja descartar esta nota?")) return;

    setDeletingId(id);

    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const totalPendente = items.reduce((acc, item) => acc + Number(item.valor_total || 0), 0);
  const filaPendente = arquivos.filter((a) => a.status === "pendente").length;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-orange-100 bg-orange-50">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-600 italic">
            carregando caixa de entrada
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <section className="relative overflow-hidden rounded-[38px] bg-gradient-to-br from-gray-950 via-zinc-900 to-orange-950 p-8 text-white shadow-2xl md:p-10">
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300 italic">
                  leitura inteligente ativa
                </span>
              </div>

              <h1 className="flex items-center gap-3 text-3xl font-black uppercase leading-none tracking-tighter italic md:text-5xl">
                <Inbox className="h-8 w-8 text-orange-400 md:h-10 md:w-10" />
                Caixa de Entrada da IA
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
                Importe notas por foto, PDF, XML, QR Code ou link da Sefaz. O sistema
                organiza tudo para você validar e lançar no estoque com mais rapidez.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Clock3 className="h-4 w-4 text-orange-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-200 italic">
                  prioridade do dia: validar entradas com clareza
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <HeroMini label="Pendentes" value={String(items.length)} helper="notas aguardando" />
              <HeroMini
                label="Valor total"
                value={formatMoney(totalPendente)}
                helper="em conferência"
              />
              <HeroMini label="Fila local" value={String(filaPendente)} helper="arquivos prontos" />
              <HeroMini label="IA" value="ativa" helper="processando documentos" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/15">
                  <Brain size={24} className="text-orange-300" />
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300 italic">
                    o que a IA faz aqui
                  </p>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white italic">
                    transforma documento em lançamento validável
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
                    A IA lê os dados, organiza os itens detectados e deixa tudo pronto
                    para sua conferência antes de enviar ao estoque.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-300 italic">
                formas de entrada
              </p>

              <div className="grid grid-cols-2 gap-3">
                <MiniAction icon={<Camera size={16} />} label="Foto" />
                <MiniAction icon={<Upload size={16} />} label="PDF / Galeria" />
                <MiniAction icon={<FileText size={16} />} label="XML" />
                <MiniAction icon={<QrCode size={16} />} label="QR / Link Sefaz" />
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-10 -right-10 text-[220px] font-black leading-none text-white/5 italic">
          P
        </div>
      </section>

      <div className="rounded-[40px] border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-gray-900 italic">
              <Sparkles size={20} className="text-orange-500" />
              Leitura inteligente
            </h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Escolha a forma de importar sua nota fiscal
            </p>
          </div>

          {(uploading || extraindo) && (
            <span className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500 italic">
              <Loader2 size={12} className="animate-spin" />
              extraindo dados...
            </span>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => void handleFileUpload(e)}
          accept="image/*,application/pdf"
          className="hidden"
        />

        <input
          type="file"
          ref={cameraInputRef}
          onChange={(e) => void handleFileUpload(e)}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading || extraindo}
            className="flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-orange-200 bg-orange-50/50 py-6 transition-colors hover:bg-orange-50 disabled:opacity-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
              <Camera size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-orange-900 italic">
              Tirar foto
            </span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || extraindo}
            className="flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-gray-200 bg-gray-50/50 py-6 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm">
              <Upload size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-gray-600 italic">
              Galeria / PDF
            </span>
          </button>

          <button
            onClick={() => setShowQrDialog(true)}
            disabled={uploading || extraindo}
            className="col-span-2 flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-blue-200 bg-blue-50/50 py-6 text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 md:col-span-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm">
              <QrCode size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider italic">
              Ler QR Code
            </span>
          </button>

          {!showLinkInput ? (
            <button
              onClick={() => {
                setShowLinkInput(true);
                setLinkError(null);
              }}
              disabled={uploading || extraindo}
              className="col-span-2 flex flex-col items-center justify-center gap-3 rounded-[24px] border border-gray-200 bg-gray-50/50 py-6 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 md:col-span-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm">
                <LinkIcon size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider italic">
                Colar link Sefaz
              </span>
            </button>
          ) : (
            <div className="col-span-2 flex animate-in flex-col gap-2 rounded-[24px] border border-gray-200 bg-gray-50 p-2 fade-in slide-in-from-top-2 md:col-span-1">
              <div className="relative w-full flex-1">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Cole o link..."
                  value={linkNfe}
                  onChange={(e) => setLinkNfe(e.target.value)}
                  className="h-10 w-full rounded-xl border-blue-200 bg-white pl-9 text-xs font-medium"
                />
              </div>

              <div className="flex w-full gap-2">
                <Button
                  type="button"
                  onClick={() => void extrairDadosPorLink()}
                  disabled={!normalizarLinkNfe(linkNfe) || extraindo}
                  className="h-10 flex-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  {extraindo ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkNfe("");
                    setLinkError(null);
                  }}
                  className="h-10 flex-1 rounded-xl border-gray-200 text-gray-500"
                >
                  <X size={14} />
                </Button>
              </div>

              {linkError && (
                <div className="rounded-xl bg-red-50 p-2 text-[10px] font-bold text-red-500">
                  {linkError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Card className="overflow-hidden rounded-[36px] border-4 border-dashed border-gray-100 bg-white shadow-sm transition-all hover:border-orange-500/20">
        <CardContent className="p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black uppercase text-gray-900 italic">
                Fila local de arquivos
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500 italic">
                Adicione XML, imagens e PDFs para processar individualmente.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-white italic transition hover:bg-orange-600">
              <Upload size={14} className="mr-2" />
              Adicionar arquivos
              <input
                type="file"
                className="hidden"
                multiple
                accept=".xml,image/*,application/pdf"
                onChange={handleFilaArquivos}
              />
            </label>
          </div>

          {arquivos.length === 0 ? (
            <div className="rounded-[28px] bg-gray-50 px-6 py-10 text-center">
              <Upload className="mx-auto mb-4 text-gray-300" size={38} />
              <p className="text-sm font-black uppercase text-gray-500 italic">
                Nenhum arquivo na fila
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Adicione XML, imagem ou PDF para processar.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {arquivos.map((arq) => (
                <div
                  key={arq.id}
                  className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 text-[10px] font-black italic text-gray-400">
                    {arq.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={arq.preview}
                        alt={arq.file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "DOC"
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-black uppercase text-gray-800 italic">
                      {arq.file.name}
                    </h4>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black uppercase text-gray-500">
                        {arq.status}
                      </span>

                      {arq.status === "processado" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[10px] font-black uppercase text-green-600">
                          <CheckCircle2 size={12} />
                          concluído
                        </span>
                      )}

                      {arq.erro && (
                        <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black uppercase text-red-500">
                          {arq.erro}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {arq.status === "pendente" && (
                      <Button
                        onClick={() => void executarProcessamento(arq)}
                        className="rounded-xl bg-orange-500 px-4 text-[10px] font-black uppercase text-white italic hover:bg-orange-600"
                      >
                        <Sparkles size={14} className="mr-1" />
                        Processar
                      </Button>
                    )}

                    {arq.status === "processando" && (
                      <div className="flex h-10 w-10 items-center justify-center">
                        <Loader2 className="animate-spin text-orange-500" />
                      </div>
                    )}

                    <button
                      onClick={() =>
                        setArquivos((prev) => prev.filter((a) => a.id !== arq.id))
                      }
                      className="p-2 text-gray-300 transition-colors hover:text-rose-500"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <div className="space-y-4 rounded-[40px] border border-gray-100 bg-white p-16 text-center shadow-sm">
          <Receipt className="mx-auto text-gray-200" size={60} />
          <p className="text-sm font-bold uppercase text-gray-400 italic">
            Nenhuma nota aguardando aprovação.
          </p>
          <p className="mx-auto max-w-md text-sm text-gray-500">
            Quando você importar uma nota, ela aparecerá aqui pronta para conferência.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const produtosLista = parseItensExtraidos(item.json_extraido);
            const produtosDetectados = produtosLista.length;

            return (
              <div
                key={item.id}
                className="group flex flex-col items-start justify-between gap-6 rounded-[35px] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:bg-gray-50/50 xl:flex-row xl:items-center"
              >
                <div className="flex items-center gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition-transform group-hover:scale-110">
                    <FileText size={24} />
                  </div>

                  <div>
                    <h3 className="font-black uppercase tracking-tight text-gray-900 italic">
                      {item.fornecedor_nome || "Fornecedor não identificado"}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      <span className="text-[10px] font-bold uppercase text-gray-400 italic">
                        {new Date(item.criado_em).toLocaleDateString("pt-BR")}
                      </span>

                      <StatusBadge>
                        {item.isTemp ? "prévia por link/arquivo" : "processado pela ia"}
                      </StatusBadge>

                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                        {produtosDetectados} produtos
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-wrap items-center gap-4 md:gap-8 xl:w-auto">
                  <div className="flex-1 text-left xl:flex-none xl:text-right">
                    <p className="text-[10px] font-bold uppercase text-gray-400 italic">
                      Total lançado
                    </p>
                    <p className="text-xl font-black text-gray-900 italic">
                      {formatMoney(item.valor_total)}
                    </p>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="h-14 w-full rounded-2xl bg-gray-900 px-8 text-[10px] font-black uppercase tracking-widest text-white italic transition-all hover:bg-orange-600 xl:w-auto">
                        Conferir nota
                        <ArrowRight size={16} className="ml-2 hidden sm:block" />
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-3xl overflow-hidden rounded-[45px] border-none p-8 shadow-2xl">
                      <DialogHeader className="mb-6">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                          Validar <span className="text-orange-500">lançamento</span>
                        </DialogTitle>
                      </DialogHeader>

                      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field>
                          <FieldTitle className="mb-1 text-[10px] font-black uppercase text-gray-400 italic">
                            Fornecedor
                          </FieldTitle>
                          <FieldContent>
                            <Input
                              defaultValue={item.fornecedor_nome}
                              className="font-bold uppercase italic"
                            />
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldTitle className="mb-1 text-[10px] font-black uppercase text-gray-400 italic">
                            Valor total
                          </FieldTitle>
                          <FieldContent>
                            <Input
                              defaultValue={formatMoney(item.valor_total)}
                              className="font-black"
                            />
                          </FieldContent>
                        </Field>
                      </div>

                      <div className="mb-8 max-h-60 overflow-y-auto rounded-[30px] border border-gray-100 bg-gray-50 p-6 shadow-inner">
                        <p className="mb-4 text-[9px] font-black uppercase tracking-widest text-gray-400 italic">
                          Produtos detectados (serão enviados ao estoque)
                        </p>

                        <div className="space-y-3">
                          {produtosLista.length === 0 && (
                            <div className="rounded-xl bg-white p-4 text-sm text-gray-500">
                              Nenhum item detalhado encontrado no documento.
                            </div>
                          )}

                          {produtosLista.map((prod, idx) => {
                            const nomeProduto = prod.produto || prod.nome || "Produto";
                            const qtd = prod.qtd ?? prod.quantidade ?? 1;
                            const preco =
                              prod.preco_un ?? prod.preco ?? prod.valor_unitario;

                            return (
                              <div
                                key={idx}
                                className="flex flex-col gap-3 rounded-xl border border-gray-50 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <Package size={16} className="text-orange-500" />
                                  <span className="text-xs font-bold uppercase italic">
                                    {nomeProduto}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                                  {preco !== undefined && preco !== null && (
                                    <span className="flex items-center gap-1 text-xs font-black text-green-600">
                                      <DollarSign size={12} className="text-green-500" />
                                      {Number.parseFloat(String(preco)).toFixed(2)} unit.
                                    </span>
                                  )}

                                  <span className="border-l border-gray-300 pl-4 text-xs font-black text-gray-600">
                                    Qtd: {qtd}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <DialogFooter className="mt-2 flex-col items-center gap-4 sm:flex-row sm:justify-between">
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle size={14} />
                          <span className="text-[9px] font-bold uppercase italic">
                            conferência obrigatória
                          </span>
                        </div>

                        <Button
                          onClick={() => void handleApprove(item)}
                          disabled={processingId === item.id}
                          className="h-16 w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-10 text-xs font-black uppercase text-white shadow-xl shadow-green-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 sm:w-auto italic"
                        >
                          {processingId === item.id ? (
                            <>
                              <Loader2 className="mr-2 animate-spin" size={18} />
                              Injetando no estoque...
                            </>
                          ) : (
                            "Confirmar e lançar estoque"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    onClick={() => void handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="h-14 w-14 shrink-0 rounded-2xl text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Trash2 size={20} />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative mt-12 overflow-hidden rounded-[40px] bg-gray-900 p-8 text-white shadow-2xl">
        <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-10">
          <Info size={120} />
        </div>

        <div className="relative z-10">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-black uppercase tracking-tighter italic">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500">
              <MessageSquare size={16} className="text-white" />
            </span>
            Como funciona a automação?
          </h3>

          <div className="grid grid-cols-1 gap-6 text-sm font-medium text-gray-300 md:grid-cols-3">
            <p>
              <strong className="text-white">1.</strong> Receba a cotação, o link
              ou a nota fiscal por foto, PDF, XML ou QR Code.
            </p>
            <p>
              <strong className="text-white">2.</strong> Use uma das formas de
              leitura acima para a IA montar a prévia do lançamento.
            </p>
            <p>
              <strong className="text-white">3.</strong> Confira a nota e mande
              direto para o estoque com mais rapidez e menos digitação.
            </p>
          </div>
        </div>
      </div>

      <Dialog
        open={showQrDialog}
        onOpenChange={(open) => {
          setShowQrDialog(open);
          if (!open) stopQr();
        }}
      >
        <DialogContent className="max-w-xl rounded-[45px] border-none bg-white p-8 shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter italic">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <QrCode size={22} />
              </div>
              Leitor NFC-e
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-500">
              Aponte a câmera para o QR Code da nota fiscal.
            </p>

            <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-black">
              <video
                ref={videoRef}
                className="h-[320px] w-full object-cover"
                playsInline
                muted
              />
            </div>

            {qrError && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-bold uppercase tracking-wider text-red-500">
                {qrError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => void startQr()}
                className="h-12 flex-1 rounded-2xl bg-blue-600 text-xs font-black uppercase text-white hover:bg-blue-700 italic"
              >
                Iniciar câmera
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  stopQr();
                  setShowQrDialog(false);
                }}
                className="h-12 flex-1 rounded-2xl border-gray-200"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}