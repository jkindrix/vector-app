import { NextResponse } from 'next/server';
import { searchContent } from '@/lib/database';

export async function GET() {
  try {
    await searchContent('health', 1, 0);
    return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'unhealthy', timestamp: new Date().toISOString() }, { status: 503 });
  }
}
