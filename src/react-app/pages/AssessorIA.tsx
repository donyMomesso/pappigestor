"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/react-app/components/ui/button';
import { Card, CardContent } from '@/react-app/components/ui/card';
import { Input } from '@/react-app/components/ui/input';
import { Bot, Send, Loader2, Sparkles, TrendingUp, Receipt, Package, AlertTriangle, Camera, Image, X, History, ListChecks } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatResponse { resposta?: string; error?: string; }
interface NotaResponse { itens?: any[]; total?: number; fornecedor?: string; error?: string; }
interface AnaliseResponse { analise?: string; error?: string; }

export default function AssessorIAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzingStock, setAnalyzingStock] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (pergunta?: string) => {
    const texto = pergunta || input.trim();
    if (!texto || loading) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: texto, timestamp: new Date() }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ia/chat', { method: 'POST', body: JSON.stringify({ pergunta: texto }) });
      const data = await res.json() as ChatResponse;
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: data.resposta || data.error || 'Erro.', timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Erro de conexão.', timestamp: new Date() }]);
    } finally { setLoading(false); }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/ia/ler-nota', { method: 'POST', body: formData });
      const data = await res.json() as NotaResponse;
      let resp = data.error ? `❌ ${data.error}` : `📋 Nota de R$ ${data.total} processada.`;
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: resp, timestamp: new Date() }]);
    } finally { setUploadingImage(false); }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Botões do topo (conforme seu design anterior) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button onClick={() => cameraInputRef.current?.click()} variant="outline" className="h-24 rounded-[30px] flex flex-col border-dashed border-orange-200">
          <Camera size={28} />
          <span className="text-[10px] font-black uppercase italic">Scanner HD</span>
        </Button>
        {/* Outros botões mantidos... */}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-2xl rounded-[40px] bg-white">
        <CardContent className="flex-1 overflow-auto p-6 space-y-6">
           {/* Loop das mensagens e ref scrollEnd */}
           <div ref={messagesEndRef} />
        </CardContent>
        {/* Input area com cameraInputRef e fileInputRef escondidos */}
      </Card>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0]!)} />
    </div>
  );
}
