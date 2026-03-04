"use client";

import { ReactNode, useState, useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { useAppAuth } from "@/react-app/contexts/AppAuthContext";
import { Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  skipSubscriptionCheck?: boolean;
}

const DICAS_GESTAO = [
  "O Assessor IA reduz desperdícios em até 15% analisando seu histórico.",
  "Lançar notas pelo Scanner HD economiza 20 minutos por dia.",
  "Pizzarias que controlam o estoque diário lucram 10% mais.",
  "A proatividade da IA ajuda a evitar compras de última hora.",
  "Sincronizar o DDA evita multas e juros por esquecimento."
];

export default function ProtectedRoute({ children, allowedRoles, skipSubscriptionCheck }: ProtectedRouteProps) {
  const { user, isPending: authPending } = useAuth();
  const { localUser, isLoading: appLoading, error, hasPermission, isSubscriptionExpired } = useAppAuth();
  const [dicaIndex, setDicaIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDicaIndex((prev) => (prev + 1) % DICAS_GESTAO.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  if (authPending || appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="flex flex-col items-center gap-6 max-w-xs text-center px-4">
          <div className="relative">
            <div className="p-5 bg-white rounded-[30px] shadow-2xl shadow-orange-200/50">
              <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-2">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-800/40 italic">Validando Acesso</p>
             <p className="text-sm font-bold text-gray-700 italic">"{DICAS_GESTAO[dicaIndex]}"</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !localUser || error) return <Navigate to="/login" replace />;

  if (!skipSubscriptionCheck && isSubscriptionExpired()) {
    return <Navigate to="/configuracoes?tab=assinatura" replace />;
  }

  if (allowedRoles && !hasPermission(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="bg-white rounded-[40px] p-10 max-w-md text-center shadow-2xl">
          <h2 className="text-2xl font-black italic text-gray-900 uppercase tracking-tighter mb-4">Acesso Negado</h2>
          <p className="text-gray-500 text-sm mb-8">Seu nível de acesso não permite ver esta página.</p>
          <Button onClick={() => window.history.back()} className="w-full bg-gray-900 text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest">
            Voltar Agora
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}