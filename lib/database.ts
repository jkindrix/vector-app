import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

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
      logger.error({ err }, 'Unexpected database error');
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

    // Enable pg_trgm for fuzzy/typo-tolerant search fallback
    await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_search_trgm_title
        ON search_index USING gin(title gin_trgm_ops)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_search_trgm_content
        ON search_index USING gin(content_text gin_trgm_ops)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Document revision history
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_revisions (
        id SERIAL PRIMARY KEY,
        file_path TEXT NOT NULL,
        title TEXT,
        content_hash TEXT NOT NULL,
        content_length INTEGER NOT NULL,
        edited_by TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_revisions_file_path ON document_revisions(file_path, created_at DESC)
    `);

    // Page view analytics
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        file_path TEXT NOT NULL,
        viewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(file_path, viewed_at DESC)
    `);

    // Search analytics
    await client.query(`
      CREATE TABLE IF NOT EXISTS search_log (
        id SERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        result_count INTEGER NOT NULL DEFAULT 0,
        searched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_search_log_time ON search_log(searched_at DESC)
    `);

    // Document feedback
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_feedback (
        id SERIAL PRIMARY KEY,
        file_path TEXT NOT NULL,
        helpful BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_path ON document_feedback(file_path)
    `);

    // Create default admin user if none exists
    const adminCount = await client.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(adminCount.rows[0].count) === 0) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
      if (defaultPassword) {
        const hash = await bcrypt.hash(defaultPassword, 12);
        await client.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', ['admin', hash]);
        logger.info('Default admin user created');
      }
    }

    logger.info('Database initialized');
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
    [filePath, title, contentText, collection],
  );
}

export async function clearIndex() {
  await getPool().query('TRUNCATE search_index');
}

function sanitizeSnippet(html: string): string {
  // Strip all HTML except <mark> and </mark> from ts_headline output
  return html.replace(/<\/?(?!mark\b)[^>]+>/gi, '');
}

export async function searchContent(
  query: string,
  limit: number = 20,
  offset: number = 0,
): Promise<{ results: SearchResult[]; total: number }> {
  await ensureInitialized();

  // Try full-text search first
  const ftsResult = await getPool().query(
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
    [query, limit, offset],
  );

  if (ftsResult.rows.length > 0) {
    const total = parseInt(ftsResult.rows[0].total);
    return {
      results: ftsResult.rows.map(({ total: _, ...row }) => ({
        ...row,
        snippet: row.snippet ? sanitizeSnippet(row.snippet) : '',
      })),
      total,
    };
  }

  // Fallback: fuzzy search using pg_trgm trigram similarity
  const fuzzyResult = await getPool().query(
    `WITH matched AS (
      SELECT file_path, title, collection,
        GREATEST(
          similarity(COALESCE(title, ''), $1),
          similarity(COALESCE(content_text, ''), $1)
        ) AS sim,
        COUNT(*) OVER() AS total
      FROM search_index
      WHERE COALESCE(title, '') % $1 OR COALESCE(content_text, '') % $1
    )
    SELECT file_path, title, collection, total, '' as snippet
    FROM matched
    ORDER BY sim DESC
    LIMIT $2 OFFSET $3`,
    [query, limit, offset],
  );

  const total = fuzzyResult.rows.length > 0 ? parseInt(fuzzyResult.rows[0].total) : 0;
  return {
    results: fuzzyResult.rows.map(({ total: _, ...row }) => row),
    total,
  };
}

// --- Document Revisions ---

export async function saveRevision(filePath: string, title: string | null, content: string, editedBy: string | null) {
  const crypto = await import('crypto');
  const contentHash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);

  // Only save if content actually changed
  const last = await getPool().query(
    'SELECT content_hash FROM document_revisions WHERE file_path = $1 ORDER BY created_at DESC LIMIT 1',
    [filePath],
  );
  if (last.rows.length > 0 && last.rows[0].content_hash === contentHash) {
    return; // No change
  }

  await getPool().query(
    `INSERT INTO document_revisions (file_path, title, content_hash, content_length, edited_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [filePath, title, contentHash, content.length, editedBy],
  );
}

export interface DocumentRevision {
  id: number;
  title: string | null;
  content_length: number;
  edited_by: string | null;
  created_at: string;
}

export async function getRevisions(filePath: string, limit = 20): Promise<DocumentRevision[]> {
  await ensureInitialized();
  const result = await getPool().query(
    `SELECT id, title, content_length, edited_by, created_at
     FROM document_revisions WHERE file_path = $1
     ORDER BY created_at DESC LIMIT $2`,
    [filePath, limit],
  );
  return result.rows;
}

// --- Page View Analytics ---

export async function trackPageView(filePath: string) {
  await ensureInitialized();
  await getPool().query('INSERT INTO page_views (file_path) VALUES ($1)', [filePath]);
}

export async function getPageViewCounts(limit = 20): Promise<{ file_path: string; views: number }[]> {
  await ensureInitialized();
  const result = await getPool().query(
    `SELECT file_path, COUNT(*) as views FROM page_views
     WHERE viewed_at > NOW() - INTERVAL '30 days'
     GROUP BY file_path ORDER BY views DESC LIMIT $1`,
    [limit],
  );
  return result.rows.map((r) => ({ file_path: r.file_path, views: parseInt(r.views) }));
}

// --- Search Analytics ---

export async function logSearch(query: string, resultCount: number) {
  await ensureInitialized();
  await getPool().query('INSERT INTO search_log (query, result_count) VALUES ($1, $2)', [query, resultCount]);
}

export async function getSearchAnalytics(limit = 20): Promise<{ query: string; count: number; avg_results: number }[]> {
  await ensureInitialized();
  const result = await getPool().query(
    `SELECT query, COUNT(*) as count, ROUND(AVG(result_count)) as avg_results
     FROM search_log WHERE searched_at > NOW() - INTERVAL '30 days'
     GROUP BY query ORDER BY count DESC LIMIT $1`,
    [limit],
  );
  return result.rows.map((r) => ({
    query: r.query,
    count: parseInt(r.count),
    avg_results: parseInt(r.avg_results),
  }));
}

export async function getAdminUser(username: string) {
  const result = await getPool().query(
    'SELECT id, username, password_hash, created_at FROM admin_users WHERE username = $1',
    [username],
  );
  return result.rows[0] || null;
}

export async function updateAdminPassword(username: string, newPassword: string) {
  const hash = await bcrypt.hash(newPassword, 12);
  const result = await getPool().query(
    'UPDATE admin_users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
    [hash, username],
  );
  if (result.rows.length === 0) throw new Error('Admin user not found');
  return result.rows[0];
}

// --- Document Feedback ---

export async function saveFeedback(filePath: string, helpful: boolean) {
  await ensureInitialized();
  await getPool().query('INSERT INTO document_feedback (file_path, helpful) VALUES ($1, $2)', [filePath, helpful]);
}

export async function getFeedbackStats(
  limit = 20,
): Promise<{ file_path: string; helpful: number; not_helpful: number }[]> {
  await ensureInitialized();
  const result = await getPool().query(
    `SELECT file_path,
       COUNT(*) FILTER (WHERE helpful) as helpful,
       COUNT(*) FILTER (WHERE NOT helpful) as not_helpful
     FROM document_feedback
     WHERE created_at > NOW() - INTERVAL '30 days'
     GROUP BY file_path ORDER BY (COUNT(*) FILTER (WHERE NOT helpful)) DESC LIMIT $1`,
    [limit],
  );
  return result.rows.map((r) => ({
    file_path: r.file_path,
    helpful: parseInt(r.helpful),
    not_helpful: parseInt(r.not_helpful),
  }));
}
