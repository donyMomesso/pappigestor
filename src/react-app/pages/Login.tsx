import { useAuth } from "@getmocha/users-service/react";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/react-app/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";

const LOGO_URL = "https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png";

export default function LoginPage() {
  const { user, isPending, redirectToLogin } = useAuth();
  const { localUser, isLoading, error } = useAppAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (localUser) {
      navigate("/");
    }
  }, [localUser, navigate]);

  if (isPending || isLoading) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4 overflow-auto">
      <div className="w-full max-w-md my-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 sm:space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <img
              src={LOGO_URL}
              alt="Pappi Gestor"
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Pappi Gestor Inteligente</h1>
              <p className="text-gray-500 mt-1">Sistema de Gestão de Compras</p>
            </div>
          </div>

          {/* Erro de acesso */}
          {user && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Botão de login */}
          {!user && (
            <Button
              onClick={() => {
                // Limpar dados de cadastro antigos antes de fazer login
                sessionStorage.removeItem("cadastro_dados");
                redirectToLogin();
              }}
              className="w-full h-12 text-base bg-orange-600 hover:bg-orange-700"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Google
            </Button>
          )}

          {/* Usuário logado mas sem acesso */}
          {user && error && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Logado como: <span className="font-medium">{user.email}</span>
              </p>
              <Button
                variant="outline"
                onClick={() => fetch("/api/logout").then(() => window.location.reload())}
                className="w-full"
              >
                Sair e tentar outra conta
              </Button>
            </div>
          )}
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-500 text-sm">Ainda não tem conta?</p>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => navigate("/cadastro")}
          >
            <UserPlus className="w-4 h-4" />
            Criar conta grátis
          </Button>
        </div>
      </div>
    </div>
  );
}
