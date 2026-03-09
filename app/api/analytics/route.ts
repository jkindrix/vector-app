import { NextRequest, NextResponse } from 'next/server';
import { getPageViewCounts, getSearchAnalytics, getFeedbackStats } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [pageViews, searches, feedback] = await Promise.all([
    getPageViewCounts(20),
    getSearchAnalytics(20),
    getFeedbackStats(20),
  ]);

  return NextResponse.json({ pageViews, searches, feedback });
}
