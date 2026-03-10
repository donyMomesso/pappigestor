"use client";

import { useState } from "react";
import { Plus, X, Save, Loader2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export function NovoProdutoModal({ onSave }: { onSave: (p: any) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    unidade: "un",
    estoque_minimo: 0,
    estoque_atual: 0,
    categoria: "Insumos"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      setOpen(false);
      setFormData({ nome: "", unidade: "un", estoque_minimo: 0, estoque_atual: 0, categoria: "Insumos" });
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-all outline-none">
          <Plus size={18} /> Nova Auditoria
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-4xl p-8 shadow-2xl z-50 animate-in zoom-in-95 duration-200 focus:outline-none">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-black italic uppercase text-gray-800">Novo Item / Auditoria</Dialog.Title>
            <Dialog.Close className="text-gray-400 hover:text-gray-600 outline-none">
              <X size={20}/>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome do Produto</label>
              <input 
                required 
                className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                value={formData.nome} 
                onChange={e => setFormData({...formData, nome: e.target.value})} 
                placeholder="Ex: Farinha de Trigo" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Qtd Mínima</label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                  value={formData.estoque_minimo} 
                  onChange={e => setFormData({...formData, estoque_minimo: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Qtd Atual</label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                  value={formData.estoque_atual} 
                  onChange={e => setFormData({...formData, estoque_atual: Number(e.target.value)})} 
                />
              </div>
            </div>

            <button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black italic uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Salvar no Inventário</>}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
