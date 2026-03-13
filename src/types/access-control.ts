import type { Feature, NivelAcesso, PlanoEmpresa } from "@/types/auth";

export type AssinaturaStatus =
  | "teste_gratis"
  | "ativa"
  | "vencida"
  | "cancelada"
  | "bloqueada"
  | "inadimplente";

export interface PlanoLimites {
  usuariosTotal: number;
  admins: number;
  filiais: number;
}

export interface TrialInfo {
  startedAt: string | null;
  endsAt: string | null;
  remainingDays: number;
  expired: boolean;
}

export interface ReferralWalletInfo {
  referralCode: string | null;
  creditBalanceCents: number;
  creditEarnedCents: number;
  totalReferrals: number;
}

export interface AppSessionPayload {
  user: {
    id: string;
    nome: string;
    email: string;
    foto?: string;
  };
  membership: {
    empresaUsuarioId: string | null;
    role: NivelAcesso;
    status: "ativo" | "convidado" | "inativo" | "removido";
  };
  empresaAtual: {
    id: string | null;
    nome: string;
    plano: PlanoEmpresa;
    status: string;
    statusAssinatura: AssinaturaStatus;
    trialEndsAt: string | null;
    assinaturaExpiresAt: string | null;
    limites: PlanoLimites;
    features: Feature[];
    recebimentoBloqueado: boolean;
  };
  trial: TrialInfo;
  referralWallet: ReferralWalletInfo;
}
