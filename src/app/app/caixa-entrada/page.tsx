"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/react-app/components/ui/dialog";
import { Field, FieldContent, FieldTitle } from "@/react-app/components/ui/field";
import { Input } from "@/react-app/components/ui/input";
import { Button } from "@/react-app/components/ui/button";
import { useAppAuthOptional } from "@/contexts/AppAuthContext";

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

const StatusBadge = ({ children }: { children: ReactNode }) => (
  <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase italic border border-orange-100">
    {children}
  </span>
);

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
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export default function InboxPage() {
  const auth = useAppAuthOptional();
  const localUser = auth?.localUser ?? null;

  const [items, setItems] = useState<InboxItem[]>([]);
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
      const pId = localStorage.getItem("pId") || localStorage.getItem("empresaId") || "";
      const email = localUser?.email || localStorage.getItem("userEmail") || "";

      const headers: Record<string, string> = {
        "x-empresa-id": pId,
        "x-user-email": email,
      };

      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }

      return headers;
    },
    [localUser?.email]
  );

  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/ia/inbox", {
        headers: getHeaders(),
      });

      const data = (await res.json()) as InboxItem[] | { results?: InboxItem[] };
      const extractedData = Array.isArray(data) ? data : data?.results || [];
      setItems(extractedData);
    } catch (e) {
      console.error("Erro ao carregar Inbox", e);
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

  const montarItemTemporario = useCallback((payload: any): InboxItem => {
    const responseIA = extrairPayloadIA(payload);
    const itensExtraidos = Array.isArray(responseIA?.itens) ? responseIA.itens : [];
    const valorTotal =
      Number(responseIA?.valor_total ?? responseIA?.total ?? 0) || 0;

    return {
      id: `tmp-${Date.now()}`,
      fornecedor_nome:
        responseIA?.fornecedor ||
        responseIA?.emitente ||
        "Documento lido pela IA",
      valor_total: valorTotal,
      json_extraido: itensExtraidos,
      criado_em: new Date().toISOString(),
      isTemp: true,
    };
  }, []);

  const processarLeituraPorArquivo = useCallback(
    async (file: File) => {
      setUploading(true);
      setLinkError(null);

      try {
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
      } catch (error: any) {
        console.error(error);
        alert(error?.message || "Falha ao enviar documento para a IA.");
      } finally {
        setUploading(false);

        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
      }
    },
    [getHeaders, montarItemTemporario, uploadArquivo]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await processarLeituraPorArquivo(file);
    },
    [processarLeituraPorArquivo]
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

      // @ts-ignore
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

      const scan = async () => {
        if (!videoRef.current) return;

        try {
          // @ts-ignore
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
          // ignora
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

  const totalPendente = items.reduce((acc, item) => acc + (item.valor_total || 0), 0);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-[20px] bg-orange-50 border border-orange-100 flex items-center justify-center">
            <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] italic text-orange-600">
            carregando caixa de entrada
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <section className="rounded-[38px] bg-gradient-to-br from-gray-950 via-zinc-900 to-orange-950 text-white p-8 md:p-10 shadow-2xl overflow-hidden relative">
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 mb-5">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300 italic">
                  leitura inteligente ativa
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                Caixa de entrada da IA
              </h1>

              <p className="mt-4 text-sm md:text-base text-zinc-300 max-w-2xl leading-relaxed">
                Importe notas por foto, PDF, QR Code ou link da Sefaz. O sistema
                organiza tudo para você validar e lançar no estoque com mais rapidez.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Clock3 className="w-4 h-4 text-orange-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-200 italic">
                  prioridade do dia: validar entradas com clareza
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <HeroMini label="Pendentes" value={String(items.length)} helper="notas aguardando" />
              <HeroMini
                label="Valor total"
                value={`R$ ${totalPendente.toFixed(2)}`}
                helper="em conferência"
              />
              <HeroMini label="IA" value="ativa" helper="processando documentos" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-sm p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                  <Brain size={24} className="text-orange-300" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300 italic mb-2">
                    o que a IA faz aqui
                  </p>
                  <h3 className="text-lg font-black italic uppercase tracking-tight text-white">
                    transforma documento em lançamento validável
                  </h3>
                  <p className="text-sm text-zinc-300 leading-relaxed mt-2 max-w-2xl">
                    A IA lê os dados, organiza os itens detectados e deixa tudo pronto
                    para sua conferência antes de enviar ao estoque.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-sm p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-300 italic mb-4">
                formas de entrada
              </p>

              <div className="grid grid-cols-2 gap-3">
                <MiniAction icon={<Camera size={16} />} label="Foto" />
                <MiniAction icon={<Upload size={16} />} label="PDF / Galeria" />
                <MiniAction icon={<QrCode size={16} />} label="QR Code" />
                <MiniAction icon={<LinkIcon size={16} />} label="Link Sefaz" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 text-[220px] font-black italic text-white/5 leading-none pointer-events-none">
          P
        </div>
      </section>

      <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <div>
            <h2 className="text-xl font-black italic uppercase text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles size={20} className="text-orange-500" />
              Leitura inteligente
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Escolha a forma de importar sua nota fiscal
            </p>
          </div>

          {(uploading || extraindo) && (
            <span className="text-[10px] font-bold text-orange-500 flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-full uppercase tracking-[0.18em] italic">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading || extraindo}
            className="rounded-[24px] border-2 border-dashed border-orange-200 bg-orange-50/50 flex flex-col items-center justify-center gap-3 py-6 hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-orange-500">
              <Camera size={20} />
            </div>
            <span className="text-[10px] font-black italic uppercase text-orange-900">
              Tirar foto
            </span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || extraindo}
            className="rounded-[24px] border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-3 py-6 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-gray-500">
              <Upload size={20} />
            </div>
            <span className="text-[10px] font-black italic uppercase text-gray-600">
              Galeria / PDF
            </span>
          </button>

          <button
            onClick={() => setShowQrDialog(true)}
            disabled={uploading || extraindo}
            className="col-span-2 md:col-span-1 rounded-[24px] border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center gap-3 py-6 hover:bg-blue-50 transition-colors text-blue-600 disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-blue-500">
              <QrCode size={20} />
            </div>
            <span className="text-[10px] font-black italic uppercase tracking-wider">
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
              className="col-span-2 md:col-span-1 rounded-[24px] border border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-3 py-6 hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-gray-400">
                <LinkIcon size={20} />
              </div>
              <span className="text-[10px] font-black italic uppercase tracking-wider">
                Colar link Sefaz
              </span>
            </button>
          ) : (
            <div className="col-span-2 md:col-span-1 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 p-2 bg-gray-50 rounded-[24px] border border-gray-200">
              <div className="relative flex-1 w-full">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cole o link..."
                  value={linkNfe}
                  onChange={(e) => setLinkNfe(e.target.value)}
                  className="h-10 pl-9 rounded-xl font-medium bg-white border-blue-200 text-xs w-full"
                />
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  onClick={() => void extrairDadosPorLink()}
                  disabled={!normalizarLinkNfe(linkNfe) || extraindo}
                  className="flex-1 h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
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
                  className="flex-1 h-10 rounded-xl border-gray-200 text-gray-500"
                >
                  <X size={14} />
                </Button>
              </div>

              {linkError && (
                <div className="text-[10px] font-bold text-red-500 bg-red-50 p-2 rounded-xl">
                  {linkError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-[40px] p-16 border border-gray-100 shadow-sm text-center space-y-4">
          <Receipt className="mx-auto text-gray-200" size={60} />
          <p className="text-gray-400 font-bold italic uppercase text-sm">
            Nenhuma nota aguardando aprovação.
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
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
                className="bg-white hover:bg-gray-50/50 p-6 rounded-[35px] border border-gray-100 shadow-sm transition-all flex flex-col xl:flex-row items-start xl:items-center justify-between group gap-6"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shrink-0">
                    <FileText size={24} />
                  </div>

                  <div>
                    <h3 className="font-black italic uppercase text-gray-900 tracking-tight">
                      {item.fornecedor_nome || "Fornecedor não identificado"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase italic">
                        {new Date(item.criado_em).toLocaleDateString("pt-BR")}
                      </span>

                      <StatusBadge>
                        {item.isTemp ? "prévia por link/arquivo" : "processado pela ia"}
                      </StatusBadge>

                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-[0.12em]">
                        {produtosDetectados} produtos
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:gap-8 w-full xl:w-auto">
                  <div className="text-left xl:text-right flex-1 xl:flex-none">
                    <p className="text-[10px] font-bold text-gray-400 uppercase italic">
                      Total lançado
                    </p>
                    <p className="text-xl font-black italic text-gray-900">
                      R$ {item.valor_total?.toFixed(2) || "0.00"}
                    </p>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="h-14 px-8 bg-gray-900 hover:bg-orange-600 text-white rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all w-full xl:w-auto">
                        Conferir nota
                        <ArrowRight size={16} className="ml-2 hidden sm:block" />
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-3xl rounded-[45px] p-8 border-none shadow-2xl overflow-hidden">
                      <DialogHeader className="mb-6">
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                          Validar <span className="text-orange-500">lançamento</span>
                        </DialogTitle>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <Field>
                          <FieldTitle className="text-[10px] font-black uppercase italic text-gray-400 mb-1">
                            Fornecedor
                          </FieldTitle>
                          <FieldContent>
                            <Input
                              defaultValue={item.fornecedor_nome}
                              className="font-bold italic uppercase"
                            />
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldTitle className="text-[10px] font-black uppercase italic text-gray-400 mb-1">
                            Valor total
                          </FieldTitle>
                          <FieldContent>
                            <Input
                              defaultValue={`R$ ${item.valor_total?.toFixed(2) || "0.00"}`}
                              className="font-black"
                            />
                          </FieldContent>
                        </Field>
                      </div>

                      <div className="bg-gray-50 rounded-[30px] p-6 mb-8 max-h-60 overflow-y-auto border border-gray-100 shadow-inner">
                        <p className="text-[9px] font-black uppercase italic text-gray-400 mb-4 tracking-widest">
                          Produtos detectados (serão enviados ao estoque)
                        </p>

                        <div className="space-y-3">
                          {produtosLista.map((prod, idx) => {
                            const nomeProduto = prod.produto || prod.nome || "Produto";
                            const qtd = prod.qtd ?? prod.quantidade ?? 1;
                            const preco =
                              prod.preco_un ?? prod.preco ?? prod.valor_unitario;

                            return (
                              <div
                                key={idx}
                                className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-50 gap-3"
                              >
                                <div className="flex items-center gap-3">
                                  <Package size={16} className="text-orange-500" />
                                  <span className="text-xs font-bold uppercase italic">
                                    {nomeProduto}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                  {preco !== undefined && preco !== null && (
                                    <span className="text-xs font-black text-green-600 flex items-center gap-1">
                                      <DollarSign size={12} className="text-green-500" />
                                      {Number.parseFloat(String(preco)).toFixed(2)} unit.
                                    </span>
                                  )}

                                  <span className="text-xs font-black text-gray-600 border-l border-gray-300 pl-4">
                                    Qtd: {qtd}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <DialogFooter className="sm:justify-between items-center mt-2 flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle size={14} />
                          <span className="text-[9px] font-bold uppercase italic">
                            conferência obrigatória
                          </span>
                        </div>

                        <Button
                          onClick={() => void handleApprove(item)}
                          disabled={processingId === item.id}
                          className="h-16 px-10 w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-xl shadow-green-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {processingId === item.id ? (
                            <>
                              <Loader2 className="animate-spin mr-2" size={18} />
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
                    className="h-14 w-14 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 shrink-0"
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

      <div className="bg-gray-900 rounded-[40px] p-8 text-white mt-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Info size={120} />
        </div>

        <div className="relative z-10">
          <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
              <MessageSquare size={16} className="text-white" />
            </span>
            Como funciona a automação?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-medium text-gray-300">
            <p>
              <strong className="text-white">1.</strong> Receba a cotação, o link
              ou a nota fiscal por foto, PDF ou QR Code.
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
        <DialogContent className="max-w-xl rounded-[45px] p-8 bg-white border-none shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <QrCode size={22} />
              </div>
              Leitor NFC-e
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-500">
              Aponte a câmera para o QR Code da nota fiscal.
            </p>

            <div className="rounded-[28px] overflow-hidden border border-gray-100 bg-black">
              <video
                ref={videoRef}
                className="w-full h-[320px] object-cover"
                playsInline
                muted
              />
            </div>

            {qrError && (
              <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl uppercase tracking-wider">
                {qrError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => void startQr()}
                className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black italic uppercase text-xs flex-1"
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
                className="h-12 rounded-2xl flex-1 border-gray-200"
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
    <div className="rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-sm p-4">
      <p className="text-[9px] text-orange-200 uppercase tracking-[0.2em] font-black italic mb-1">
        {label}
      </p>
      <p className="text-2xl font-black italic uppercase tracking-tighter text-white">
        {value}
      </p>
      <p className="text-[10px] text-zinc-300 uppercase tracking-[0.16em] font-bold italic mt-2">
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
      <div className="flex items-center gap-2 text-orange-300 mb-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.18em] italic">
          entrada
        </span>
      </div>
      <p className="text-sm font-black italic uppercase tracking-tight text-white">
        {label}
      </p>
    </div>
  );
}