CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id TEXT NOT NULL,
  nome_produto TEXT NOT NULL,
  categoria_produto TEXT NOT NULL,
  unidade_medida TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_produtos_empresa
  ON produtos (empresa_id);

CREATE INDEX IF NOT EXISTS idx_produtos_nome
  ON produtos (empresa_id, nome_produto);