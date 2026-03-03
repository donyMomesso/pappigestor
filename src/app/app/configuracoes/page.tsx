"use client";

import { useState, useEffect } from "react";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { 
  Settings, 
  Sparkles, 
  CreditCard, 
  ShieldCheck, 
  Database, 
  Bot, 
  Zap,
  ChevronRight,
  Building2, 
  Save,
  Loader2,
  Check,
  Search
} from "lucide-react";
import { Input } from "@/react-app/components/ui/input";

export default function ConfiguracoesPage() {
  const { localUser } = useAppAuth();
  
  const [activeTab, setActiveTab] = useState("empresa");

  // ==========================================
  // LÓGICA DE DADOS DA EMPRESA (BANCO)
  // ==========================================
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  
  const [empresaForm, setEmpresaForm] = useState({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    limite_aprovacao_pagamento: "",
    limite_aprovacao_compra: "",
    whatsapp_admin: "",
  });

  const fetchConfig = async () => {
    const pId = localStorage.getItem("pId") || "";
    try {
      const res = await fetch('/api/empresa-config', {
        headers: { "x-pizzaria-id": pId }
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        setEmpresaForm({
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || '',
          cnpj: data.cnpj || '',
          limite_aprovacao_pagamento: data.limite_aprovacao_pagamento?.toString() || '',
          limite_aprovacao_compra: data.limite_aprovacao_compra?.toString() || '',
          whatsapp_admin: data.whatsapp_admin || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da empresa:', error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // ✅ BUSCA AUTOMÁTICA DE CNPJ (BrasilAPI)
  const buscarCNPJ = async () => {
    const cnpjNumeros = empresaForm.cnpj.replace(/\D/g, ''); // Remove pontuação
    
    if (cnpjNumeros.length !== 14) {
      alert("Por favor, digite um CNPJ válido com 14 números.");
      return;
    }

    setLoadingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjNumeros}`);
      
      if (!response.ok) {
        throw new Error("CNPJ não encontrado na Receita Federal");
      }
      
      // ✅ CORREÇÃO DO TYPESCRIPT AQUI: adicionado o "as any"
      const data = (await response.json()) as any;
      
      // Atualiza o form com os dados puxados da Receita
      setEmpresaForm(prev => ({
        ...prev,
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia: data.nome_fantasia || data.razao_social || prev.nome_fantasia,
        // Formata o CNPJ para ficar bonito (XX.XXX.XXX/XXXX-XX)
        cnpj: cnpjNumeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
      }));
      
    } catch (error: any) {
      console.error("Erro na busca de CNPJ:", error);
      alert(error.message || "Erro ao consultar CNPJ. Tente preencher manualmente.");
    } finally {
      setLoadingCnpj(false);
    }
  };

  const handleSaveEmpresa = async () => {
    setSaving(true);
    setSaved(false);
    const pId = localStorage.getItem("pId") || "";
    
    try {
      const res = await fetch('/api/empresa-config', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-pizzaria-id': pId 
        },
        body: JSON.stringify({
          razao_social: empresaForm.razao_social || null,
          nome_fantasia: empresaForm.nome_fantasia || null,
          cnpj: empresaForm.cnpj || null,
          limite_aprovacao_pagamento: empresaForm.limite_aprovacao_pagamento ? parseFloat(empresaForm.limite_aprovacao_pagamento) : null,
          limite_aprovacao_compra: empresaForm.limite_aprovacao_compra ? parseFloat(empresaForm.limite_aprovacao_compra) : null,
          whatsapp_admin: empresaForm.whatsapp_admin || null,
        }),
      });
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Erro ao salvar configurações da empresa');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro de conexão ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-gray-800 italic uppercase flex items-center gap-3">
          <Settings className="text-orange-500" size={32} />
          Configurações
        </h1>
        <p className="text-gray-500 font-medium italic text-sm">Ajustes do sistema, empresa, inteligência artificial e conta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="space-y-4">
          <ConfigTab 
            active={activeTab === "empresa"} 
            onClick={() => setActiveTab("empresa")}
            icon={<Building2 />} 
            label="Dados da Empresa" 
          />
          <ConfigTab 
            active={activeTab === "ia"} 
            onClick={() => setActiveTab("ia")}
            icon={<Bot />} 
            label="Inteligência Artificial" 
          />
          <ConfigTab 
            active={activeTab === "dda"} 
            onClick={() => setActiveTab("dda")}
            icon={<Database />} 
            label="Integração DDA & Banco" 
          />
          <ConfigTab 
            active={activeTab === "plano"} 
            onClick={() => setActiveTab("plano")}
            icon={<CreditCard />} 
            label="Plano e Assinatura" 
          />
          <ConfigTab 
            active={activeTab === "seguranca"} 
            onClick={() => setActiveTab("seguranca")}
            icon={<ShieldCheck />} 
            label="Segurança & API" 
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === "empresa" && (
            <section className="bg-white rounded-4xl border border-gray-100 shadow-sm p-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black italic text-gray-800 uppercase tracking-tighter leading-none">Minha Pizzaria</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase mt-1 text-[10px]">Informações e Limites Operacionais</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-[24px]">
                  
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">CNPJ</label>
                    <div className="flex gap-2">
                      <Input 
                        type="text" 
                        value={empresaForm.cnpj} 
                        onChange={(e) => setEmpresaForm({...empresaForm, cnpj: e.target.value})}
                        className="h-14 rounded-2xl bg-white border-gray-200 font-bold focus:ring-2 focus:ring-blue-500" 
                        placeholder="Digite o CNPJ..."
                      />
                      <button 
                        type="button"
                        onClick={buscarCNPJ}
                        disabled={loadingCnpj || !empresaForm.cnpj}
                        className="h-14 px-6 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loadingCnpj ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                        Buscar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Razão Social</label>
                    <Input 
                      type="text" 
                      value={empresaForm.razao_social} 
                      onChange={(e) => setEmpresaForm({...empresaForm, razao_social: e.target.value})}
                      className="h-14 rounded-2xl bg-white border-gray-200 font-bold focus:ring-2 focus:ring-blue-500" 
                      placeholder="Empresa LTDA"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nome Fantasia</label>
                    <Input 
                      type="text" 
                      value={empresaForm.nome_fantasia} 
                      onChange={(e) => setEmpresaForm({...empresaForm, nome_fantasia: e.target.value})}
                      className="h-14 rounded-2xl bg-white border-gray-200 font-bold focus:ring-2 focus:ring-blue-500" 
                      placeholder="Minha Pizzaria"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-black text-gray-800 uppercase italic mb-4">Controles e Notificações</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Limite para Aprovação de Pagamento (R$)</label>
                      <Input 
                        type="number" 
                        value={empresaForm.limite_aprovacao_pagamento} 
                        onChange={(e) => setEmpresaForm({...empresaForm, limite_aprovacao_pagamento: e.target.value})}
                        className="h-14 rounded-2xl bg-gray-50 border-none font-bold focus:ring-2 focus:ring-orange-500" 
                        placeholder="Ex: 1000.00"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Limite para Aprovação de Compra (R$)</label>
                      <Input 
                        type="number" 
                        value={empresaForm.limite_aprovacao_compra} 
                        onChange={(e) => setEmpresaForm({...empresaForm, limite_aprovacao_compra: e.target.value})}
                        className="h-14 rounded-2xl bg-gray-50 border-none font-bold focus:ring-2 focus:ring-orange-500" 
                        placeholder="Ex: 500.00"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">WhatsApp do Gerente (Alertas)</label>
                      <Input 
                        type="tel" 
                        value={empresaForm.whatsapp_admin} 
                        onChange={(e) => setEmpresaForm({...empresaForm, whatsapp_admin: e.target.value})}
                        className="h-14 rounded-2xl bg-gray-50 border-none font-bold focus:ring-2 focus:ring-orange-500" 
                        placeholder="5519999999999"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveEmpresa}
                  disabled={saving}
                  className="w-full h-14 mt-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase italic text-xs tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} className="text-green-400" /> : <Save size={18} />}
                  {saving ? 'Gravando...' : saved ? 'Salvo com Sucesso' : 'Salvar Alterações'}
                </button>
              </div>
            </section>
          )}

          {activeTab === "ia" && (
            <section className="bg-white rounded-4xl border border-gray-100 shadow-sm p-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black italic text-gray-800 uppercase tracking-tighter leading-none">Cérebro da IA</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase mt-1 text-[10px]">Ajustes do Assessor Estratégico</p>
                </div>
              </div>

              <div className="space-y-6">
                <ToggleItem 
                  title="Sugestão de Compras Automática" 
                  desc="Notificar quando produtos atingirem o estoque crítico."
                  initialValue={true}
                />
                <ToggleItem 
                  title="Análise de Notas Fiscais (OCR)" 
                  desc="Extração automática de itens via XML e PDF."
                  initialValue={true}
                />
                <div className="pt-4 border-t border-gray-50">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Tom de Voz da Consultoria</label>
                  <select className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-gray-700 appearance-none">
                    <option>Executivo e Analítico (Padrão)</option>
                    <option>Direto e Agressivo (Foco em Lucro)</option>
                    <option>Educativo (Foco em Processos)</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {activeTab === "plano" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-4xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Status da Conta</p>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">Plano Universal Pro</h3>
                    <p className="text-gray-400 text-sm font-medium mt-2">Acesso ilimitado a todos os módulos.</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                    <Zap className="text-orange-400" size={32} />
                  </div>
                </div>
                
                <div className="relative z-10 mt-10 flex items-center gap-4">
                  <button className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-black text-xs uppercase hover:bg-orange-500 hover:text-white transition-all shadow-lg">
                    Gerenciar Pagamento
                  </button>
                  <button className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest">
                    Ver Notas Fiscais
                  </button>
                </div>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>
              </section>
            </div>
          )}

          {activeTab !== "ia" && activeTab !== "plano" && activeTab !== "empresa" && (
            <div className="bg-white rounded-4xl border border-gray-100 p-20 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Settings size={32} />
              </div>
              <h3 className="text-gray-400 font-black italic uppercase">Módulo em Configuração</h3>
              <p className="text-gray-400 text-sm font-medium">Esta funcionalidade estará disponível na próxima atualização.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfigTab({ icon, label, active = false, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all duration-300 group ${
        active 
          ? 'bg-gray-900 text-white shadow-xl translate-x-2' 
          : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className={`${active ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-500'} transition-colors`}>
          {icon}
        </span>
        <span className="font-black text-xs italic uppercase tracking-tighter">{label}</span>
      </div>
      <ChevronRight size={16} className={`${active ? 'text-orange-500' : 'text-gray-200'} transition-all`} />
    </div>
  );
}

function ToggleItem({ title, desc, initialValue = false }: any) {
  const [enabled, setEnabled] = useState(initialValue);

  return (
    <div className="flex items-center justify-between gap-6 p-2">
      <div className="flex-1">
        <h4 className="text-sm font-black text-gray-800 uppercase italic leading-none mb-1.5">{title}</h4>
        <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{desc}</p>
      </div>
      <button 
        onClick={() => setEnabled(!enabled)}
        className={`w-14 h-7 rounded-full relative transition-all duration-300 ${enabled ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${enabled ? 'left-8' : 'left-1'}`}></div>
      </button>
    </div>
  );
}