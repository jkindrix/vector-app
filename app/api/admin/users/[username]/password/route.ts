import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { updateAdminPassword } from '@/lib/database';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username } = await params;
    const { newPassword } = await request.json();
    const result = await updateAdminPassword(username, newPassword);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
