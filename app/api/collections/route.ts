import { NextResponse } from 'next/server';
import { listCollections } from '@/lib/content';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const collections = await listCollections();
    return NextResponse.json(collections, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error listing collections');
    return NextResponse.json({ error: 'Failed to list collections' }, { status: 500 });
  }
}
