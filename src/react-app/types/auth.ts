import type { MochaUser } from "@getmocha/users-service/shared";

export interface LocalUser {
  id: number;
  nome: string;
  email: string;
  empresa_id: number;
  nivel_acesso: 'operador' | 'comprador' | 'financeiro' | 'admin_empresa' | 'super_admin';
  is_ativo: number;
  empresa_nome?: string;
  empresa_status?: string;
  empresa_vencimento?: string;
  empresa_plano?: 'basico' | 'profissional';
}

// Features disponíveis por plano
export const PLANO_FEATURES: Record<string, string[]> = {
  basico: [
    'compras',
    'recebimento', 
    'financeiro_basico',
    'estoque',
    'fornecedores',
    'produtos',
    'dashboard_basico',
  ],
  profissional: [
    'compras',
    'recebimento',
    'financeiro_basico',
    'estoque',
    'fornecedores',
    'produtos',
    'dashboard_basico',
    // Features premium
    'assessor_ia',
    'caixa_entrada',
    'cotacao',
    'dda',
    'dashboard_avancado',
    'produtos_master',
  ],
};

export const PREMIUM_FEATURES = [
  'assessor_ia',
  'caixa_entrada', 
  'cotacao',
  'dda',
  'dashboard_avancado',
  'produtos_master',
];

export const PLANO_LABELS: Record<string, string> = {
  basico: 'Básico',
  profissional: 'Profissional',
};

export interface AuthResponse {
  mochaUser: MochaUser;
  localUser: LocalUser | null;
  error?: string;
}

export const NIVEL_LABELS: Record<string, string> = {
  operador: 'Operador',
  comprador: 'Comprador',
  financeiro: 'Financeiro',
  admin_empresa: 'Admin da Empresa',
  super_admin: 'Super Admin',
};

export const STATUS_LABELS: Record<string, string> = {
  teste_gratis: 'Teste Grátis',
  ativo: 'Ativo',
  inadimplente: 'Inadimplente',
  cancelado: 'Cancelado',
};
