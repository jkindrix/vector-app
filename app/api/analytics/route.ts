import { NextRequest, NextResponse } from 'next/server';
import { getPageViewCounts, getSearchAnalytics, getFeedbackStats } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const daysParam = request.nextUrl.searchParams.get('days');
  const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 365) : 30;

  const [pageViews, searches, feedback] = await Promise.all([
    getPageViewCounts(20, days),
    getSearchAnalytics(20, days),
    getFeedbackStats(20, days),
  ]);

  return NextResponse.json({ pageViews, searches, feedback });
}
