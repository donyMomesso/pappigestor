create table if not exists public.empresa_config (
  empresa_id text primary key,
  limite_aprovacao_pagamento numeric not null default 1000,
  whatsapp_admin text,
  updated_at timestamptz not null default now()
);

create table if not exists public.notas_fiscais_recebidas (
  id uuid primary key default gen_random_uuid(),
  empresa_id text not null,
  lancamento_id uuid null,
  boleto_dda_id uuid null,
  fornecedor text null,
  numero_nota text not null,
  data_emissao date null,
  chave_acesso text null,
  valor_total numeric null,
  arquivo_url text null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.boletos_dda add column if not exists arquivo_url text null;
alter table public.boletos_dda add column if not exists cnpj_cedente text null;
alter table public.boletos_dda add column if not exists nota_fiscal_id uuid null;
alter table public.boletos_dda add column if not exists lancamento_id uuid null;

alter table public.lancamentos add column if not exists linha_digitavel text null;
alter table public.lancamentos add column if not exists codigo_barras text null;
alter table public.lancamentos add column if not exists arquivo_url_boleto text null;
alter table public.lancamentos add column if not exists boleto_dda_id uuid null;
alter table public.lancamentos add column if not exists nota_fiscal_id uuid null;
