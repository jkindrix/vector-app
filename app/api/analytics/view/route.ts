import { NextRequest, NextResponse } from 'next/server';
import { trackPageView } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'path required' }, { status: 400 });
    }
    await trackPageView(path);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
