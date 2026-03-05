// src/react-app/types/auth.ts

// Removido: @getmocha/users-service
// import type { MochaUser } from "@getmocha/users-service/shared";

// Tipo de usuário autenticado (substitui MochaUser)
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Roles (papéis) dentro de uma empresa
 * - dono: quem compra o app e controla tudo (inclui plano e equipe)
 * - admin: gerente (pode ter quase tudo, dependendo de permissões)
 * - comprador / financeiro / operador / viewer
 */
export type NivelAcesso =
  | "dono"
  | "admin"
  | "operador"
  | "comprador"
  | "financeiro"
  | "viewer";

/**
 * Planos do SaaS
 * Você pode ajustar depois, mas mantenha como string union pra evitar bagunça
 */
export type PlanoEmpresa = "gratis" | "basico" | "profissional" | "enterprise";

/**
 * Usuário local do app (SaaS multi-empresa)
 * ✅ 1 único tipo para o projeto inteiro
 */
export interface LocalUser {
  id: string;                 // sempre string (uuid do supabase)
  nome: string;
  email: string;

  empresa_id: string | null;  // empresa do usuário (não mistura empresas)
  nome_empresa: string;

  nivel_acesso: NivelAcesso;  // role

  plano: PlanoEmpresa;        // plano da empresa

  foto?: string;

  /**
   * Permissões granulares por usuário (seleção do dono)
   * Ex: ["compras", "estoque", "financeiro", "ia"]
   * - dono sempre tem tudo mesmo sem listar
   */
  permissoes?: string[];
}

/**
 * Features disponíveis por plano (o que a EMPRESA tem acesso)
 * Ajuste como quiser.
 */
export const PLANO_FEATURES: Record<PlanoEmpresa, string[]> = {
  gratis: [
    "estoque",
    "produtos",
    "fornecedores",
    "compras_basico",
    "dashboard_basico",
  ],
  basico: [
    "compras",
    "recebimento",
    "financeiro_basico",
    "estoque",
    "fornecedores",
    "produtos",
    "dashboard_basico",
  ],
  profissional: [
    "compras",
    "recebimento",
    "financeiro_basico",
    "estoque",
    "fornecedores",
    "produtos",
    "dashboard_basico",

    // Premium
    "assessor_ia",
    "caixa_entrada",
    "cotacao",
    "dda",
    "dashboard_avancado",
    "produtos_master",
  ],
  enterprise: [
    // Enterprise normalmente inclui tudo
    "compras",
    "recebimento",
    "financeiro_basico",
    "estoque",
    "fornecedores",
    "produtos",
    "dashboard_basico",
    "assessor_ia",
    "caixa_entrada",
    "cotacao",
    "dda",
    "dashboard_avancado",
    "produtos_master",
    "multi_filiais",
    "permissoes_avancadas",
    "integracoes",
  ],
};

export const PREMIUM_FEATURES = [
  "assessor_ia",
  "caixa_entrada",
  "cotacao",
  "dda",
  "dashboard_avancado",
  "produtos_master",
];

export const PLANO_LABELS: Record<PlanoEmpresa, string> = {
  gratis: "Grátis",
  basico: "Básico",
  profissional: "Profissional",
  enterprise: "Enterprise",
};

export interface AuthResponse {
  mochaUser: AuthUser;
  localUser: LocalUser | null;
  error?: string;
}

export const NIVEL_LABELS: Record<NivelAcesso, string> = {
  dono: "Dono",
  admin: "Admin",
  operador: "Operador",
  comprador: "Comprador",
  financeiro: "Financeiro",
  viewer: "Visualizador",
};

export const STATUS_LABELS: Record<string, string> = {
  teste_gratis: "Teste Grátis",
  ativo: "Ativo",
  inadimplente: "Inadimplente",
  cancelado: "Cancelado",
};