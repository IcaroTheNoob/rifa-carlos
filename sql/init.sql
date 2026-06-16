CREATE TABLE rifas (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL DEFAULT 'Rifa',
  descricao TEXT NOT NULL DEFAULT '',
  valor_numero NUMERIC NOT NULL DEFAULT 10,
  total_numeros INTEGER NOT NULL DEFAULT 100,
  numeros_restantes INTEGER NOT NULL DEFAULT 100,
  auto_expand_percent INTEGER NOT NULL DEFAULT 20,
  auto_expand_qtd INTEGER NOT NULL DEFAULT 50,
  whatsapp TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE numeros (
  id SERIAL PRIMARY KEY,
  rifa_id INTEGER NOT NULL REFERENCES rifas(id),
  numero INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel',
  cliente_nome TEXT,
  cliente_telefone TEXT,
  pedido_id TEXT,
  reservado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rifa_id, numero)
);

CREATE TABLE pedidos (
  id TEXT PRIMARY KEY,
  rifa_id INTEGER NOT NULL REFERENCES rifas(id),
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  numeros INTEGER[] NOT NULL,
  quantidade INTEGER NOT NULL,
  valor_total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'reservado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO rifas (titulo, descricao, valor_numero, total_numeros, numeros_restantes, whatsapp) VALUES
('Rifa', '', 10, 100, 100, '');

INSERT INTO numeros (rifa_id, numero, status)
SELECT 1, generate_series, 'disponivel'
FROM generate_series(1, 100);
