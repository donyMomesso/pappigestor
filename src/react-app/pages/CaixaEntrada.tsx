"use client";

import { useState } from "react";
import { useAppAuth } from "@/contexts/AppAuthContext";
import { processarNotaXML } from "@/app/actions/processar-nota"; // Garanta que este caminho existe
import { 
  Loader2, Upload, FileText, CheckCircle2, 
  AlertCircle, Send, Trash2, Inbox, Sparkles 
} from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";

interface ArquivoProcessado {
  id: string;
  file: File;
  preview: string;
  status: "pendente" | "processando" | "processado" | "erro";
  dados?: any;
  erro?: string;
}

export default function CaixaEntradaPage() {
  const { localUser } = useAppAuth();
  const [arquivos, setArquivos] = useState<ArquivoProcessado[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const novos = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      status: "pendente" as const,
    }));
    setArquivos(prev => [...prev, ...novos]);
  };

  const executarProcessamento = async (arquivo: ArquivoProcessado) => {
    setArquivos(prev => prev.map(a => a.id === arquivo.id ? { ...a, status: "processando" } : a));

    const formData = new FormData();
    formData.append("file", arquivo.file);
    // Correção: Convertendo empresa_id para string para evitar erro de tipo
    formData.append("empresa_id", String(localUser?.empresa_id || ""));

    try {
      const result = await processarNotaXML(formData);
      
      if (result.success) {
        setArquivos(prev => prev.map(a => a.id === arquivo.id ? { ...a, status: "processado" } : a));
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setArquivos(prev => prev.map(a => a.id === arquivo.id ? { ...a, status: "erro", erro: err.message } : a));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 italic uppercase flex items-center gap-3 tracking-tighter">
            <Inbox className="text-orange-500" size={32} />
            Caixa de Entrada
          </h1>
          <p className="text-gray-500 font-medium italic text-sm">Processamento inteligente Mocha IA</p>
        </div>
      </div>

      <Card className="border-4 border-dashed border-gray-100 bg-white rounded-4xl hover:border-orange-500/20 transition-all group overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <label className="flex flex-col items-center justify-center py-16 cursor-pointer">
            <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <p className="text-xl font-black italic uppercase text-gray-800">Arraste ou Clique</p>
            <input type="file" className="hidden" multiple onChange={handleFileSelect} />
          </label>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {arquivos.map((arq) => (
          <div key={arq.id} className="bg-white rounded-3xl border border-gray-100 p-4 flex items-center gap-6 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 italic font-black text-[10px] text-gray-400">
              {arq.preview ? <img src={arq.preview} className="w-full h-full object-cover" /> : "DOC"}
            </div>
            <div className="flex-1">
              <h4 className="font-black italic uppercase text-gray-800 text-sm">{arq.file.name}</h4>
              <p className="text-[10px] font-black text-gray-400 uppercase">{arq.status}</p>
            </div>
            <div className="flex items-center gap-2">
              {arq.status === "pendente" && (
                <Button onClick={() => executarProcessamento(arq)} className="bg-orange-500 hover:bg-orange-600 rounded-xl px-4 italic font-black uppercase text-[10px]">
                  <Sparkles size={14} className="mr-1" /> Processar
                </Button>
              )}
              {arq.status === "processando" && <Loader2 className="animate-spin text-orange-500" />}
              <button onClick={() => setArquivos(prev => prev.filter(a => a.id !== arq.id))} className="p-2 text-gray-300 hover:text-rose-500 transition-colors">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
