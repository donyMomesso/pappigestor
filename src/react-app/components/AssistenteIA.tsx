"use client";

import { useState, useRef, useEffect } from "react";
import { escanearNotasNoGmail } from "@/app/actions/ia-gmail-scanner";
import { processarAnexoGmail } from "@/app/actions/ia-deep-scanner";
import { 
  Sparkles, X, Send, Loader2, BrainCircuit, 
  MailSearch, FileSearch, TrendingUp, Package, DollarSign 
} from "lucide-react";

interface Sugestao {
  tipo: "economia" | "alerta" | "estoque";
  titulo: string;
  acao: () => void;
}

export default function AssistenteIA({ contexto = "home" }) {
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [historico, setHistorico] = useState<any[]>([]);
  const [processando, setProcessando] = useState(false);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carrega sugestões baseadas na página atual (#64)
  useEffect(() => {
    if (aberto) {
      const dicas: Record<string, Sugestao[]> = {
        "estoque": [{ tipo: "estoque", titulo: "O que está acabando?", acao: () => setMensagem("Quais produtos estão com estoque baixo?") }],
        "financeiro": [{ tipo: "alerta", titulo: "Boletos de hoje", acao: () => setMensagem("Quais boletos vencem hoje?") }],
        "home": [{ tipo: "economia", titulo: "Dicas de Lucro", acao: () => setMensagem("Como posso aumentar meu lucro este mês?") }]
      };
      setSugestoes(dicas[contexto] || dicas["home"]);
    }
  }, [aberto, contexto]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [historico]);

  const handleScanGmail = async () => {
  setProcessando(true);
  setHistorico((p) => [
    ...p,
    { tipo: "user", conteudo: "🔍 Verificando notas no meu Gmail...", timestamp: new Date() },
  ]);

  const res = await escanearNotasNoGmail();
  const notas = res.notas ?? [];

  if (res.success && notas.length > 0) {
    const ultima = notas[0];

    setHistorico((p) => [
      ...p,
      {
        tipo: "assistant",
        conteudo: `Encontrei ${notas.length} notas pendentes! A última é de **${ultima?.fornecedor ?? "um fornecedor"}**. Deseja que eu faça a leitura profunda do PDF?`,
        dados: ultima,
      },
    ]);
  } else {
    setHistorico((p) => [
      ...p,
      { tipo: "assistant", conteudo: "Tudo limpo! Não encontrei notas novas no seu e-mail por enquanto." },
    ]);
  }

  setProcessando(false);
};

  const enviarMensagem = async (textoOverride?: string) => {
    const msgFinal = textoOverride || mensagem.trim();
    if (!msgFinal) return;
    setHistorico(p => [...p, { tipo: "user", conteudo: msgFinal }]);
    setMensagem("");
    // Aqui conectaria com a sua rota /api/ia/chat que criamos no Worker
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <button
        onClick={() => setAberto(!aberto)}
        className={`w-16 h-16 rounded-[25px] flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
          aberto ? "bg-gray-950 rotate-90" : "bg-orange-600 shadow-xl shadow-orange-500/40"
        }`}
      >
        {aberto ? <X className="text-white" size={24} /> : <Sparkles className="text-white animate-pulse" size={26} />}
      </button>

      {aberto && (
        <div className="absolute bottom-20 right-0 w-[90vw] max-w-[400px] bg-white rounded-[40px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
          <div className="bg-gray-950 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <BrainCircuit className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-white font-black italic uppercase text-[10px] tracking-widest leading-none">Pappi Assessor</h3>
                <p className="text-orange-500 text-[9px] font-bold uppercase mt-1">Inteligência Ativa</p>
              </div>
            </div>
          </div>

          <div className="h-[380px] overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar" ref={scrollRef}>
            {historico.length === 0 && (
              <div className="text-center py-4 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase italic">Como posso ajudar sua Pizzaria hoje?</p>
                <div className="flex flex-col gap-2">
                  {sugestoes.map((s, i) => (
                    <button key={i} onClick={s.acao} className="p-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase italic text-gray-700 hover:border-orange-500 transition-all shadow-sm">
                      {s.titulo}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {historico.map((msg, i) => (
              <div key={i} className={`flex ${msg.tipo === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-[25px] ${
                  msg.tipo === "user" ? "bg-gray-950 text-white rounded-tr-none" : "bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm"
                } text-xs font-bold italic`}>
                  {msg.conteudo}
                </div>
              </div>
            ))}
            {processando && <Loader2 className="animate-spin text-orange-600 mx-auto" size={20} />}
          </div>

          <div className="p-4 bg-white border-t border-gray-50 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleScanGmail} className="flex items-center justify-center gap-2 p-3 bg-orange-50 text-orange-600 rounded-2xl text-[9px] font-black uppercase italic hover:bg-orange-100 transition-all">
                <MailSearch size={14} /> Escanear Gmail
              </button>
              <button disabled={processando} className="flex items-center justify-center gap-2 p-3 bg-gray-900 text-white rounded-2xl text-[9px] font-black uppercase italic hover:bg-black transition-all">
                <TrendingUp size={14} /> Análise Pro
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); enviarMensagem(); }} className="flex items-center gap-2 bg-gray-100 p-2 rounded-2xl focus-within:ring-2 ring-orange-500/20 transition-all">
              <input value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Pergunte ao Pappi..." className="flex-1 bg-transparent border-none outline-none px-3 text-[11px] font-bold italic" />
              <button type="submit" className="bg-orange-600 text-white p-2.5 rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-600/20"><Send size={14} /></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
