"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useAppAuth } from "@/contexts/AppAuthContext";
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
  Search,
  Building,
  Plus,
  Brain,
  Wallet,
  Cpu,
  BadgeCheck,
} from "lucide-react";
import { Input } from "@/react-app/components/ui/input";

type EmpresaConfigResponse = {
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  limite_aprovacao_pagamento?: number | null;
  limite_aprovacao_compra?: number | null;
  whatsapp_admin?: string | null;
};

export default function ConfiguracoesPage() {
  const { localUser } = useAppAuth();

  const [activeTab, setActiveTab] = useState<
    "empresa" | "ia" | "dda" | "plano" | "seguranca"
  >("empresa");

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
      const res = await fetch("/api/empresa-config", {
        headers: { "x-pizzaria-id": pId },
      });

      if (res.ok) {
        const data = (await res.json()) as EmpresaConfigResponse;

        setEmpresaForm({
          razao_social: data.razao_social || "",
          nome_fantasia: data.nome_fantasia || "",
          cnpj: data.cnpj || "",
          limite_aprovacao_pagamento:
            data.limite_aprovacao_pagamento?.toString() || "",
          limite_aprovacao_compra:
            data.limite_aprovacao_compra?.toString() || "",
          whatsapp_admin: data.whatsapp_admin || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configurações da empresa:", error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const buscarCNPJ = async () => {
    const cnpjNumeros = empresaForm.cnpj.replace(/\D/g, "");

    if (cnpjNumeros.length !== 14) {
      alert("Por favor, digite um CNPJ válido com 14 números.");
      return;
    }

    setLoadingCnpj(true);

    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjNumeros}`,
      );

      if (!response.ok) {
        throw new Error("CNPJ não encontrado na Receita Federal");
      }

      const data = (await response.json()) as {
        razao_social?: string;
        nome_fantasia?: string;
      };

      setEmpresaForm((prev) => ({
        ...prev,
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia:
          data.nome_fantasia || data.razao_social || prev.nome_fantasia,
        cnpj: cnpjNumeros.replace(
          /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          "$1.$2.$3/$4-$5",
        ),
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
      const res = await fetch("/api/empresa-config", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-pizzaria-id": pId,
        },
        body: JSON.stringify({
          razao_social: empresaForm.razao_social || null,
          nome_fantasia: empresaForm.nome_fantasia || null,
          cnpj: empresaForm.cnpj || null,
          limite_aprovacao_pagamento: empresaForm.limite_aprovacao_pagamento
            ? parseFloat(empresaForm.limite_aprovacao_pagamento)
            : null,
          limite_aprovacao_compra: empresaForm.limite_aprovacao_compra
            ? parseFloat(empresaForm.limite_aprovacao_compra)
            : null,
          whatsapp_admin: empresaForm.whatsapp_admin || null,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("Erro ao salvar configurações da empresa");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <section className="rounded-[38px] bg-gradient-to-br from-gray-950 via-zinc-900 to-orange-950 text-white p-8 md:p-10 shadow-2xl overflow-hidden relative">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 mb-5">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300 italic">
                central de configurações
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
              Ajuste o cérebro do seu negócio
            </h1>

            <p className="mt-4 text-sm md:text-base text-zinc-300 max-w-2xl leading-relaxed">
              Organize dados da empresa, inteligência, integrações e assinatura
              em um só lugar.
            </p>

            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.22em] italic text-orange-200">
              {localUser?.nome_empresa || "Sua empresa"} • ambiente ativo
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <HeroMini label="Empresa" value="ativa" helper="dados centrais" />
            <HeroMini label="IA" value="pronta" helper="motor configurável" />
            <HeroMini label="Plano" value="pro" helper="evolução contínua" />
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 text-[220px] font-black italic text-white/5 leading-none pointer-events-none">
          P
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8">
        <div className="space-y-4">
          <ConfigTab
            active={activeTab === "empresa"}
            onClick={() => setActiveTab("empresa")}
            icon={<Building2 />}
            label="Dados da Empresa"
            desc="cadastro e limites"
          />
          <ConfigTab
            active={activeTab === "ia"}
            onClick={() => setActiveTab("ia")}
            icon={<Bot />}
            label="Inteligência Artificial"
            desc="tom e automações"
          />
          <ConfigTab
            active={activeTab === "dda"}
            onClick={() => setActiveTab("dda")}
            icon={<Database />}
            label="Open Finance & DDA"
            desc="conexões bancárias"
          />
          <ConfigTab
            active={activeTab === "plano"}
            onClick={() => setActiveTab("plano")}
            icon={<CreditCard />}
            label="Plano e Assinatura"
            desc="status e evolução"
          />
          <ConfigTab
            active={activeTab === "seguranca"}
            onClick={() => setActiveTab("seguranca")}
            icon={<ShieldCheck />}
            label="Segurança"
            desc="api e proteção"
          />
        </div>

        <div className="space-y-6">
          {activeTab === "empresa" && (
            <section className="bg-white rounded-[34px] border border-gray-100 shadow-sm p-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader
                icon={<Building2 size={22} />}
                iconWrap="bg-blue-100 text-blue-600"
                title="Dados da empresa"
                subtitle="Cadastro principal e limites operacionais"
              />

              <div className="space-y-6">
                <div className="rounded-[28px] border border-gray-100 bg-gray-50 p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400 italic mb-4">
                    identificação da empresa
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                        CNPJ
                      </label>

                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={empresaForm.cnpj}
                          onChange={(e) =>
                            setEmpresaForm({
                              ...empresaForm,
                              cnpj: e.target.value,
                            })
                          }
                          className="h-14 rounded-2xl bg-white border-gray-200 font-bold"
                          placeholder="Digite o CNPJ..."
                        />

                        <button
                          type="button"
                          onClick={buscarCNPJ}
                          disabled={loadingCnpj || !empresaForm.cnpj}
                          className="h-14 px-6 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loadingCnpj ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Search size={18} />
                          )}
                          Buscar
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                        Razão social
                      </label>
                      <Input
                        type="text"
                        value={empresaForm.razao_social}
                        onChange={(e) =>
                          setEmpresaForm({
                            ...empresaForm,
                            razao_social: e.target.value,
                          })
                        }
                        className="h-14 rounded-2xl bg-white border-gray-200 font-bold"
                        placeholder="Empresa LTDA"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                        Nome fantasia
                      </label>
                      <Input
                        type="text"
                        value={empresaForm.nome_fantasia}
                        onChange={(e) =>
                          setEmpresaForm({
                            ...empresaForm,
                            nome_fantasia: e.target.value,
                          })
                        }
                        className="h-14 rounded-2xl bg-white border-gray-200 font-bold"
                        placeholder="Minha pizzaria"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-gray-100 bg-white p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400 italic mb-4">
                    controles e notificações
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                        Limite para aprovação de pagamento (R$)
                      </label>
                      <Input
                        type="number"
                        value={empresaForm.limite_aprovacao_pagamento}
                        onChange={(e) =>
                          setEmpresaForm({
                            ...empresaForm,
                            limite_aprovacao_pagamento: e.target.value,
                          })
                        }
                        className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                        placeholder="Ex: 1000.00"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                        Limite para aprovação de compra (R$)
                      </label>
                      <Input
                        type="number"
                        value={empresaForm.limite_aprovacao_compra}
                        onChange={(e) =>
                          setEmpresaForm({
                            ...empresaForm,
                            limite_aprovacao_compra: e.target.value,
                          })
                        }
                        className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                        placeholder="Ex: 500.00"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                        WhatsApp do gerente (alertas)
                      </label>
                      <Input
                        type="tel"
                        value={empresaForm.whatsapp_admin}
                        onChange={(e) =>
                          setEmpresaForm({
                            ...empresaForm,
                            whatsapp_admin: e.target.value,
                          })
                        }
                        className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                        placeholder="5519999999999"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveEmpresa}
                  disabled={saving}
                  className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase italic text-xs tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : saved ? (
                    <Check size={18} className="text-green-400" />
                  ) : (
                    <Save size={18} />
                  )}
                  {saving
                    ? "Gravando..."
                    : saved
                      ? "Salvo com sucesso"
                      : "Salvar alterações"}
                </button>
              </div>
            </section>
          )}

          {activeTab === "ia" && (
            <section className="bg-white rounded-[34px] border border-gray-100 shadow-sm p-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader
                icon={<Brain size={22} />}
                iconWrap="bg-purple-100 text-purple-600"
                title="Inteligência artificial"
                subtitle="Ajustes do assessor e automações"
              />

              <div className="space-y-6">
                <div className="rounded-[28px] border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-500 italic mb-4">
                    motor inteligente
                  </p>

                  <div className="space-y-6">
                    <ToggleItem
                      title="Sugestão de compras automática"
                      desc="Notificar quando produtos atingirem o estoque crítico."
                      initialValue={true}
                    />
                    <ToggleItem
                      title="Análise de notas fiscais (OCR)"
                      desc="Extração automática de itens via XML e PDF."
                      initialValue={true}
                    />

                    <div className="pt-4 border-t border-purple-100">
                      <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-3">
                        Tom de voz da consultoria
                      </label>
                      <select className="w-full bg-white border border-purple-100 p-4 rounded-2xl outline-none font-bold text-gray-700">
                        <option>Executivo e analítico (padrão)</option>
                        <option>Direto e agressivo (foco em lucro)</option>
                        <option>Educativo (foco em processos)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <InfoCard
                  icon={<Cpu size={18} />}
                  title="IA pronta para crescer com a operação"
                  desc="Esses ajustes ajudam o sistema a orientar melhor compras, notas e rotinas."
                  tone="purple"
                />
              </div>
            </section>
          )}

          {activeTab === "dda" && (
            <section className="bg-white rounded-[34px] border border-gray-100 shadow-sm p-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader
                icon={<Database size={22} />}
                iconWrap="bg-green-100 text-green-600"
                title="Open Finance e DDA"
                subtitle="Conexão bancária e busca automática"
              />

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-[28px] p-8 text-center border border-gray-100">
                  <Building size={48} className="text-gray-300 mx-auto mb-4" />
                  <h4 className="font-black text-gray-900 uppercase italic mb-2">
                    Nenhum banco conectado
                  </h4>
                  <p className="text-sm text-gray-500 mb-6">
                    Conecte sua conta bancária via Open Finance para buscar boletos DDA automaticamente.
                  </p>

                  <button
                    onClick={() => {
                      window.location.href = "/app/open-finance";
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white h-14 px-8 rounded-2xl font-black uppercase italic text-xs tracking-widest transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 mx-auto"
                  >
                    <Plus size={18} />
                    Conectar nova conta
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                    configurações de sincronização
                  </p>

                  <ToggleItem
                    title="Sincronização automática"
                    desc="Buscar novos boletos DDA a cada 6 horas."
                    initialValue={true}
                  />
                  <ToggleItem
                    title="Auto-associação de notas"
                    desc="A IA tentará cruzar o boleto do banco com a nota fiscal importada."
                    initialValue={true}
                  />
                </div>
              </div>
            </section>
          )}

          {activeTab === "plano" && (
            <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[34px] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start gap-6">
                  <div>
                    <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.22em] mb-2">
                      status da conta
                    </p>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">
                      Plano Universal Pro
                    </h3>
                    <p className="text-gray-400 text-sm font-medium mt-2">
                      Acesso liberado aos principais módulos da operação.
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                    <Wallet className="text-orange-400" size={32} />
                  </div>
                </div>

                <div className="relative z-10 mt-10 flex items-center gap-4 flex-wrap">
                  <button className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-black text-xs uppercase hover:bg-orange-500 hover:text-white transition-all shadow-lg">
                    Gerenciar pagamento
                  </button>
                  <button className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest">
                    Ver notas fiscais
                  </button>
                </div>

                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
              </div>

              <InfoCard
                icon={<BadgeCheck size={18} />}
                title="Plano pronto para evoluir"
                desc="A entrada, a IA e as integrações ficam mais valiosas quando a configuração está bem alinhada."
                tone="orange"
              />
            </section>
          )}

          {activeTab === "seguranca" && (
            <section className="bg-white rounded-[34px] border border-gray-100 shadow-sm p-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader
                icon={<ShieldCheck size={22} />}
                iconWrap="bg-orange-100 text-orange-600"
                title="Segurança"
                subtitle="Proteção, chaves e estabilidade do ambiente"
              />

              <div className="space-y-4">
                <InfoCard
                  icon={<ShieldCheck size={18} />}
                  title="Ambiente isolado por empresa"
                  desc="A estrutura foi desenhada para manter seus dados organizados e separados por operação."
                  tone="orange"
                />
                <InfoCard
                  icon={<Sparkles size={18} />}
                  title="Chaves e integrações"
                  desc="As integrações devem ser configuradas com cuidado para manter o sistema estável."
                  tone="gray"
                />
              </div>
            </section>
          )}
        </div>
      </div>
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

function SectionHeader({
  icon,
  iconWrap,
  title,
  subtitle,
}: {
  icon: ReactNode;
  iconWrap: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className={`p-3 rounded-2xl ${iconWrap}`}>{icon}</div>
      <div>
        <h3 className="text-lg font-black italic text-gray-800 uppercase tracking-tighter leading-none">
          {title}
        </h3>
        <p className="text-xs text-gray-400 font-bold uppercase mt-1 text-[10px]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function ConfigTab({
  icon,
  label,
  desc,
  active = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  desc: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all duration-300 group text-left ${
        active
          ? "bg-gray-900 text-white shadow-xl translate-x-2"
          : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`${
            active ? "text-orange-500" : "text-gray-400 group-hover:text-orange-500"
          } transition-colors`}
        >
          {icon}
        </span>

        <div>
          <span className="block font-black text-xs italic uppercase tracking-tighter">
            {label}
          </span>
          <span
            className={`block text-[10px] uppercase tracking-[0.16em] font-bold mt-1 ${
              active ? "text-gray-300" : "text-gray-400"
            }`}
          >
            {desc}
          </span>
        </div>
      </div>

      <ChevronRight
        size={16}
        className={`${active ? "text-orange-500" : "text-gray-200"} transition-all`}
      />
    </button>
  );
}

function ToggleItem({
  title,
  desc,
  initialValue = false,
}: {
  title: string;
  desc: string;
  initialValue?: boolean;
}) {
  const [enabled, setEnabled] = useState(initialValue);

  return (
    <div className="flex items-center justify-between gap-6 p-2">
      <div className="flex-1">
        <h4 className="text-sm font-black text-gray-800 uppercase italic leading-none mb-1.5">
          {title}
        </h4>
        <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
          {desc}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`w-14 h-7 rounded-full relative transition-all duration-300 ${
          enabled
            ? "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            : "bg-gray-200"
        }`}
      >
        <div
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
            enabled ? "left-8" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  desc,
  tone,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  tone: "orange" | "purple" | "gray";
}) {
  const toneMap = {
    orange: "bg-orange-50 border-orange-100 text-orange-600",
    purple: "bg-purple-50 border-purple-100 text-purple-600",
    gray: "bg-gray-50 border-gray-100 text-gray-600",
  };

  return (
    <div className="rounded-[24px] border border-gray-100 bg-white p-5">
      <div className="flex items-start gap-4">
        <div
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${toneMap[tone]}`}
        >
          {icon}
        </div>

        <div>
          <h4 className="text-sm font-black italic uppercase tracking-tight text-gray-900">
            {title}
          </h4>
          <p className="text-sm text-gray-500 leading-relaxed mt-1">{desc}</p>
        </div>
      </div>
    </div>
  );
}