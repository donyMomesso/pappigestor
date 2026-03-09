CREATE TABLE IF NOT EXISTS empresas (
  id TEXT PRIMARY KEY,
  nome TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO empresas (id, nome, status)
VALUES ('fe584984-f9e7-4dc6-8a9f-9d507d2388cb', 'Pappi Pizza', 'ativo');