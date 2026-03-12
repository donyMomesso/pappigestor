import { useAppAuthOptional } from "@/contexts/AppAuthContext";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";

interface ConviteInfo {
  email: string;
  nivel_acesso: string;
  empresa_nome: string;
}

const NIVEL_LABELS: Record<string, string> = {
  operador: "Operador",
  comprador: "Comprador",
  financeiro: "Financeiro",
  admin_empresa: "Administrador",
  super_admin: "Super Admin",
};

export default function AceitarConvitePage() {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const auth = useAppAuthOptional(); // mantém o hook, mesmo se não usar tudo

  const [isLoading, setIsLoading] = useState(true);
  const [convite, setConvite] = useState<ConviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const verificarConvite = async () => {
      try {
        if (!token) {
          setError("Token inválido");
          setIsLoading(false);
          return;
        }

        const res = await fetch(`/api/convites/verificar/${token}`);

        if (res.ok) {
          const data = await res.json();
          setConvite(data);

          // Salvar token no sessionStorage para usar após login
          sessionStorage.setItem("convite_token", token);
        } else {
          const data = await res.json();
          setError(data.error || "Convite inválido");
        }
      } catch (err) {
        setError("Erro ao verificar convite");
      } finally {
        setIsLoading(false);
      }
    };

    verificarConvite();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setIsAccepting(true);

    // Primeiro tenta aceitar (caso já esteja logado)
    try {
      const res = await fetch(`/api/convites/aceitar/${token}`, {
        method: "POST",
      });

      if (res.ok) {
        setAccepted(true);
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // ignore
      }

      if (res.status === 401) {
        // Não autenticado - redirecionar para login
        navigate("/login");
        return;
      }

      if (data.alreadyExists) {
        // Usuário já existe - redirecionar
        navigate("/");
        return;
      }

      setError(data.error || "Erro ao aceitar convite");
    } catch (err) {
      // Provavelmente não autenticado
      navigate("/login");
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Verificando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Convite Inválido</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate("/login")} className="bg-orange-600 hover:bg-orange-700">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Convite Aceito!</h1>
            <p className="text-gray-600">Redirecionando para o sistema...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Você foi convidado!</h1>
            <p className="text-gray-600">
              Para fazer parte de <strong>{convite?.empresa_nome}</strong>
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium">{convite?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Função:</span>
              <span className="font-medium text-orange-600">
                {NIVEL_LABELS[convite?.nivel_acesso || ""] || convite?.nivel_acesso}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500 text-center mb-6">
            Ao aceitar, você fará login com sua conta Google ({convite?.email})
            e terá acesso ao sistema com as permissões definidas.
          </p>

          <Button
            onClick={handleAccept}
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              "Aceitar Convite e Entrar com Google"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}