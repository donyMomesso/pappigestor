"use client";

import { useState, useEffect } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Label } from "@/react-app/components/ui/label";
import { Textarea } from "@/react-app/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/react-app/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/react-app/components/ui/select";
import {
  Store, Loader2, Plus, Trash2, Edit2, Search, ArrowLeft, MessageCircle, Building2, Phone, Fingerprint
} from "lucide-react";
import Link from "next/link";

interface Fornecedor {
  id: string;
  cnpj_cpf?: string;
  nome_fantasia: string;
  razao_social?: string;
  telefone_whatsapp: string;
  categoria_principal: string;
  prazo_pagamento_dias: number;
  email?: string;
  nome_contato?: string;
  mensagem_padrao_cotacao?: string;
}

const CATEGORIAS_FORNECEDOR = [
  "Insumos", "Embalagens", "Bebidas", "Gás", "Serviços", "Mercado", "Hortifruti", "Equipamentos"
];

// O SEGREDO NEUROCIENTÍFICO
const MENSAGEM_PADRAO = "Olá, {nome}, tudo bem? Gostaria de solicitar uma cotação para a Pappi Pizza referente aos seguintes itens:\n";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Fornecedor>>({
    cnpj_cpf: "",
    razao_social: "",
    nome_fantasia: "",
    categoria_principal: "Insumos",
    telefone_whatsapp: "",
    prazo_pagamento_dias: 0,
    email: "",
    nome_contato: "", 
    mensagem_padrao_cotacao: MENSAGEM_PADRAO
  });

  const fetchFornecedores = async () => {
    try {
      const res = await fetch("/api/fornecedores");
      if (res.ok) setFornecedores((await res.json()) as Fornecedor[]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFornecedores(); }, []);

  const handleOpenDialog = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setEditingId(fornecedor.id);
      setFormData({
        ...fornecedor,
        prazo_pagamento_dias: fornecedor.prazo_pagamento_dias || 0,
        mensagem_padrao_cotacao: fornecedor.mensagem_padrao_cotacao || MENSAGEM_PADRAO
      });
    } else {
      setEditingId(null);
      setFormData({
        cnpj_cpf: "", razao_social: "", nome_fantasia: "", categoria_principal: "Insumos",
        telefone_whatsapp: "", prazo_pagamento_dias: 0, email: "", nome_contato: "",
        mensagem_padrao_cotacao: MENSAGEM_PADRAO
      });
    }
    setIsDialogOpen(true);
  };

  const buscarCNPJ = async () => {
    if (!formData.cnpj_cpf) return;
    const apenasNumeros = formData.cnpj_cpf.replace(/\D/g, '');
    
    if (apenasNumeros.length === 11) {
      alert("Aviso: Por questões de privacidade (LGPD), a busca automática não funciona para CPF.");
      return;
    }
    if (apenasNumeros.length !== 14) {
      alert("Por favor, digite um CNPJ válido com 14 números.");
      return;
    }

    setIsSearchingCNPJ(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${apenasNumeros}`);
      if (response.ok) {
        const data = (await response.json()) as any; 
        setFormData(prev => ({
          ...prev,
          razao_social: data.razao_social || prev.razao_social,
          nome_fantasia: data.nome_fantasia || data.razao_social || prev.nome_fantasia,
          telefone_whatsapp: data.ddd_telefone_1 ? data.ddd_telefone_1.replace(/\D/g, '') : prev.telefone_whatsapp,
          email: data.email || prev.email
        }));
      } else {
        alert("CNPJ não encontrado.");
      }
    } catch (error) {
      alert("Erro ao conectar com a base de dados.");
    } finally {
      setIsSearchingCNPJ(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const url = editingId ? `/api/fornecedores/${editingId}` : "/api/fornecedores";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchFornecedores();
        setIsDialogOpen(false);
      } else {
        const err = (await res.json()) as any; 
        alert(`Erro ao salvar: ${err.error || "Desconhecido"}`);
      }
    } catch (error) {
      alert("Falha na comunicação com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja remover este fornecedor?")) return;
    try {
      const res = await fetch(`/api/fornecedores/${id}`, { method: "DELETE" });
      if (res.ok) setFornecedores(prev => prev.filter(f => f.id !== id));
    } catch (e) { alert("Erro ao remover."); }
  };

  const filtered = fornecedores.filter(f => 
    f.nome_fantasia.toLowerCase().includes(search.toLowerCase()) || 
    (f.categoria_principal && f.categoria_principal.toLowerCase().includes(search.toLowerCase()))
  );

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/app" className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
              Gestão de <span className="text-orange-500">Fornecedores</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic mt-1">Sua rede de parceiros</p>
          </div>
        </div>

        <Button onClick={() => handleOpenDialog()} className="h-12 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-pink-600 hover:scale-105 transition-transform shadow-lg shadow-orange-200 text-white font-black italic uppercase text-xs tracking-widest">
          <Plus size={18} className="mr-2" /> Novo Parceiro
        </Button>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input 
          className="pl-14 h-14 rounded-[24px] border-gray-100 bg-white shadow-sm font-bold text-gray-600 w-full" 
          placeholder="Buscar por nome ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* LISTA (CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center bg-white rounded-[45px] p-20 border border-gray-100 shadow-sm">
            <Store className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-black italic uppercase text-gray-400 tracking-widest">Nenhum fornecedor encontrado.</p>
          </div>
        ) : (
          filtered.map((f) => (
            <Card key={f.id} className="border-gray-100 rounded-[30px] hover:shadow-xl transition-all group bg-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-[20px] bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Store size={24} />
                  </div>
                  <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-100">
                    {f.categoria_principal || "Geral"}
                  </span>
                </div>
                
                <div>
                  <h3 className="font-black italic uppercase text-gray-900 tracking-tight text-xl leading-none">{f.nome_fantasia}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${f.prazo_pagamento_dias > 0 ? 'bg-blue-400' : 'bg-green-400'}`}></span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {f.prazo_pagamento_dias > 0 ? `Boleto: ${f.prazo_pagamento_dias} dias` : 'Pagamento: À vista / PIX'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-green-600 font-bold text-xs bg-green-50 px-3 py-1.5 rounded-xl w-fit">
                      <MessageCircle size={14} /> {f.telefone_whatsapp || "S/ Número"}
                    </div>
                    {f.nome_contato && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{f.nome_contato}</span>}
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(f)} className="w-8 h-8 rounded-lg text-blue-500 hover:bg-blue-50"><Edit2 size={14} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(f.id)} className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* DIALOG DE CRIAR/EDITAR */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-[20px] p-6 border-none shadow-2xl bg-white max-h-[90vh] overflow-y-auto hide-scrollbar">
          <DialogHeader className="mb-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {editingId ? "Editar Fornecedor" : "Novo Fornecedor"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
            
            {/* CNPJ ou CPF */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">CNPJ ou CPF</Label>
              <div className="flex gap-2">
                <Input 
                  value={formData.cnpj_cpf} 
                  onChange={e => setFormData({...formData, cnpj_cpf: e.target.value})} 
                  placeholder="00.000.000/0000-00 ou 000.000.000-00" 
                  className="h-11 rounded-xl font-normal bg-gray-50/50 border border-gray-200 flex-1 text-sm focus-visible:ring-1 focus-visible:ring-gray-300" 
                />
                <Button type="button" onClick={buscarCNPJ} disabled={isSearchingCNPJ || !formData.cnpj_cpf} className="h-11 w-11 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 p-0 shrink-0 shadow-sm">
                  {isSearchingCNPJ ? <Loader2 size={16} className="animate-spin" /> : <Search size={16}/>}
                </Button>
              </div>
            </div>

            {/* Razão Social */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Razão Social</Label>
              <Input 
                value={formData.razao_social} 
                onChange={e => setFormData({...formData, razao_social: e.target.value})} 
                placeholder="Razão social da empresa" 
                className="h-11 rounded-xl font-normal bg-gray-50/50 border border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-gray-300" 
              />
            </div>

            {/* Nome Fantasia */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome Fantasia *</Label>
              <Input 
                required 
                value={formData.nome_fantasia} 
                onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} 
                placeholder="Ex: Embalaer, Ambev" 
                className="h-11 rounded-xl font-normal bg-gray-50/50 border border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-gray-300" 
              />
            </div>

            {/* Categoria Principal */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Categoria Principal</Label>
              <Select value={formData.categoria_principal} onValueChange={v => setFormData({...formData, categoria_principal: v})}>
                <SelectTrigger className="h-11 rounded-xl font-normal bg-white border border-gray-200 w-full text-sm focus:ring-1 focus:ring-gray-300 shadow-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  {CATEGORIAS_FORNECEDOR.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-sm cursor-pointer hover:bg-gray-50">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* WhatsApp */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">WhatsApp</Label>
              <Input 
                value={formData.telefone_whatsapp} 
                onChange={e => setFormData({...formData, telefone_whatsapp: e.target.value})} 
                placeholder="(11) 99999-9999" 
                className="h-11 rounded-xl font-normal bg-gray-50/50 border border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-gray-300" 
              />
            </div>

            {/* Prazo Pagamento Padrão */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Prazo de Pagamento Padrão (dias)</Label>
              <Input 
                type="number" 
                min="0" 
                value={formData.prazo_pagamento_dias} 
                onChange={e => setFormData({...formData, prazo_pagamento_dias: parseInt(e.target.value) || 0})} 
                placeholder="0" 
                className="h-11 rounded-xl font-normal bg-gray-50/50 border border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-gray-300" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* E-mail */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">E-mail</Label>
                <Input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="E-mail" 
                  className="h-11 rounded-xl font-normal bg-gray-50/50 border border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-gray-300" 
                />
              </div>

              {/* Nome do Contato */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome do Contato</Label>
                <Input 
                  value={formData.nome_contato} 
                  onChange={e => setFormData({...formData, nome_contato: e.target.value})} 
                  placeholder="Ex: João Silva" 
                  className="h-11 rounded-xl font-normal bg-gray-50/50 border border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-gray-300" 
                />
              </div>
            </div>

            {/* Mensagem Padrão */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Mensagem Padrão para Cotação</span>
              </Label>
              <Textarea 
                value={formData.mensagem_padrao_cotacao} 
                onChange={e => setFormData({...formData, mensagem_padrao_cotacao: e.target.value})} 
                className="min-h-[100px] rounded-xl font-normal bg-gray-50/50 border border-gray-200 text-sm resize-none focus-visible:ring-1 focus-visible:ring-gray-300" 
              />
              <p className="text-[10px] text-orange-600 font-medium mt-2 leading-tight">
                💡 <b>Dica:</b> Mantenha a palavra <b>{`{nome}`}</b> no texto. Na hora de enviar, o sistema vai trocá-la automaticamente pelo Nome do Contato. A lista de produtos é adicionada no fim.
              </p>
            </div>

            <DialogFooter className="pt-6 pb-2">
              <Button type="submit" disabled={!formData.nome_fantasia || isSubmitting} className="w-full h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm transition-colors">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Salvar Fornecedor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
