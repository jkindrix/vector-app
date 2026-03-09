import { NextRequest, NextResponse } from 'next/server';
import { searchContent } from '@/lib/database';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const query = (request.nextUrl.searchParams.get('q') || '').slice(0, 200);
    if (!query) {
      return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
    }
    const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '20'), 1), 100);
    const offset = Math.max(parseInt(request.nextUrl.searchParams.get('offset') || '0'), 0);

    const results = await searchContent(query, limit, offset);
    return NextResponse.json(results);
  } catch (error) {
    logger.error({ err: error }, 'Error searching');
    return NextResponse.json({ error: 'Failed to search content' }, { status: 500 });
  }
}
