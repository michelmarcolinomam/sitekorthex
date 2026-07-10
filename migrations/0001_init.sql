-- Korthex Blog — schema inicial
-- Aplicar com:
--   npx wrangler d1 execute korthex-blog --remote --file=./migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS authors (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT '',
  bio        TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS posts (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  dek          TEXT NOT NULL DEFAULT '',
  body_html    TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT '',
  tags         TEXT NOT NULL DEFAULT '',        -- separadas por vírgula
  cover_url    TEXT NOT NULL DEFAULT '',
  og_image_url TEXT NOT NULL DEFAULT '',
  meta_desc    TEXT NOT NULL DEFAULT '',
  author_id    TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'draft',   -- draft | published
  featured     INTEGER NOT NULL DEFAULT 0,
  read_minutes INTEGER NOT NULL DEFAULT 1,
  published_at TEXT,                            -- ISO 8601
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_status_pub
  ON posts (status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_category
  ON posts (category);

-- Autores iniciais. Ajuste a bio depois pelo painel ou aqui.
INSERT OR IGNORE INTO authors (id, name, role, bio, avatar_url) VALUES
  ('aline',  'Aline',           'CEO · Korthex',      'Conduz os programas de desenvolvimento de identidade executiva e arquitetura comportamental da Korthex.', ''),
  ('michel', 'Michel Marcolino','Fundador · Korthex', 'Fundador da Korthex Inteligência & Desenvolvimento. Atua na modelagem estratégica de executivos e organizações.', '');
