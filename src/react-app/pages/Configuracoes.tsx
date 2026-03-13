"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/react-app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/react-app/components/ui/card";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Badge } from "@/react-app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import {
  Settings,
  Save,
  Loader2,
  MessageCircle,
  DollarSign,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  Building,
  Cpu,
  Wallet,
  Eye,
  EyeOff,
} from "lucide-react";

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
  provedor_ia: "gemini" | "openai";
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

interface StripeUrlResponse {
  url?: string;
  error?: string;
}

interface PlanCardProps {
  title: string;
  price: string;
  current?: boolean;
  featured?: boolean;
  onSelect: () => void;
  loading?: boolean;
}

// ============== CONSTANTES ==============

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ativo: { label: "Ativo", color: "bg-green-100 text-green-800", icon: CheckCircle },
  teste_gratis: {
    label: "Teste Grátis",
    color: "bg-blue-100 text-blue-800",
    icon: Clock,
  },
  inadimplente: {
    label: "Inadimplente",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-gray-100 text-gray-800",
    icon: CheckCircle,
  },
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
  {
    id: "empresa",
    title: "Minha Empresa",
    description: "Dados cadastrais e limites financeiros",
    icon: Building,
    gradient: "from-blue-500 to-cyan-500",
    shadowColor: "shadow-blue-500/30",
    bgLight: "bg-blue-50",
  },
  {
    id: "ia",
    title: "Inteligência Artificial",
    description: "Configure Gemini ou OpenAI",
    icon: Cpu,
    gradient: "from-purple-500 to-pink-500",
    shadowColor: "shadow-purple-500/30",
    bgLight: "bg-purple-50",
  },
  {
    id: "openfinance",
    title: "Open Finance",
    description: "Conexão com bancos via Pluggy",
    icon: Zap,
    gradient: "from-emerald-500 to-teal-500",
    shadowColor: "shadow-emerald-500/30",
    bgLight: "bg-emerald-50",
  },
  {
    id: "assinatura",
    title: "Assinatura",
    description: "Planos e pagamentos",
    icon: Wallet,
    gradient: "from-orange-500 to-red-500",
    shadowColor: "shadow-orange-500/30",
    bgLight: "bg-orange-50",
  },
];

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams();
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
    limite_aprovacao_pagamento: "",
    limite_aprovacao_compra: "",
    whatsapp_admin: "",
    openai_api_key: "",
    gemini_api_key: "",
    provedor_ia: "gemini" as "gemini" | "openai",
    modelo_ia: "gemini-1.5-flash",
  });

  useEffect(() => {
    Promise.all([fetchConfig(), fetchAssinaturaStatus()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveSection(initialTab);
    }
  }, [initialTab]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/empresa-config");
      if (res.ok) {
        const data = (await res.json()) as EmpresaConfig;
        setConfig(data);
        setFormData({
          limite_aprovacao_pagamento: data.limite_aprovacao_pagamento?.toString() || "",
          limite_aprovacao_compra: data.limite_aprovacao_compra?.toString() || "",
          whatsapp_admin: data.whatsapp_admin || "",
          openai_api_key: data.openai_api_key || "",
          gemini_api_key: data.gemini_api_key || "",
          provedor_ia: data.provedor_ia || "gemini",
          modelo_ia: data.modelo_ia || "gemini-1.5-flash",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const fetchAssinaturaStatus = async () => {
    try {
      const res = await fetch("/api/assinatura/status");
      if (res.ok) {
        const data = (await res.json()) as AssinaturaStatus;
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
      const res = await fetch("/api/empresa-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limite_aprovacao_pagamento: formData.limite_aprovacao_pagamento
            ? parseFloat(formData.limite_aprovacao_pagamento)
            : null,
          limite_aprovacao_compra: formData.limite_aprovacao_compra
            ? parseFloat(formData.limite_aprovacao_compra)
            : null,
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
        alert("Erro ao salvar configurações");
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar configurações");
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

      const data = (await res.json()) as StripeUrlResponse;
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleGerenciar = async () => {
    setActionLoading("gerenciar");
    try {
      const res = await fetch("/api/stripe/portal");
      const data = (await res.json()) as StripeUrlResponse;
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const assinaturaConfig = assinaturaStatus
    ? STATUS_CONFIG[assinaturaStatus.status] || STATUS_CONFIG.teste_gratis
    : STATUS_CONFIG.teste_gratis;

  const diasRestantes = assinaturaStatus?.data_vencimento
    ? Math.ceil(
        (new Date(assinaturaStatus.data_vencimento).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const StatusIcon = assinaturaConfig.icon;

  const renderEmpresaContent = () => (
    <div className="space-y-4">
      {urlStatus === "success" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Configuração concluída com sucesso.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {saved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Alterações salvas com sucesso.</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-blue-600" />
            Dados Cadastrais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-3">
              <Label className="text-xs text-gray-500">Razão Social</Label>
              <p className="text-sm font-medium">{config?.razao_social || "-"}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <Label className="text-xs text-gray-500">Nome Fantasia</Label>
              <p className="text-sm font-medium">{config?.nome_fantasia || "-"}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
              <Label className="text-xs text-gray-500">CNPJ</Label>
              <p className="font-mono text-sm font-medium">{config?.cnpj || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-green-600" />
            Controle Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="limite">Limite para Aprovação de Pagamento (R$)</Label>
            <Input
              id="limite"
              type="number"
              step="0.01"
              value={formData.limite_aprovacao_pagamento}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  limite_aprovacao_pagamento: e.target.value,
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="limite_compra">Limite para Aprovação de Compra (R$)</Label>
            <Input
              id="limite_compra"
              type="number"
              step="0.01"
              value={formData.limite_aprovacao_compra}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  limite_aprovacao_compra: e.target.value,
                })
              }
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-green-600" />
            Notificações WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="whatsapp">WhatsApp do Administrador</Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="5511999999999"
            value={formData.whatsapp_admin}
            onChange={(e) =>
              setFormData({
                ...formData,
                whatsapp_admin: e.target.value,
              })
            }
            className="mt-1"
          />
        </CardContent>
      </Card>

      <Button
        onClick={handleSaveConfig}
        disabled={saving}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        {saving ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>
  );

  const renderIAContent = () => (
    <div className="space-y-4">
      {saved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Configurações de IA salvas com sucesso.</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Provedor de IA
          </CardTitle>
          <CardDescription>
            <span className="font-medium text-green-600">Gemini tem créditos grátis!</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  provedor_ia: "gemini",
                  modelo_ia: "gemini-1.5-flash",
                })
              }
              className={`flex flex-col gap-1 rounded-2xl border-2 p-4 text-left transition-all ${
                formData.provedor_ia === "gemini"
                  ? "border-purple-500 bg-white shadow-md"
                  : "border-purple-100 bg-white/50 opacity-60"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-lg">🌟</span>
                {formData.provedor_ia === "gemini" && (
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <span className="text-sm font-bold text-gray-800">Google Gemini</span>
              <span className="text-[9px] font-bold uppercase italic tracking-wider text-green-600">
                Econômico e Rápido
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  provedor_ia: "openai",
                  modelo_ia: "gpt-4o",
                })
              }
              className={`flex flex-col gap-1 rounded-2xl border-2 p-4 text-left transition-all ${
                formData.provedor_ia === "openai"
                  ? "border-purple-500 bg-white shadow-md"
                  : "border-purple-100 bg-white/50 opacity-60"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-lg">🤖</span>
                {formData.provedor_ia === "openai" && (
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <span className="text-sm font-bold text-gray-800">OpenAI (GPT-4)</span>
              <span className="text-[9px] font-bold uppercase italic tracking-wider text-gray-500">
                Maior Precisão
              </span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Modelo específico</Label>
              <Select
                value={formData.modelo_ia || ""}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, modelo_ia: value })
                }
              >
                <SelectTrigger className="mt-1 w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.provedor_ia === "gemini" ? (
                    <>
                      <SelectItem value="gemini-1.5-flash">
                        ⚡ Gemini 1.5 Flash (Ultrarrápido)
                      </SelectItem>
                      <SelectItem value="gemini-1.5-pro">
                        🚀 Gemini 1.5 Pro (Avançado)
                      </SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="gpt-4o-mini">
                        💚 GPT-4o Mini (Econômico)
                      </SelectItem>
                      <SelectItem value="gpt-4o">💜 GPT-4o (Recomendado)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center justify-between">
                Chave da API
                <a
                  href={
                    formData.provedor_ia === "gemini"
                      ? "https://aistudio.google.com/apikey"
                      : "https://platform.openai.com/api-keys"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] font-bold uppercase text-purple-600 hover:underline"
                >
                  Obter Chave
                  <ExternalLink size={10} />
                </a>
              </Label>

              <div className="relative mt-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={
                    formData.provedor_ia === "gemini"
                      ? formData.gemini_api_key || ""
                      : formData.openai_api_key || ""
                  }
                  onChange={(e) =>
                    formData.provedor_ia === "gemini"
                      ? setFormData({
                          ...formData,
                          gemini_api_key: e.target.value,
                        })
                      : setFormData({
                          ...formData,
                          openai_api_key: e.target.value,
                        })
                  }
                  className="bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSaveConfig}
        disabled={saving}
        className="h-12 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold uppercase italic tracking-widest text-white shadow-lg hover:from-purple-700 hover:to-pink-700"
      >
        {saving ? (
          <Loader2 className="mr-2 animate-spin" />
        ) : (
          <Sparkles className="mr-2" />
        )}
        Salvar Configurações IA
      </Button>
    </div>
  );

  const renderOpenFinanceContent = () => (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-emerald-600" />
          Open Finance via Pluggy
        </CardTitle>
        <CardDescription>
          Automatize a leitura de boletos conectando seus bancos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/open-finance">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
            Configurar Contas Bancárias
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  const renderAssinaturaContent = () => (
    <div className="space-y-4">
      <Card
        className={`border-2 ${assinaturaConfig.color
          .replace("bg-", "border-")
          .replace("100", "300")}`}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${assinaturaConfig.color}`}
              >
                <StatusIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {assinaturaStatus?.empresa_nome}
                </p>
                <Badge className={assinaturaConfig.color}>{assinaturaConfig.label}</Badge>
              </div>
            </div>

            {diasRestantes > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{diasRestantes}</p>
                <p className="text-[10px] font-bold uppercase italic text-gray-400">
                  dias restantes
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <PlanCard
          title="Plano Básico"
          price="49,90"
          current={assinaturaStatus?.plano === "basico"}
          onSelect={() => handleAssinar("basico")}
          loading={actionLoading === "assinar_basico"}
        />
        <PlanCard
          title="Plano Profissional"
          price="99,90"
          current={assinaturaStatus?.plano === "profissional"}
          featured
          onSelect={() => handleAssinar("profissional")}
          loading={actionLoading === "assinar_profissional"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recursos por plano</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-bold text-gray-800">Básico</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {RECURSOS_BASICO.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-bold text-gray-800">Profissional</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {RECURSOS_PROFISSIONAL.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {assinaturaStatus?.tem_assinatura && (
        <Button
          onClick={handleGerenciar}
          disabled={!!actionLoading}
          variant="outline"
          className="w-full"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Gerenciar Assinatura no Stripe
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-500">
      {activeSection ? (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveSection(null)}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft />
            </Button>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-gray-800">
              Configuração de {SECTIONS.find((s) => s.id === activeSection)?.title}
            </h1>
          </div>

          {activeSection === "empresa" && renderEmpresaContent()}
          {activeSection === "ia" && renderIAContent()}
          {activeSection === "openfinance" && renderOpenFinanceContent()}
          {activeSection === "assinatura" && renderAssinaturaContent()}
        </div>
      ) : (
        <>
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 rotate-3 items-center justify-center rounded-[22px] bg-orange-600 shadow-xl shadow-orange-500/20">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900">
              Configurações
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase italic tracking-widest text-gray-500">
              Gestão inteligente e motores de IA
            </p>
          </div>

          <div className="mx-auto grid max-w-lg grid-cols-2 gap-4">
            {SECTIONS.map((section) => {
              const SectionIcon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`${section.bgLight} group rounded-[35px] border-2 border-transparent p-6 text-left transition-all hover:border-white hover:shadow-2xl`}
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${section.gradient} shadow-lg transition-transform group-hover:scale-110`}
                  >
                    <SectionIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-black uppercase italic leading-none tracking-tighter text-gray-800">
                    {section.title}
                  </h3>
                  <p className="mt-2 text-[10px] font-bold uppercase italic leading-tight text-gray-500">
                    {section.description}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function PlanCard({
  title,
  price,
  current = false,
  featured = false,
  onSelect,
  loading = false,
}: PlanCardProps) {
  return (
    <Card className={`overflow-hidden rounded-[35px] ${featured ? "border-purple-400 shadow-xl" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle
            className={`text-lg font-black uppercase italic tracking-tighter ${
              featured ? "text-purple-700" : ""
            }`}
          >
            {title}
          </CardTitle>
          {current && <Badge className="bg-orange-100 text-orange-700">Atual</Badge>}
        </div>
        <p className="text-2xl font-black italic tracking-tighter">
          R$ {price}
          <span className="ml-1 text-xs font-bold uppercase text-gray-400">/mês</span>
        </p>
      </CardHeader>
      <CardContent>
        {!current && (
          <Button
            onClick={onSelect}
            disabled={loading}
            className={`h-12 w-full rounded-2xl text-[10px] font-black uppercase italic tracking-widest ${
              featured
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700"
                : ""
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Mudar para este plano"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}