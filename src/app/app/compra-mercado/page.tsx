"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  QrCode, ScanLine, Camera, ArrowLeft, 
  ShoppingBag, CheckCircle2, Loader2, Zap 
} from "lucide-react";
import Link from "next/link";

export default function CompraMercadoPage() {
  const [isScanning, setIsScanning] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app" className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Compra Mercado</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Entrada rápida via NFC-e</p>
          </div>
        </div>
      </div>

      {/* Área do Scanner */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-pink-500/20 blur-3xl rounded-[50px]"></div>
        <Card className="border-4 border-dashed border-gray-100 rounded-[50px] bg-white/80 backdrop-blur-md overflow-hidden relative z-10">
          <CardContent className="p-16 text-center">
            {isScanning ? (
              <div className="space-y-6">
                <div className="w-64 h-64 mx-auto bg-gray-900 rounded-[40px] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-orange-500 animate-pulse opacity-50"></div>
                  <ScanLine className="text-orange-500 w-48 h-48 animate-bounce" />
                </div>
                <p className="font-black italic uppercase text-sm text-orange-600 animate-pulse">Buscando QR Code...</p>
                <Button variant="ghost" onClick={() => setIsScanning(false)} className="text-gray-400 font-bold uppercase text-[10px]">Cancelar</Button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="w-24 h-24 bg-orange-50 rounded-[30px] flex items-center justify-center mx-auto text-orange-600 shadow-inner">
                  <QrCode size={48} />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-800">Scanner de Notas</h2>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2 max-w-xs mx-auto">
                    Aponte a câmera para o QR Code da nota fiscal para importar os itens instantaneamente.
                  </p>
                </div>
                <Button 
                  onClick={() => setIsScanning(true)}
                  className="h-16 px-10 rounded-2xl bg-gray-900 text-white font-black italic uppercase text-xs tracking-widest hover:bg-orange-600 transition-all shadow-xl"
                >
                  <Camera className="mr-3" /> Ativar Câmera
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas Compras Processadas */}
      <div className="space-y-4">
        <h3 className="font-black italic uppercase text-gray-400 text-[10px] tracking-[0.2em] ml-4">Importados Recentemente</h3>
        <Card className="border-gray-50 rounded-[35px] bg-white overflow-hidden group">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                <ShoppingBag size={28} />
              </div>
              <div>
                <p className="font-black italic uppercase text-gray-800 text-lg leading-tight">Supermercado Confiança</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">12 Itens • R$ 452,30 • Hoje, 14:30</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
               <CheckCircle2 size={14} className="text-green-600" />
               <span className="text-[9px] font-black text-green-600 uppercase italic">Sincronizado</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
