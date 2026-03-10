"use client";

import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, Save, Loader2, MessageCircle, DollarSign, Building2, Check, Eye, EyeOff,
  CheckCircle, Clock, AlertTriangle, Crown, ExternalLink, ArrowLeft, ArrowRight, Sparkles, 
  Zap, Building, Cpu, Wallet, Bot
} from 'lucide-react';

// ============== INTERFACES ==============

interface EmpresaConfig {
  id: number;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  limite_aprovacao_pagamento: number | null;
  limite_aprovacao_compra: number | null;
  whatsapp_admin: string | null;
  openai_api_key: string | null;
  gemini_api_key: string | null;
  provedor_ia: 'gemini' | 'openai';
  modelo_ia: string | null;
}

interface AssinaturaStatus {
  empresa_nome: string;
  status: string;
  plano: string;
  limite_admins: number;
  limite_usuarios_total: number;
  usuarios_atuais: number;
  admins_atuais: number;
  data_vencimento: string | null;
  teste_expirado: boolean;
  tem_assinatura: boolean;
}

// ============== CONSTANTES ==============

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ativo: { label: "Ativo", color: "bg-green-100 text-green-800", icon: CheckCircle },
  teste_gratis: { label: "Teste Grátis", color: "bg-blue-100 text-blue-800", icon: Clock },
  inadimplente: { label: "Inadimplente", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
};

const RECURSOS_BASICO = [
  "Gestão completa de compras",
  "Recebimento de mercadorias",
  "Controle financeiro",
  "Controle de estoque",
  "Dashboard com totais",
];

const RECURSOS_PROFISSIONAL = [
  "Tudo do plano Básico",
  "Assessor IA para análises inteligentes",
  "Leitor de notas fiscais com IA",
  "Integração Open Finance (Pluggy)",
  "Dashboard avançado",
];

const SECTIONS = [
  { id: 'empresa', title: 'Minha Empresa', description: 'Dados cadastrais e limites financeiros', icon: Building, gradient: 'from-blue-500 to-cyan-500', shadowColor: 'shadow-blue-500/30', bgLight: 'bg-blue-50' },
  { id: 'ia', title: 'Inteligência Artificial', description: 'Configure Gemini ou OpenAI', icon: Cpu, gradient: 'from-purple-500 to-pink-500', shadowColor: 'shadow-purple-500/30', bgLight: 'bg-purple-50' },
  { id: 'openfinance', title: 'Open Finance', description: 'Conexão com bancos via Pluggy', icon: Zap, gradient: 'from-emerald-500 to-teal-500', shadowColor: 'shadow-emerald-500/30', bgLight: 'bg-emerald-50' },
  { id: 'assinatura', title: 'Assinatura', description: 'Planos e pagamentos', icon: Wallet, gradient: 'from-orange-500 to-red-500', shadowColor: 'shadow-orange-500/30', bgLight: 'bg-orange-50' },
];

export default function ConfiguracoesPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlStatus = searchParams.get("status");
  const initialTab = searchParams.get("tab") || null;
  
  const [activeSection, setActiveSection] = useState<string | null>(initialTab);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<EmpresaConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [assinaturaStatus, setAssinaturaStatus] = useState<AssinaturaStatus | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    limite_aprovacao_pagamento: '',
    limite_aprovacao_compra: '',
    whatsapp_admin: '',
    openai_api_key: '',
    gemini_api_key: '',
    provedor_ia: 'gemini' as 'gemini' | 'openai',
    modelo_ia: 'gemini-1.5-flash',
  });

  useEffect(() => {
    Promise.all([fetchConfig(), fetchAssinaturaStatus()])
      .finally(() => setLoading(false));
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/empresa-config');
      if (res.ok) {
        // Correção do erro 2345 e 18046: Definindo o tipo esperado do JSON
        const data = await res.json() as EmpresaConfig;
        setConfig(data);
        setFormData({
          limite_aprovacao_pagamento: data.limite_aprovacao_pagamento?.toString() || '',
          limite_aprovacao_compra: data.limite_aprovacao_compra?.toString() || '',
          whatsapp_admin: data.whatsapp_admin || '',
          openai_api_key: data.openai_api_key || '',
          gemini_api_key: data.gemini_api_key || '',
          provedor_ia: data.provedor_ia || 'gemini',
          modelo_ia: data.modelo_ia || 'gemini-1.5-flash',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const fetchAssinaturaStatus = async () => {
    try {
      const res = await fetch("/api/assinatura/status");
      if (res.ok) {
        // Correção do erro 2345: Definindo o tipo esperado do JSON
        const data = await res.json() as AssinaturaStatus;
        setAssinaturaStatus(data);
      }
    } catch (error) {
      console.error("Erro ao buscar status:", error);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/empresa-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limite_aprovacao_pagamento: formData.limite_aprovacao_pagamento ? parseFloat(formData.limite_aprovacao_pagamento) : null,
          limite_aprovacao_compra: formData.limite_aprovacao_compra ? parseFloat(formData.limite_aprovacao_compra) : null,
          whatsapp_admin: formData.whatsapp_admin || null,
          openai_api_key: formData.openai_api_key || null,
          gemini_api_key: formData.gemini_api_key || null,
          provedor_ia: formData.provedor_ia,
          modelo_ia: formData.modelo_ia,
        }),
      });
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Erro ao salvar configurações');
      }
    } catch (error) {
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleAssinar = async (plano: string) => {
    setActionLoading(`assinar_${plano}`);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano }),
      });
      // Correção do erro 18046: Tipando como 'any' ou criando uma interface rápida
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setActionLoading(null);
    }
  };

  const handleGerenciar = async () => {
    setActionLoading("gerenciar");
    try {
      const res = await fetch("/api/stripe/portal");
      // Correção do erro 18046: Tipando o retorno esperado
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const assinaturaConfig = assinaturaStatus ? STATUS_CONFIG[assinaturaStatus.status] || STATUS_CONFIG.teste_gratis : STATUS_CONFIG.teste_gratis;
  const diasRestantes = assinaturaStatus?.data_vencimento 
    ? Math.ceil((new Date(assinaturaStatus.data_vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // ============== RENDERIZADORES DE CONTEÚDO ==============

  const renderEmpresaContent = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /> Dados Cadastrais</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg"><Label className="text-xs text-gray-500">Razão Social</Label><p className="font-medium text-sm">{config?.razao_social || '-'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><Label className="text-xs text-gray-500">Nome Fantasia</Label><p className="font-medium text-sm">{config?.nome_fantasia || '-'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg sm:col-span-2"><Label className="text-xs text-gray-500">CNPJ</Label><p className="font-medium font-mono text-sm">{config?.cnpj || '-'}</p></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600" /> Controle Financeiro</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="limite">Limite para Aprovação de Pagamento (R$)</Label>
            <Input id="limite" type="number" step="0.01" value={formData.limite_aprovacao_pagamento} onChange={(e) => setFormData({ ...formData, limite_aprovacao_pagamento: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="limite_compra">Limite para Aprovação de Compra (R$)</Label>
            <Input id="limite_compra" type="number" step="0.01" value={formData.limite_aprovacao_compra} onChange={(e) => setFormData({ ...formData, limite_aprovacao_compra: e.target.value })} className="mt-1" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-600" /> Notificações WhatsApp</CardTitle></CardHeader>
        <CardContent>
          <Label htmlFor="whatsapp">WhatsApp do Administrador</Label>
          <Input id="whatsapp" type="tel" placeholder="5511999999999" value={formData.whatsapp_admin} onChange={(e) => setFormData({ ...formData, whatsapp_admin: e.target.value })} className="mt-1" />
        </CardContent>
      </Card>
      <Button onClick={handleSaveConfig} disabled={saving} className="w-full bg-orange-600 hover:bg-orange-700">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
        {saving ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </div>
  );

  const renderIAContent = () => (
    <div className="space-y-4">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" /> Provedor de IA</CardTitle>
          <CardDescription><span className="text-green-600 font-medium">Gemini tem créditos grátis!</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setFormData({ ...formData, provedor_ia: 'gemini', modelo_ia: 'gemini-1.5-flash' })}
              className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-1 ${formData.provedor_ia === 'gemini' ? 'border-purple-500 bg-white shadow-md' : 'border-purple-100 bg-white/50 opacity-60'}`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-lg">🌟</span>
                {formData.provedor_ia === 'gemini' && <CheckCircle className="w-5 h-5 text-purple-600" />}
              </div>
              <span className="font-bold text-gray-800 text-sm">Google Gemini</span>
              <span className="text-[9px] uppercase font-bold text-green-600 tracking-wider italic">Econômico e Rápido</span>
            </button>
            <button
              onClick={() => setFormData({ ...formData, provedor_ia: 'openai', modelo_ia: 'gpt-4o' })}
              className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-1 ${formData.provedor_ia === 'openai' ? 'border-purple-500 bg-white shadow-md' : 'border-purple-100 bg-white/50 opacity-60'}`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-lg">🤖</span>
                {formData.provedor_ia === 'openai' && <CheckCircle className="w-5 h-5 text-purple-600" />}
              </div>
              <span className="font-bold text-gray-800 text-sm">OpenAI (GPT-4)</span>
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider italic">Maior Precisão</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Modelo específico</Label>
              <Select value={formData.modelo_ia || ''} onValueChange={(value: string) => setFormData({ ...formData, modelo_ia: value })}>
                <SelectTrigger className="mt-1 w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.provedor_ia === 'gemini' ? (
                    <>
                      <SelectItem value="gemini-1.5-flash">⚡ Gemini 1.5 Flash (Ultrarrápido)</SelectItem>
                      <SelectItem value="gemini-1.5-pro">🚀 Gemini 1.5 Pro (Avançado)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="gpt-4o-mini">💚 GPT-4o Mini (Econômico)</SelectItem>
                      <SelectItem value="gpt-4o">💜 GPT-4o (Recomendado)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex justify-between items-center">
                Chave da API
                <a href={formData.provedor_ia === 'gemini' ? "https://aistudio.google.com/apikey" : "https://platform.openai.com/api-keys"} target="_blank" className="text-purple-600 text-[10px] uppercase font-bold hover:underline flex items-center gap-1">Obter Chave <ExternalLink size={10}/></a>
              </Label>
              <div className="relative mt-1">
                <Input type={showApiKey ? 'text' : 'password'} value={formData.provedor_ia === 'gemini' ? formData.gemini_api_key || '' : formData.openai_api_key || ''} onChange={(e) => formData.provedor_ia === 'gemini' ? setFormData({ ...formData, gemini_api_key: e.target.value }) : setFormData({ ...formData, openai_api_key: e.target.value })} className="pr-10 bg-white" />
                <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button onClick={handleSaveConfig} disabled={saving} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold italic uppercase tracking-widest h-12 rounded-2xl shadow-lg">
        {saving ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />} Salvar Configurações IA
      </Button>
    </div>
  );

  const renderOpenFinanceContent = () => (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-600" /> Open Finance via Pluggy</CardTitle>
        <CardDescription>Automatize a leitura de boletos conectando seus bancos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to="/open-finance">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Configurar Contas Bancárias <ArrowRight className="ml-2 w-4 h-4"/></Button>
        </Link>
      </CardContent>
    </Card>
  );

  const renderAssinaturaContent = () => (
    <div className="space-y-4">
      <Card className={`border-2 ${assinaturaConfig.color.replace('bg-', 'border-').replace('100', '300')}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${assinaturaConfig.color} flex items-center justify-center`}><assinaturaConfig.icon className="w-5 h-5" /></div>
              <div><p className="font-semibold text-gray-800">{assinaturaStatus?.empresa_nome}</p><Badge className={assinaturaConfig.color}>{assinaturaConfig.label}</Badge></div>
            </div>
            {diasRestantes > 0 && <div className="text-right"><p className="text-2xl font-bold text-orange-600">{diasRestantes}</p><p className="text-[10px] uppercase font-bold text-gray-400 italic">dias restantes</p></div>}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4">
        <PlanCard title="Plano Básico" price="49,90" current={assinaturaStatus?.plano === 'basico'} onSelect={() => handleAssinar('basico')} loading={actionLoading === 'assinar_basico'} />
        <PlanCard title="Plano Profissional" price="99,90" current={assinaturaStatus?.plano === 'profissional'} featured onSelect={() => handleAssinar('profissional')} loading={actionLoading === 'assinar_profissional'} />
      </div>
      {assinaturaStatus?.tem_assinatura && (
        <Button onClick={handleGerenciar} disabled={!!actionLoading} variant="outline" className="w-full"><ExternalLink className="w-4 h-4 mr-2" /> Gerenciar Assinatura no Stripe</Button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {activeSection ? (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveSection(null)} className="rounded-full hover:bg-gray-100"><ArrowLeft /></Button>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-gray-800">Configuração de {SECTIONS.find(s => s.id === activeSection)?.title}</h1>
          </div>
          {activeSection === 'empresa' && renderEmpresaContent()}
          {activeSection === 'ia' && renderIAContent()}
          {activeSection === 'openfinance' && renderOpenFinanceContent()}
          {activeSection === 'assinatura' && renderAssinaturaContent()}
        </div>
      ) : (
        <>
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-orange-600 rounded-[22px] flex items-center justify-center shadow-xl shadow-orange-500/20 mx-auto mb-4 rotate-3"><Settings className="w-8 h-8 text-white" /></div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Configurações</h1>
            <p className="text-gray-500 font-bold italic uppercase text-[10px] tracking-widest mt-1">Gestão inteligente e motores de IA</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            {SECTIONS.map((section) => (
              <button key={section.id} onClick={() => setActiveSection(section.id)} className={`${section.bgLight} p-6 rounded-[35px] border-2 border-transparent hover:border-white hover:shadow-2xl transition-all text-left group`}>
                <div className={`w-12 h-12 bg-gradient-to-br ${section.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}><section.icon className="w-6 h-6 text-white" /></div>
                <h3 className="font-black italic uppercase tracking-tighter text-gray-800 text-sm leading-none">{section.title}</h3>
                <p className="text-[10px] text-gray-500 mt-2 font-bold italic uppercase leading-tight">{section.description}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PlanCard({ title, price, current, featured, onSelect, loading }: any) {
  return (
    <Card className={`rounded-[35px] overflow-hidden ${featured ? 'border-purple-400 shadow-xl' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className={`text-lg font-black italic uppercase tracking-tighter ${featured ? 'text-purple-700' : ''}`}>{title}</CardTitle>
          {current && <Badge className="bg-orange-100 text-orange-700">Atual</Badge>}
        </div>
        <p className="text-2xl font-black italic tracking-tighter">R$ {price}<span className="text-xs font-bold text-gray-400 uppercase ml-1">/mês</span></p>
      </CardHeader>
      <CardContent>
        {!current && <Button onClick={onSelect} disabled={loading} className={`w-full rounded-2xl font-black italic uppercase text-[10px] tracking-widest h-12 ${featured ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20 shadow-lg' : ''}`}>{loading ? <Loader2 className="animate-spin" /> : 'Mudar para este plano'}</Button>}
      </CardContent>
    </Card>
  );
}
