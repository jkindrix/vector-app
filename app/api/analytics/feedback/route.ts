import { NextRequest, NextResponse } from 'next/server';
import { saveFeedback } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { path, helpful } = await request.json();
    if (!path || typeof path !== 'string' || typeof helpful !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    await saveFeedback(path, helpful);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
