import { NextResponse } from 'next/server';
import { ensureInitialized } from '@/lib/database';

export async function GET() {
  try {
    await ensureInitialized();
    return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'unhealthy', timestamp: new Date().toISOString() }, { status: 503 });
  }
}
