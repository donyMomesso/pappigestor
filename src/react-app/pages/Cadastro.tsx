import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Loader2, Building2, User, ArrowLeft, CheckCircle, Search } from "lucide-react";

const LOGO_URL = "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

type TipoPessoa = "pj" | "pf";

interface FormData {
  tipo_pessoa: TipoPessoa;
  razao_social: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  nome_responsavel: string;
  telefone: string;
}

export default function CadastroPage() {
  const { user, isPending, redirectToLogin } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<"form" | "google" | "processing" | "success">("form");
  const [formData, setFormData] = useState<FormData>({
    tipo_pessoa: "pj",
    razao_social: "",
    nome_fantasia: "",
    cnpj_cpf: "",
    nome_responsavel: "",
    telefone: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);

  // Formatar CNPJ: XX.XXX.XXX/XXXX-XX
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 14);
    return numbers
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  // Formatar CPF: XXX.XXX.XXX-XX
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  // Formatar telefone: (XX) XXXXX-XXXX
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleDocChange = (value: string) => {
    const formatted = formData.tipo_pessoa === "pj" ? formatCNPJ(value) : formatCPF(value);
    setFormData({ ...formData, cnpj_cpf: formatted });
  };

  const buscarCnpj = async () => {
    const cnpjNumbers = formData.cnpj_cpf.replace(/\D/g, "");
    
    if (cnpjNumbers.length !== 14) {
      setError("Digite um CNPJ válido com 14 dígitos");
      return;
    }

    setBuscandoCnpj(true);
    setError("");

    try {
      // Usando BrasilAPI - API pública e gratuita
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjNumbers}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("CNPJ não encontrado na Receita Federal");
        }
        throw new Error("Erro ao consultar CNPJ");
      }

      const data = await response.json();
      
      setFormData({
        ...formData,
        razao_social: data.razao_social || "",
        nome_fantasia: data.nome_fantasia || data.razao_social || "",
      });
    } catch (err: any) {
      setError(err.message || "Erro ao buscar CNPJ na Receita Federal");
    } finally {
      setBuscandoCnpj(false);
    }
  };

  const validateForm = (): boolean => {
    if (formData.tipo_pessoa === "pj") {
      if (!formData.razao_social.trim()) {
        setError("Razão Social é obrigatória");
        return false;
      }
      const cnpjNumbers = formData.cnpj_cpf.replace(/\D/g, "");
      if (cnpjNumbers.length !== 14) {
        setError("CNPJ deve ter 14 dígitos");
        return false;
      }
    } else {
      const cpfNumbers = formData.cnpj_cpf.replace(/\D/g, "");
      if (cpfNumbers.length !== 11) {
        setError("CPF deve ter 11 dígitos");
        return false;
      }
    }

    if (!formData.nome_fantasia.trim()) {
      setError("Nome Fantasia é obrigatório");
      return false;
    }

    if (!formData.nome_responsavel.trim()) {
      setError("Nome do Responsável é obrigatório");
      return false;
    }

    return true;
  };

  const handleContinueToGoogle = () => {
    setError("");
    if (!validateForm()) return;
    
    // Salvar dados no sessionStorage para recuperar após login Google
    sessionStorage.setItem("cadastro_dados", JSON.stringify(formData));
    setStep("google");
  };

  const handleGoogleLogin = () => {
    redirectToLogin();
  };

  // Quando o usuário volta do Google OAuth, processar o cadastro
  const processarCadastro = async () => {
    if (!user) return;
    
    setStep("processing");
    setIsSubmitting(true);
    setError("");

    const dadosSalvos = sessionStorage.getItem("cadastro_dados");
    if (!dadosSalvos) {
      setError("Dados do formulário não encontrados. Por favor, preencha novamente.");
      setStep("form");
      setIsSubmitting(false);
      return;
    }

    const dados: FormData = JSON.parse(dadosSalvos);

    try {
      const response = await fetch("/api/cadastro-publico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_pessoa: dados.tipo_pessoa,
          razao_social: dados.tipo_pessoa === "pj" ? dados.razao_social : dados.nome_responsavel,
          nome_fantasia: dados.nome_fantasia,
          cnpj_cpf: dados.cnpj_cpf.replace(/\D/g, ""),
          nome_responsavel: dados.nome_responsavel,
          telefone: dados.telefone.replace(/\D/g, ""),
          email: user.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar cadastro");
      }

      sessionStorage.removeItem("cadastro_dados");
      setStep("success");
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao processar cadastro");
      setStep("google");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se usuário está logado e veio do OAuth, processar cadastro
  if (user && step === "google" && !isSubmitting) {
    processarCadastro();
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-6 px-4 overflow-auto">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-4">
            <img src={LOGO_URL} alt="Pappi Gestor" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Criar Conta</h1>
              <p className="text-gray-500 mt-1">Cadastre sua empresa para começar</p>
            </div>
          </div>

          {/* Step: Formulário */}
          {step === "form" && (
            <div className="space-y-6">
              {/* Tipo de pessoa */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.tipo_pessoa === "pj" ? "default" : "outline"}
                  className={`text-xs sm:text-sm ${formData.tipo_pessoa === "pj" ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                  onClick={() => setFormData({ ...formData, tipo_pessoa: "pj", cnpj_cpf: "" })}
                >
                  <Building2 className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Pessoa Jurídica</span>
                </Button>
                <Button
                  type="button"
                  variant={formData.tipo_pessoa === "pf" ? "default" : "outline"}
                  className={`text-xs sm:text-sm ${formData.tipo_pessoa === "pf" ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                  onClick={() => setFormData({ ...formData, tipo_pessoa: "pf", cnpj_cpf: "" })}
                >
                  <User className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Pessoa Física</span>
                </Button>
              </div>

              {/* Campos PJ */}
              {formData.tipo_pessoa === "pj" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="razao_social">Razão Social *</Label>
                    <Input
                      id="razao_social"
                      value={formData.razao_social}
                      onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                      placeholder="Razão social da empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cnpj"
                        value={formData.cnpj_cpf}
                        onChange={(e) => handleDocChange(e.target.value)}
                        placeholder="00.000.000/0000-00"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={buscarCnpj}
                        disabled={buscandoCnpj || formData.cnpj_cpf.replace(/\D/g, "").length !== 14}
                        className="px-3 shrink-0"
                        title="Buscar dados na Receita Federal"
                      >
                        {buscandoCnpj ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Digite o CNPJ e clique na lupa para buscar dados automaticamente
                    </p>
                  </div>
                </>
              )}

              {/* Campos PF */}
              {formData.tipo_pessoa === "pf" && (
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cnpj_cpf}
                    onChange={(e) => handleDocChange(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              )}

              {/* Campos comuns */}
              <div className="space-y-2">
                <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
                <Input
                  id="nome_fantasia"
                  value={formData.nome_fantasia}
                  onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                  placeholder="Nome que aparecerá no sistema"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_responsavel">Nome do Responsável *</Label>
                <Input
                  id="nome_responsavel"
                  value={formData.nome_responsavel}
                  onChange={(e) => setFormData({ ...formData, nome_responsavel: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleContinueToGoogle}
                className="w-full h-12 bg-orange-600 hover:bg-orange-700"
              >
                Continuar
              </Button>

              <div className="text-center">
                <Button variant="link" onClick={() => navigate("/login")} className="text-gray-500">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Já tenho conta
                </Button>
              </div>
            </div>
          )}

          {/* Step: Login Google */}
          {step === "google" && (
            <div className="space-y-6">
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Empresa:</strong> {formData.nome_fantasia}<br />
                  <strong>Responsável:</strong> {formData.nome_responsavel}
                </p>
              </div>

              <p className="text-center text-gray-600">
                Agora faça login com sua conta Google para finalizar o cadastro
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleGoogleLogin}
                className="w-full h-12 bg-orange-600 hover:bg-orange-700"
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Entrar com Google
              </Button>

              <Button variant="outline" onClick={() => setStep("form")} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar e editar dados
              </Button>
            </div>
          )}

          {/* Step: Processing */}
          {step === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
              <p className="text-gray-600">Criando sua conta...</p>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">Cadastro realizado!</h2>
                <p className="text-gray-600 mt-2">Redirecionando para o sistema...</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Teste grátis por 14 dias • Sem compromisso
        </p>
      </div>
    </div>
  );
}
