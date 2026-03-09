import { NextResponse } from 'next/server';
import { getTree } from '@/lib/content';

export async function GET() {
  try {
    const tree = await getTree();
    return NextResponse.json(tree, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    console.error('Error fetching tree:', error);
    return NextResponse.json({ error: 'Failed to fetch content tree' }, { status: 500 });
  }
}
