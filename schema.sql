-- =========================
-- FORNECEDORES
-- =========================
CREATE TABLE IF NOT EXISTS fornecedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pizzaria_id TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  telefone_whatsapp TEXT,
  categoria_principal TEXT,
  email TEXT,
  nome_contato TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_pizzaria
  ON fornecedores (pizzaria_id);

-- =========================
-- PERFIS USUARIOS
-- =========================
CREATE TABLE IF NOT EXISTS perfis_usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pizzaria_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  funcao TEXT NOT NULL DEFAULT 'usuario',
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TEXT DEFAULT (datetime('now'))
);

-- =========================
-- CAIXA ENTRADA (IA)
-- =========================
CREATE TABLE IF NOT EXISTS caixa_entrada (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pizzaria_id TEXT NOT NULL,
  fornecedor_nome TEXT,
  valor_total REAL,
  json_extraido TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_caixa_entrada_pizzaria_status
  ON caixa_entrada (pizzaria_id, status);