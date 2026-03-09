-- =========================
-- FORNECEDORES
-- =========================
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pizzaria_id UUID NOT NULL,
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  telefone_whatsapp TEXT,
  categoria_principal TEXT,
  email TEXT,
  nome_contato TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_pizzaria
  ON fornecedores (pizzaria_id);

-- =========================
-- PERFIS USUARIOS
-- =========================
CREATE TABLE IF NOT EXISTS perfis_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pizzaria_id UUID NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  funcao TEXT NOT NULL DEFAULT 'usuario',
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- CAIXA ENTRADA (IA)
-- =========================
CREATE TABLE IF NOT EXISTS caixa_entrada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pizzaria_id UUID NOT NULL,
  fornecedor_nome TEXT,
  valor_total REAL,
  json_extraido TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caixa_entrada_pizzaria_status
  ON caixa_entrada (pizzaria_id, status);

-- =========================
-- PRODUTOS
-- =========================
CREATE TABLE IF NOT EXISTS produtos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  pizzaria_id UUID NOT NULL,
  nome_produto TEXT NOT NULL,
  categoria_produto TEXT NOT NULL,
  unidade_medida TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_pizzaria
  ON produtos (pizzaria_id);

CREATE INDEX IF NOT EXISTS idx_produtos_nome
  ON produtos (pizzaria_id, nome_produto);

-- =========================
-- PEDIDOS DE COMPRA
-- =========================
CREATE TABLE IF NOT EXISTS pedidos_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pizzaria_id UUID NOT NULL,
  fornecedor_id UUID REFERENCES fornecedores(id),
  fornecedor_nome_custom TEXT, -- Para fornecedores não cadastrados
  data_pedido TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_entrega_prevista DATE,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, aprovado, recebido_parcial, recebido_total, cancelado
  observacoes TEXT,
  valor_total NUMERIC(14,2) DEFAULT 0,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_pizzaria_status
  ON pedidos_compra (pizzaria_id, status);

-- =========================
-- ITENS DO PEDIDO DE COMPRA
-- =========================
CREATE TABLE IF NOT EXISTS pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
  produto_id BIGINT REFERENCES produtos(id),
  nome_produto TEXT NOT NULL, -- Para produtos não cadastrados ou customizados
  quantidade NUMERIC(14,3) NOT NULL,
  unidade_medida TEXT NOT NULL,
  valor_unitario NUMERIC(14,4) NOT NULL,
  valor_total NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido
  ON pedido_itens (pedido_id);

-- =========================
-- COTACOES
-- =========================
CREATE TABLE IF NOT EXISTS cotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pizzaria_id UUID NOT NULL,
  produto_id BIGINT REFERENCES produtos(id),
  fornecedor_id UUID REFERENCES fornecedores(id),
  data_cotacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  preco_cotado NUMERIC(14,4) NOT NULL,
  unidade_medida TEXT NOT NULL,
  link_cotacao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cotacoes_produto_fornecedor
  ON cotacoes (produto_id, fornecedor_id);

-- =========================
-- BOLETOS (FINANCEIRO)
-- =========================
CREATE TABLE IF NOT EXISTS boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pizzaria_id UUID NOT NULL,
  fornecedor_id UUID REFERENCES fornecedores(id),
  pedido_id UUID REFERENCES pedidos_compra(id),
  numero_documento TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL,
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, pago, vencido, cancelado
  link_boleto TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boletos_pizzaria_status
  ON boletos (pizzaria_id, status);

-- =========================
-- CONFIGURAÇÕES DE IA
-- =========================
CREATE TABLE IF NOT EXISTS ia_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pizzaria_id UUID NOT NULL UNIQUE,
  previsao_estoque_ativa BOOLEAN DEFAULT TRUE,
  frequencia_lista_compras TEXT DEFAULT 'semanal', -- semanal, quinzenal, mensal
  limite_desvio_cotacao NUMERIC(5,2) DEFAULT 0.10, -- 10% de desvio aceitável
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- HISTÓRICO DE PREÇOS (PARA COTAÇÃO INTELIGENTE)
-- =========================
CREATE TABLE IF NOT EXISTS historico_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pizzaria_id UUID NOT NULL,
  produto_id BIGINT REFERENCES produtos(id),
  fornecedor_id UUID REFERENCES fornecedores(id),
  data_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  preco NUMERIC(14,4) NOT NULL,
  unidade_medida TEXT NOT NULL,
  origem TEXT, -- ex: 'compra', 'cotacao', 'mercado'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historico_precos_produto_fornecedor
  ON historico_precos (produto_id, fornecedor_id, data_registro DESC);

-- =========================
-- LISTAS DE COMPRA GERADAS PELA IA
-- =========================
CREATE TABLE IF NOT EXISTS listas_compra_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pizzaria_id UUID NOT NULL,
  data_geracao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, em_cotacao, comprada, cancelada
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lista_compra_ia_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_id UUID NOT NULL REFERENCES listas_compra_ia(id) ON DELETE CASCADE,
  produto_id BIGINT REFERENCES produtos(id),
  nome_produto TEXT NOT NULL,
  quantidade_sugerida NUMERIC(14,3) NOT NULL,
  unidade_medida TEXT NOT NULL,
  motivo_sugestao TEXT, -- ex: 'estoque_baixo', 'previsao_consumo'
  prioridade TEXT DEFAULT 'media', -- alta, media, baixa
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lista_compra_ia_itens_lista
  ON lista_compra_ia_itens (lista_id);

-- =========================
-- TRIGGER PARA ATUALIZAR 'updated_at' AUTOMATICAMENTE
-- =========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger às tabelas que possuem a coluna updated_at
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fornecedores' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_fornecedores_updated_at ON fornecedores;
    CREATE TRIGGER trg_fornecedores_updated_at
    BEFORE UPDATE ON fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'perfis_usuarios' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_perfis_usuarios_updated_at ON perfis_usuarios;
    CREATE TRIGGER trg_perfis_usuarios_updated_at
    BEFORE UPDATE ON perfis_usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pedidos_compra' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_pedidos_compra_updated_at ON pedidos_compra;
    CREATE TRIGGER trg_pedidos_compra_updated_at
    BEFORE UPDATE ON pedidos_compra
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'boletos' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_boletos_updated_at ON boletos;
    CREATE TRIGGER trg_boletos_updated_at
    BEFORE UPDATE ON boletos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ia_config' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_ia_config_updated_at ON ia_config;
    CREATE TRIGGER trg_ia_config_updated_at
    BEFORE UPDATE ON ia_config
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
