"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Eye, Trash2, Loader2, ArrowRight, Receipt, Package, AlertCircle, 
  Upload, MessageSquare, FileText, Info, Camera, QrCode, Link as LinkIcon, Check, X, Sparkles, DollarSign
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from "@/react-app/components/ui/dialog";
import { Field, FieldContent, FieldTitle } from "@/react-app/components/ui/field"; 
import { Input } from "@/react-app/components/ui/input";
import { Button } from "@/react-app/components/ui/button";
import { useAppAuth } from '@/react-app/contexts/AppAuthContext'; // ✅ IMPORT DA AUTENTICAÇÃO

const StatusBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase italic border border-orange-100 animate-pulse">
    {children}
  </span>
);

export default function InboxPage() {
  const { localUser } = useAppAuth(); // ✅ PUXANDO O USUÁRIO LOGADO
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extraindo, setExtraindo] = useState(false);
  
  // ESTADOS DE AÇÃO
  const [processingId, setProcessingId] = useState<number | string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  
  // REFS DOS INPUTS E CÂMERA
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // ESTADOS DO LINK E QR CODE
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkNfe, setLinkNfe] = useState("");
  const [showQrDialog, setShowQrDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrLoopRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  // ✅ FUNÇÃO MÁGICA QUE GERA OS CABEÇALHOS DE SEGURANÇA
  const getHeaders = useCallback((isFormData = false) => {
    const pId = localStorage.getItem("pId") || localStorage.getItem("pizzariaId") || "";
    const email = localUser?.email || localStorage.getItem("userEmail") || "";
    
    const headers: Record<string, string> = {
      "x-pizzaria-id": pId,
      "x-empresa-id": pId,
      "x-user-email": email
    };

    // Se for FormData (Upload de Arquivo), o navegador define o Content-Type automaticamente
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    
    return headers;
  }, [localUser]);

  const fetchInbox = async () => {
    try {
      const res = await fetch("/api/ia/inbox", {
        headers: getHeaders()
      });
      const data = (await res.json()) as any[] | { results?: any[] };
      const extractedData = Array.isArray(data) ? data : (data?.results || []);
      setItems(extractedData);
    } catch (e) {
      console.error("Erro ao carregar Inbox", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  // ============================================================================
  // 1. UPLOAD DE FOTO E PDF (Vai pro Worker e Banco)
  // ============================================================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ia/ler-nota", {
        method: "POST",
        headers: getHeaders(true), // ✅ Passa true para não sobrescrever o Content-Type do FormData
        body: formData,
      });

      if (!response.ok) throw new Error("Erro ao processar arquivo");
      await fetchInbox(); // Recarrega a lista com a nova nota
      
    } catch (error) {
      alert("Falha ao enviar documento para a IA.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  // ============================================================================
  // 2. LEITURA DE LINK E QR CODE (Vai pro Next.js e cria item virtual na lista)
  // ============================================================================
  const extrairDadosPorLink = async () => {
    if (!linkNfe.trim()) return;
    setExtraindo(true);

    try {
      const response = await fetch("/api/ia/ler-link", {
        method: "POST",
        headers: getHeaders(), // ✅ Usando headers seguros
        body: JSON.stringify({ url: linkNfe }),
      });

      const dados = (await response.json()) as any;
      if (!response.ok) throw new Error(dados?.error || "Falha na API");

      const responseIA = dados?.data || dados;
      
      // Cria um item "Virtual" na Caixa de Entrada
      const mockItem = {
        id: `link-${Date.now()}`,
        fornecedor_nome: responseIA.fornecedor || "Nota via Link (NFC-e)",
        valor_total: responseIA.total || 0,
        json_extraido: responseIA.itens || [],
        criado_em: new Date().toISOString(),
        isTemp: true
      };

      setItems(prev => [mockItem, ...prev]);
      setLinkNfe("");
      setShowLinkInput(false);
    } catch (err: any) {
      alert(err?.message || "Não foi possível ler a nota a partir deste link.");
    } finally {
      setExtraindo(false);
    }
  };

  // Funções do Scanner de QR Code
  const stopQr = useCallback(() => {
    if (qrLoopRef.current) cancelAnimationFrame(qrLoopRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startQr = useCallback(async () => {
    setQrError(null);
    try {
      if (!("mediaDevices" in navigator)) throw new Error("Sem suporte a câmera.");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("Vídeo não inicializado.");
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
              setLinkNfe(raw);
              setTimeout(() => extrairDadosPorLink(), 50);
              return;
            }
          }
        } catch {}
        qrLoopRef.current = requestAnimationFrame(scan);
      };
      qrLoopRef.current = requestAnimationFrame(scan);
    } catch (err: any) { setQrError(err?.message || "Erro ao abrir a câmera."); }
  }, [extrairDadosPorLink, stopQr]);

  useEffect(() => {
    if (!showQrDialog) stopQr();
  }, [showQrDialog, stopQr]);

  // ============================================================================
  // 3. APROVAÇÃO E LANÇAMENTO NO BANCO
  // ============================================================================
  const handleApprove = async (item: any) => {
    setProcessingId(item.id);

    try {
      const res = await fetch("/api/ia/inbox/approve", {
        method: "POST",
        headers: getHeaders(), // ✅ Usando headers seguros
        body: JSON.stringify({
          id: item.id,
          json_extraido: typeof item.json_extraido === 'string' ? item.json_extraido : JSON.stringify(item.json_extraido)
        }),
      });

      if (!res.ok) throw new Error("Falha ao aprovar");
      
      alert("Nota lançada no estoque com sucesso! Custos atualizados.");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      console.error(e);
      alert("Ocorreu um erro ao processar a nota para o estoque.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Tem certeza que deseja descartar esta nota?")) return;
    setDeletingId(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
            Caixa de <span className="text-orange-500">Entrada</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] italic">
            Importe e gerencie as notas da operação
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black italic text-orange-500">{items.length}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Pendentes</span>
        </div>
      </div>

      {/* ÁREA DE IMPORTAÇÃO DA IA (COM OS 4 BOTÕES MÁGICOS) */}
      <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-black italic uppercase text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles size={20} className="text-orange-500" /> Leitura Inteligente
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Escolha a forma de importar sua nota fiscal
            </p>
          </div>
          {(uploading || extraindo) && (
            <span className="text-[10px] font-bold text-orange-500 animate-pulse flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
              <Loader2 size={12} className="animate-spin" /> Extraindo Dados...
            </span>
          )}
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf" className="hidden" />
        <input type="file" ref={cameraInputRef} onChange={handleFileUpload} accept="image/*" capture="environment" className="hidden" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* FOTO */}
          <button onClick={() => cameraInputRef.current?.click()} disabled={uploading || extraindo} className="rounded-[24px] border-2 border-dashed border-orange-200 bg-orange-50/50 flex flex-col items-center justify-center gap-3 py-6 hover:bg-orange-50 transition-colors disabled:opacity-50">
            <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-orange-500"><Camera size={20} /></div>
            <span className="text-[10px] font-black italic uppercase text-orange-900">Tirar Foto</span>
          </button>
          
          {/* PDF/GALERIA */}
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading || extraindo} className="rounded-[24px] border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-3 py-6 hover:bg-gray-100 transition-colors disabled:opacity-50">
            <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-gray-500"><Upload size={20} /></div>
            <span className="text-[10px] font-black italic uppercase text-gray-600">Galeria / PDF</span>
          </button>
          
          {/* QR CODE */}
          <button onClick={() => setShowQrDialog(true)} disabled={uploading || extraindo} className="col-span-2 md:col-span-1 rounded-[24px] border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center gap-3 py-6 hover:bg-blue-50 transition-colors text-blue-600 disabled:opacity-50">
            <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-blue-500"><QrCode size={20} /></div>
            <span className="text-[10px] font-black italic uppercase tracking-wider">Ler QR Code</span>
          </button>
          
          {/* LINK */}
          {!showLinkInput ? (
            <button onClick={() => setShowLinkInput(true)} disabled={uploading || extraindo} className="col-span-2 md:col-span-1 rounded-[24px] border border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-3 py-6 hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50">
              <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-gray-400"><LinkIcon size={20} /></div>
              <span className="text-[10px] font-black italic uppercase tracking-wider">Colar Link Sefaz</span>
            </button>
          ) : (
            <div className="col-span-2 md:col-span-1 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 p-2 bg-gray-50 rounded-[24px] border border-gray-200">
              <div className="relative flex-1 w-full">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Cole o link..." value={linkNfe} onChange={(e) => setLinkNfe(e.target.value)} className="h-10 pl-9 rounded-xl font-medium bg-white border-blue-200 text-xs w-full" />
              </div>
              <div className="flex gap-2 w-full">
                <Button type="button" onClick={extrairDadosPorLink} disabled={!linkNfe || extraindo} className="flex-1 h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700"><Check size={14} /></Button>
                <Button type="button" variant="outline" onClick={() => setShowLinkInput(false)} className="flex-1 h-10 rounded-xl border-gray-200 text-gray-500"><X size={14} /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LISTA DE NOTAS */}
      {items.length === 0 ? (
        <div className="bg-white rounded-[40px] p-16 border border-gray-100 shadow-sm text-center space-y-4">
          <Receipt className="mx-auto text-gray-200" size={60} />
          <p className="text-gray-400 font-bold italic uppercase text-sm">Nenhuma nota aguardando aprovação.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white hover:bg-gray-50/50 p-6 rounded-[35px] border border-gray-100 shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between group gap-6">
              
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-black italic uppercase text-gray-900 tracking-tight">{item.fornecedor_nome}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase italic">
                      {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                    <StatusBadge>Processado pela IA</StatusBadge>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {Array.isArray(item.json_extraido) ? item.json_extraido.length : 0} Produtos
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 md:gap-8 w-full md:w-auto">
                <div className="text-left md:text-right flex-1 md:flex-none">
                  <p className="text-[10px] font-bold text-gray-400 uppercase italic">Total Lançado</p>
                  <p className="text-xl font-black italic text-gray-900">R$ {item.valor_total?.toFixed(2) || "0.00"}</p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="h-14 px-8 bg-gray-900 hover:bg-orange-600 text-white rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all w-full md:w-auto">
                      Conferir Nota <ArrowRight size={16} className="ml-2 hidden sm:block" />
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-3xl rounded-[45px] p-8 border-none shadow-2xl overflow-hidden">
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                        Validar <span className="text-orange-500">Lançamento</span>
                      </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <Field>
                        <FieldTitle className="text-[10px] font-black uppercase italic text-gray-400 mb-1">Fornecedor</FieldTitle>
                        <FieldContent>
                          <Input defaultValue={item.fornecedor_nome} className="font-bold italic uppercase" />
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldTitle className="text-[10px] font-black uppercase italic text-gray-400 mb-1">Valor Total</FieldTitle>
                        <FieldContent>
                          <Input defaultValue={`R$ ${item.valor_total?.toFixed(2) || "0.00"}`} className="font-black" />
                        </FieldContent>
                      </Field>
                    </div>

                    <div className="bg-gray-50 rounded-[30px] p-6 mb-8 max-h-60 overflow-y-auto border border-gray-100 shadow-inner">
                       <p className="text-[9px] font-black uppercase italic text-gray-400 mb-4 tracking-widest">Produtos Detectados (Serão enviados ao Estoque)</p>
                       <div className="space-y-3">
                          {Array.isArray(item.json_extraido) && item.json_extraido.map((prod: any, idx: number) => (
                            <div key={idx} className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-50 gap-3">
                               <div className="flex items-center gap-3">
                                  <Package size={16} className="text-orange-500" />
                                  <span className="text-xs font-bold uppercase italic">{prod.produto}</span>
                               </div>
                               <div className="flex items-center gap-4 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                 {prod.preco_un && (
                                   <span className="text-xs font-black text-green-600 flex items-center gap-1">
                                     <DollarSign size={12} className="text-green-500"/>
                                     {parseFloat(prod.preco_un).toFixed(2)} unit.
                                   </span>
                                 )}
                                 <span className="text-xs font-black text-gray-600 border-l border-gray-300 pl-4">
                                   Qtd: {prod.qtd || 1}
                                 </span>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    <DialogFooter className="sm:justify-between items-center mt-2 flex-col sm:flex-row gap-4">
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle size={14} />
                        <span className="text-[9px] font-bold uppercase italic">Conferência obrigatória</span>
                      </div>
                      
                      <Button 
                        onClick={() => handleApprove(item)}
                        disabled={processingId === item.id}
                        className="h-16 px-10 w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-xl shadow-green-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {processingId === item.id ? (
                          <><Loader2 className="animate-spin mr-2" size={18} /> Injetando no Estoque...</>
                        ) : (
                          "Confirmar e Lançar Estoque"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="ghost" 
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="h-14 w-14 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 shrink-0"
                >
                  {deletingId === item.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BANNER DE INSTRUÇÕES */}
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
            <p><strong className="text-white">1.</strong> Receba a cotação, link ou nota fiscal (foto ou PDF) pelo WhatsApp.</p>
            <p><strong className="text-white">2.</strong> Use um dos 4 botões de Leitura Inteligente acima para importar o documento.</p>
            <p><strong className="text-white">3.</strong> A IA processa tudo na hora. Clique em "Conferir Nota" e mande direto pro seu estoque!</p>
          </div>
        </div>
      </div>

      {/* MODAL DO QR CODE (INVISÍVEL ATÉ CLICAR) */}
      <Dialog open={showQrDialog} onOpenChange={(open) => { setShowQrDialog(open); if (!open) stopQr(); }}>
        <DialogContent className="max-w-xl rounded-[45px] p-8 bg-white border-none shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><QrCode size={22} /></div>
              Leitor NFC-e
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-500">Aponte a câmera para o QR Code da nota fiscal.</p>
            <div className="rounded-[28px] overflow-hidden border border-gray-100 bg-black">
              <video ref={videoRef} className="w-full h-[320px] object-cover" playsInline muted />
            </div>
            {qrError && <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl uppercase tracking-wider">{qrError}</div>}
            <div className="flex gap-3">
              <Button type="button" onClick={startQr} className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black italic uppercase text-xs flex-1">Iniciar Câmera</Button>
              <Button type="button" variant="outline" onClick={() => { stopQr(); setShowQrDialog(false); }} className="h-12 rounded-2xl flex-1 border-gray-200">Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}