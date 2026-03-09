import { Pool } from 'pg';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import { runMigrations } from './migrator';

interface SearchResult {
  file_path: string;
  title: string;
  collection: string | null;
  snippet: string;
}

export class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'vector_db',
      user: process.env.DB_USER || 'vector_user',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err: Error) => {
      console.error('Unexpected database error:', err);
    });
  }

  async initialize() {
    console.log('Initializing PostgreSQL database...');

    try {
      const migrationsDir = join(__dirname, '..', 'migrations');
      await runMigrations(this.pool, migrationsDir);

      // Create default admin user if none exists
      const adminCount = await this.pool.query('SELECT COUNT(*) FROM admin_users');
      if (parseInt(adminCount.rows[0].count) === 0) {
        const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
        if (!defaultPassword) {
          throw new Error(
            'FATAL: No admin users exist and DEFAULT_ADMIN_PASSWORD is not set. ' +
            'Set DEFAULT_ADMIN_PASSWORD environment variable to create the initial admin user.'
          );
        }

        console.log('Creating default admin user...');
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(defaultPassword, saltRounds);

        await this.pool.query(
          `INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)`,
          ['admin', password_hash]
        );

        console.log('Default admin user created with username: admin');
      }

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  async indexFile(filePath: string, title: string, contentText: string, collection: string | null) {
    await this.pool.query(
      `INSERT INTO search_index (file_path, title, content_text, collection, last_indexed)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (file_path) DO UPDATE
       SET title = $2, content_text = $3, collection = $4, last_indexed = CURRENT_TIMESTAMP`,
      [filePath, title, contentText, collection]
    );
  }

  async removeFromIndex(filePath: string) {
    await this.pool.query('DELETE FROM search_index WHERE file_path = $1', [filePath]);
  }

  async clearIndex() {
    await this.pool.query('TRUNCATE search_index');
  }

  async searchContent(query: string, limit: number = 20, offset: number = 0): Promise<{ results: SearchResult[], total: number }> {
    const result = await this.pool.query(
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

  async getAdminUser(username: string) {
    const result = await this.pool.query(
      'SELECT id, username, password_hash, created_at FROM admin_users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  async createAdminUser(username: string, password: string) {
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one digit');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Check if username already exists
      const existingUser = await client.query(
        'SELECT username FROM admin_users WHERE username = $1',
        [username]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Username already exists');
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create admin user
      const result = await client.query(
        `INSERT INTO admin_users (username, password_hash)
         VALUES ($1, $2)
         RETURNING id, username, created_at`,
        [username, password_hash]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllAdminUsers() {
    const result = await this.pool.query(
      'SELECT id, username, created_at FROM admin_users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async updateAdminPassword(username: string, newPassword: string) {
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    const result = await this.pool.query(
      'UPDATE admin_users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
      [password_hash, username]
    );

    if (result.rows.length === 0) {
      throw new Error('Admin user not found');
    }

    return result.rows[0];
  }

  async deleteAdminUser(username: string) {
    const result = await this.pool.query(
      'DELETE FROM admin_users WHERE username = $1 RETURNING username',
      [username]
    );

    if (result.rows.length === 0) {
      throw new Error('Admin user not found');
    }

    return { success: true, username: result.rows[0].username };
  }

  async close() {
    await this.pool.end();
  }
}
