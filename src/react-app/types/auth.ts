// src/react-app/types/auth.ts

// ================================
// Tipos base do SaaS
// ================================

export type PlanoEmpresa = "gratis" | "basico" | "profissional" | "enterprise";

/**
 * NivelAcesso (roles do SaaS):
 * - dono: dono da empresa (manda em tudo)
 * - admin: admin interno (pode quase tudo, depende de permissões)
 * - financeiro: acesso a financeiro
 * - comprador: acesso a compras / cotações etc
 * - operador: usuário operacional
 * - viewer: só visualização
 */
export type NivelAcesso =
  | "dono"
  | "admin"
  | "financeiro"
  | "comprador"
  | "operador"
  | "viewer";

export type Feature =
  | "compras"
  | "recebimento"
  | "financeiro_basico"
  | "estoque"
  | "fornecedores"
  | "produtos"
  | "dashboard_basico"
  | "assessor_ia"
  | "caixa_entrada"
  | "cotacao"
  | "dda"
  | "dashboard_avancado"
  | "produtos_master";

// ================================
// Usuário local (front)
// ================================
export interface LocalUser {
  id: string;
  nome: string;
  email: string;

  // acesso
  nivel_acesso: NivelAcesso;

  // tenant
  empresa_id: string | null;
  nome_empresa: string;

  // plano
  plano: PlanoEmpresa;

  // extras
  permissoes?: string[]; // permissões finas (opcional)
  features?: Feature[];  // features liberadas (opcional)
  foto?: string;         // avatar (opcional)
}

// ================================
// Features disponíveis por plano
// ================================
export const PLANO_FEATURES: Record<PlanoEmpresa, Feature[]> = {
  gratis: [
    "compras",
    "recebimento",
    "financeiro_basico",
    "estoque",
    "fornecedores",
    "produtos",
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
    "assessor_ia",
    "caixa_entrada",
    "cotacao",
    "dda",
    "dashboard_avancado",
    "produtos_master",
  ],
  // enterprise: tudo do profissional (e pronto pra você expandir depois)
  enterprise: [
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
  ],
};

export const PREMIUM_FEATURES: Feature[] = [
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

export const NIVEL_LABELS: Record<NivelAcesso, string> = {
  dono: "Dono",
  admin: "Admin",
  financeiro: "Financeiro",
  comprador: "Comprador",
  operador: "Operador",
  viewer: "Visualizador",
};

// ================================
// AuthResponse (se você usa)
// ================================
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface AuthResponse {
  mochaUser: AuthUser;
  localUser: LocalUser | null;
  error?: string;
}
export const STATUS_LABELS: Record<string, string> = {
  teste_gratis: "Teste Grátis",
  ativo: "Ativo",
  inadimplente: "Inadimplente",
  cancelado: "Cancelado",
};