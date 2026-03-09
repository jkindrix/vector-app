CREATE TABLE IF NOT EXISTS search_index (
  file_path TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content_text TEXT,
  collection TEXT,
  last_indexed TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_fulltext
  ON search_index USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content_text, '')));

CREATE INDEX IF NOT EXISTS idx_search_collection ON search_index(collection);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
