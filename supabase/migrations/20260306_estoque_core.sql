-- =========================================================
-- PAPPI GESTOR
-- MÓDULO: ESTOQUE
-- ARQUITETURA OFICIAL - CONTROLE DE UNHA DE FERRO
-- =========================================================

begin;

-- =========================================================
-- EXTENSÕES
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- UPDATED_AT TRIGGER HELPER
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- ENUMS
-- =========================================================
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'estoque_movimentacao_tipo'
  ) then
    create type public.estoque_movimentacao_tipo as enum (
      'entrada_compra',
      'entrada_manual',
      'saida_producao',
      'ajuste_inventario',
      'perda',
      'transferencia_entrada',
      'transferencia_saida'
    );
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'estoque_origem_tipo'
  ) then
    create type public.estoque_origem_tipo as enum (
      'compra',
      'recebimento',
      'inventario',
      'producao',
      'manual',
      'transferencia',
      'integracao'
    );
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'estoque_status_validade'
  ) then
    create type public.estoque_status_validade as enum (
      'ok',
      'vencendo',
      'vencido',
      'sem_validade'
    );
  end if;
end$$;

-- =========================================================
-- TABELA: estoque_itens
-- NÃO GUARDA SALDO
-- GUARDA REGRAS OPERACIONAIS DO ITEM
-- =========================================================
create table if not exists public.estoque_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  produto_id bigint not null,

  estoque_minimo numeric(14,3) not null default 0,
  estoque_maximo numeric(14,3),
  ponto_reposicao numeric(14,3),

  fornecedor_padrao_id uuid,
  unidade_medida text,
  ativo boolean not null default true,
  observacao text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint estoque_itens_estoque_minimo_check check (estoque_minimo >= 0),
  constraint estoque_itens_estoque_maximo_check check (estoque_maximo is null or estoque_maximo >= 0),
  constraint estoque_itens_ponto_reposicao_check check (ponto_reposicao is null or ponto_reposicao >= 0),
  constraint estoque_itens_empresa_produto_unique unique (empresa_id, produto_id)
);

drop trigger if exists trg_estoque_itens_updated_at on public.estoque_itens;
create trigger trg_estoque_itens_updated_at
before update on public.estoque_itens
for each row
execute function public.set_updated_at();

create index if not exists idx_estoque_itens_empresa on public.estoque_itens (empresa_id);
create index if not exists idx_estoque_itens_produto on public.estoque_itens (produto_id);
create index if not exists idx_estoque_itens_ativo on public.estoque_itens (empresa_id, ativo);

-- =========================================================
-- TABELA: estoque_movimentacoes
-- HISTÓRICO OFICIAL E IMUTÁVEL
-- =========================================================
create table if not exists public.estoque_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  produto_id bigint not null,

  tipo public.estoque_movimentacao_tipo not null,
  origem public.estoque_origem_tipo not null default 'manual',

  -- QUANTIDADE SEMPRE POSITIVA
  quantidade numeric(14,3) not null,
  unidade_medida text,

  -- CUSTO DAQUELA MOVIMENTAÇÃO
  custo_unitario numeric(14,4),
  custo_total numeric(14,4),

  -- RASTREABILIDADE
  referencia_tabela text,
  referencia_id text,
  documento_numero text,
  observacao text,
  justificativa text,

  -- LOTE / VALIDADE
  lote text,
  data_validade date,

  -- DADOS DE EMBALAGEM
  quantidade_caixas integer,
  unidades_por_caixa integer,

  -- INVENTÁRIO
  quantidade_sistema_antes numeric(14,3),
  quantidade_real_contada numeric(14,3),
  diferenca_inventario numeric(14,3),

  -- CONTEXTO
  usuario_id uuid,
  created_at timestamptz not null default now(),

  constraint estoque_movimentacoes_quantidade_check check (quantidade > 0),
  constraint estoque_movimentacoes_custo_unitario_check check (custo_unitario is null or custo_unitario >= 0),
  constraint estoque_movimentacoes_custo_total_check check (custo_total is null or custo_total >= 0),
  constraint estoque_movimentacoes_quantidade_caixas_check check (quantidade_caixas is null or quantidade_caixas >= 0),
  constraint estoque_movimentacoes_unidades_por_caixa_check check (unidades_por_caixa is null or unidades_por_caixa > 0)
);

create index if not exists idx_estoque_mov_empresa on public.estoque_movimentacoes (empresa_id, created_at desc);
create index if not exists idx_estoque_mov_produto on public.estoque_movimentacoes (produto_id, created_at desc);
create index if not exists idx_estoque_mov_empresa_produto on public.estoque_movimentacoes (empresa_id, produto_id, created_at desc);
create index if not exists idx_estoque_mov_tipo on public.estoque_movimentacoes (tipo);
create index if not exists idx_estoque_mov_referencia on public.estoque_movimentacoes (referencia_tabela, referencia_id);

-- =========================================================
-- FUNÇÃO DE SINAL DA MOVIMENTAÇÃO
-- ENTRADAS = +1
-- SAÍDAS = -1
-- =========================================================
create or replace function public.fn_estoque_mov_sinal(p_tipo public.estoque_movimentacao_tipo)
returns integer
language sql
immutable
as $$
  select case
    when p_tipo in ('entrada_compra', 'entrada_manual', 'transferencia_entrada') then 1
    when p_tipo in ('saida_producao', 'perda', 'transferencia_saida') then -1
    when p_tipo = 'ajuste_inventario' then 1
    else 0
  end;
$$;

-- =========================================================
-- VIEW: SALDO CONSOLIDADO POR PRODUTO
-- AJUSTE DE INVENTÁRIO USA O CAMPO DIFERENCA_INVENTARIO
-- =========================================================
create or replace view public.vw_estoque_saldos as
select
  m.empresa_id,
  m.produto_id,
  round(sum(
    case
      when m.tipo = 'ajuste_inventario' then coalesce(m.diferenca_inventario, m.quantidade)
      when m.tipo in ('entrada_compra', 'entrada_manual', 'transferencia_entrada') then m.quantidade
      when m.tipo in ('saida_producao', 'perda', 'transferencia_saida') then -m.quantidade
      else 0
    end
  ), 3) as saldo_atual,

  round(sum(
    case
      when m.tipo in ('entrada_compra', 'entrada_manual', 'transferencia_entrada')
        then coalesce(m.custo_total, coalesce(m.custo_unitario, 0) * m.quantidade)
      else 0
    end
  ), 4) as total_entradas_valor,

  round(sum(
    case
      when m.tipo in ('entrada_compra', 'entrada_manual', 'transferencia_entrada')
        then m.quantidade
      else 0
    end
  ), 3) as total_entradas_qtd,

  max(m.created_at) as ultima_movimentacao_em
from public.estoque_movimentacoes m
group by m.empresa_id, m.produto_id;

-- =========================================================
-- VIEW: CUSTO MÉDIO POR PRODUTO
-- BASEADO NAS ENTRADAS
-- =========================================================
create or replace view public.vw_estoque_custo_medio as
select
  empresa_id,
  produto_id,
  case
    when total_entradas_qtd > 0
      then round(total_entradas_valor / total_entradas_qtd, 4)
    else 0
  end as custo_medio
from public.vw_estoque_saldos;

-- =========================================================
-- VIEW: POSIÇÃO GERAL DO ESTOQUE
-- =========================================================
create or replace view public.vw_estoque_posicao as
select
  ei.id as estoque_item_id,
  ei.empresa_id,
  ei.produto_id,
  ei.estoque_minimo,
  ei.estoque_maximo,
  ei.ponto_reposicao,
  ei.fornecedor_padrao_id,
  ei.unidade_medida,
  ei.ativo,
  ei.observacao,

  coalesce(vs.saldo_atual, 0) as saldo_atual,
  coalesce(vcm.custo_medio, 0) as custo_medio,
  round(coalesce(vs.saldo_atual, 0) * coalesce(vcm.custo_medio, 0), 4) as valor_estoque,

  case
    when coalesce(vs.saldo_atual, 0) <= ei.estoque_minimo then true
    else false
  end as abaixo_minimo,

  case
    when ei.ponto_reposicao is not null and coalesce(vs.saldo_atual, 0) <= ei.ponto_reposicao then true
    else false
  end as abaixo_ponto_reposicao,

  vs.ultima_movimentacao_em,

  ei.created_at,
  ei.updated_at
from public.estoque_itens ei
left join public.vw_estoque_saldos vs
  on vs.empresa_id = ei.empresa_id
 and vs.produto_id = ei.produto_id
left join public.vw_estoque_custo_medio vcm
  on vcm.empresa_id = ei.empresa_id
 and vcm.produto_id = ei.produto_id;

-- =========================================================
-- VIEW: STATUS DE VALIDADE POR MOVIMENTAÇÃO
-- =========================================================
create or replace view public.vw_estoque_validade as
select
  m.id,
  m.empresa_id,
  m.produto_id,
  m.lote,
  m.data_validade,
  case
    when m.data_validade is null then 'sem_validade'::public.estoque_status_validade
    when m.data_validade < current_date then 'vencido'::public.estoque_status_validade
    when m.data_validade <= current_date + 7 then 'vencendo'::public.estoque_status_validade
    else 'ok'::public.estoque_status_validade
  end as status_validade,
  m.created_at
from public.estoque_movimentacoes m
where m.data_validade is not null;

-- =========================================================
-- FUNÇÃO: CONSULTAR SALDO ATUAL
-- =========================================================
create or replace function public.fn_estoque_saldo_atual(
  p_empresa_id uuid,
  p_produto_id bigint
)
returns numeric
language sql
stable
as $$
  select coalesce((
    select saldo_atual
    from public.vw_estoque_saldos
    where empresa_id = p_empresa_id
      and produto_id = p_produto_id
  ), 0);
$$;

-- =========================================================
-- FUNÇÃO: REGISTRAR MOVIMENTAÇÃO
-- REGRA: NUNCA GRAVA SALDO, SÓ MOVIMENTAÇÃO
-- =========================================================
create or replace function public.fn_registrar_movimentacao_estoque(
  p_empresa_id uuid,
  p_produto_id bigint,
  p_tipo public.estoque_movimentacao_tipo,
  p_origem public.estoque_origem_tipo,
  p_quantidade numeric,
  p_unidade_medida text default null,
  p_custo_unitario numeric default null,
  p_referencia_tabela text default null,
  p_referencia_id text default null,
  p_documento_numero text default null,
  p_observacao text default null,
  p_justificativa text default null,
  p_lote text default null,
  p_data_validade date default null,
  p_quantidade_caixas integer default null,
  p_unidades_por_caixa integer default null,
  p_usuario_id uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
  v_saldo_atual numeric;
  v_custo_total numeric;
begin
  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'Quantidade inválida para movimentação de estoque.';
  end if;

  v_saldo_atual := public.fn_estoque_saldo_atual(p_empresa_id, p_produto_id);

  -- BLOQUEIO DE SALDO NEGATIVO PARA SAÍDAS
  if p_tipo in ('saida_producao', 'perda', 'transferencia_saida') then
    if v_saldo_atual - p_quantidade < 0 then
      raise exception 'Estoque insuficiente. Saldo atual: %, saída solicitada: %', v_saldo_atual, p_quantidade;
    end if;
  end if;

  if p_custo_unitario is not null then
    v_custo_total := round(p_custo_unitario * p_quantidade, 4);
  else
    v_custo_total := null;
  end if;

  insert into public.estoque_movimentacoes (
    empresa_id,
    produto_id,
    tipo,
    origem,
    quantidade,
    unidade_medida,
    custo_unitario,
    custo_total,
    referencia_tabela,
    referencia_id,
    documento_numero,
    observacao,
    justificativa,
    lote,
    data_validade,
    quantidade_caixas,
    unidades_por_caixa,
    usuario_id
  ) values (
    p_empresa_id,
    p_produto_id,
    p_tipo,
    p_origem,
    p_quantidade,
    p_unidade_medida,
    p_custo_unitario,
    v_custo_total,
    p_referencia_tabela,
    p_referencia_id,
    p_documento_numero,
    p_observacao,
    p_justificativa,
    p_lote,
    p_data_validade,
    p_quantidade_caixas,
    p_unidades_por_caixa,
    p_usuario_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- =========================================================
-- FUNÇÃO: AJUSTE DE INVENTÁRIO
-- AQUI A QUANTIDADE REGISTRADA É A DIFERENÇA
-- =========================================================
create or replace function public.fn_ajustar_inventario_estoque(
  p_empresa_id uuid,
  p_produto_id bigint,
  p_quantidade_real numeric,
  p_observacao text default 'Ajuste de inventário',
  p_justificativa text default null,
  p_usuario_id uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
  v_saldo_sistema numeric;
  v_diferenca numeric;
begin
  if p_quantidade_real is null or p_quantidade_real < 0 then
    raise exception 'Quantidade real inválida.';
  end if;

  v_saldo_sistema := public.fn_estoque_saldo_atual(p_empresa_id, p_produto_id);
  v_diferenca := p_quantidade_real - v_saldo_sistema;

  if v_diferenca = 0 then
    raise exception 'Não há divergência entre sistema e contagem física.';
  end if;

  insert into public.estoque_movimentacoes (
    empresa_id,
    produto_id,
    tipo,
    origem,
    quantidade,
    quantidade_sistema_antes,
    quantidade_real_contada,
    diferenca_inventario,
    observacao,
    justificativa,
    usuario_id
  ) values (
    p_empresa_id,
    p_produto_id,
    'ajuste_inventario',
    'inventario',
    abs(v_diferenca),
    v_saldo_sistema,
    p_quantidade_real,
    v_diferenca,
    p_observacao,
    p_justificativa,
    p_usuario_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- =========================================================
-- VIEW: HISTÓRICO LEGÍVEL
-- =========================================================
create or replace view public.vw_estoque_historico as
select
  m.id,
  m.empresa_id,
  m.produto_id,
  m.tipo,
  m.origem,
  case
    when m.tipo = 'ajuste_inventario' then coalesce(m.diferenca_inventario, 0)
    when m.tipo in ('entrada_compra', 'entrada_manual', 'transferencia_entrada') then m.quantidade
    else -m.quantidade
  end as quantidade_assinada,
  m.quantidade,
  m.unidade_medida,
  m.custo_unitario,
  m.custo_total,
  m.referencia_tabela,
  m.referencia_id,
  m.documento_numero,
  m.observacao,
  m.justificativa,
  m.lote,
  m.data_validade,
  m.quantidade_caixas,
  m.unidades_por_caixa,
  m.quantidade_sistema_antes,
  m.quantidade_real_contada,
  m.diferenca_inventario,
  m.usuario_id,
  m.created_at
from public.estoque_movimentacoes m
order by m.created_at desc;

commit;