import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 403 });
  }
  return NextResponse.json({ valid: true, user });
}
