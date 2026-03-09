import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

interface SearchResult {
  file_path: string;
  title: string;
  collection: string | null;
  snippet: string;
}

let pool: Pool | null = null;
let initialized = false;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'vector_db',
      user: process.env.DB_USER || 'vector_user',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err: Error) => {
      console.error('Unexpected database error:', err);
    });
  }
  return pool;
}

export async function ensureInitialized() {
  if (initialized) return;
  await initializeDatabase();
  initialized = true;
}

export async function initializeDatabase() {
  const p = getPool();
  const client = await p.connect();

  try {
    // Run migrations inline (simple for now)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS search_index (
        file_path TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content_text TEXT,
        collection TEXT,
        last_indexed TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_search_fulltext
        ON search_index USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content_text, '')))
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_search_collection ON search_index(collection)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin user if none exists
    const adminCount = await client.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(adminCount.rows[0].count) === 0) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
      if (defaultPassword) {
        const hash = await bcrypt.hash(defaultPassword, 12);
        await client.query(
          'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
          ['admin', hash]
        );
        console.log('Default admin user created');
      }
    }

    console.log('Database initialized');
  } finally {
    client.release();
  }
}

export async function indexFile(filePath: string, title: string, contentText: string, collection: string | null) {
  await getPool().query(
    `INSERT INTO search_index (file_path, title, content_text, collection, last_indexed)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (file_path) DO UPDATE
     SET title = $2, content_text = $3, collection = $4, last_indexed = CURRENT_TIMESTAMP`,
    [filePath, title, contentText, collection]
  );
}

export async function clearIndex() {
  await getPool().query('TRUNCATE search_index');
}

export async function searchContent(query: string, limit: number = 20, offset: number = 0): Promise<{ results: SearchResult[], total: number }> {
  await ensureInitialized();
  const result = await getPool().query(
    `WITH matched AS (
      SELECT file_path, title, collection, content_text,
        ts_rank(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content_text, '')), plainto_tsquery('english', $1)) AS rank,
        COUNT(*) OVER() AS total
      FROM search_index
      WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content_text, '')) @@ plainto_tsquery('english', $1)
    )
    SELECT file_path, title, collection, total,
      ts_headline('english', COALESCE(content_text, ''), plainto_tsquery('english', $1),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15') as snippet
    FROM matched
    ORDER BY rank DESC
    LIMIT $2 OFFSET $3`,
    [query, limit, offset]
  );

  const total = result.rows.length > 0 ? parseInt(result.rows[0].total) : 0;
  return { results: result.rows.map(({ total: _, ...row }) => row), total };
}

export async function getAdminUser(username: string) {
  const result = await getPool().query(
    'SELECT id, username, password_hash, created_at FROM admin_users WHERE username = $1',
    [username]
  );
  return result.rows[0] || null;
}

export async function updateAdminPassword(username: string, newPassword: string) {
  const hash = await bcrypt.hash(newPassword, 12);
  const result = await getPool().query(
    'UPDATE admin_users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
    [hash, username]
  );
  if (result.rows.length === 0) throw new Error('Admin user not found');
  return result.rows[0];
}
