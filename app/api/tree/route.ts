import { NextResponse } from 'next/server';
import { getTree } from '@/lib/content';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tree = await getTree();
    return NextResponse.json(tree, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching tree');
    return NextResponse.json({ error: 'Failed to fetch content tree' }, { status: 500 });
  }
}
