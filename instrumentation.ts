export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureInitialized } = await import('@/lib/database');
    const { logger } = await import('@/lib/logger');
    try {
      await ensureInitialized();
      logger.info('Database migrations complete');
    } catch (error) {
      logger.error({ err: error }, 'Database initialization failed');
    }
  }
}
