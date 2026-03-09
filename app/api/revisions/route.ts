import { NextRequest, NextResponse } from 'next/server';
import { getRevisions } from '@/lib/database';

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('path');
  if (!filePath) {
    return NextResponse.json({ error: 'path parameter required' }, { status: 400 });
  }
  const revisions = await getRevisions(filePath);
  return NextResponse.json({ revisions });
}
