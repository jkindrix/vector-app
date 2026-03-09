import { Pool } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export async function runMigrations(pool: Pool, migrationsDir: string): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const applied = await client.query('SELECT version FROM schema_migrations ORDER BY version');
    const appliedSet = new Set(applied.rows.map(r => r.version));

    const files = (await readdir(migrationsDir))
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) continue;

      const sql = await readFile(join(migrationsDir, file), 'utf-8');
      console.log(`Running migration: ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  Applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err}`);
      }
    }
  } finally {
    client.release();
  }
}
