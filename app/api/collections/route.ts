import { NextResponse } from 'next/server';
import { listCollections } from '@/lib/content';

export async function GET() {
  try {
    const collections = await listCollections();
    return NextResponse.json(collections, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    console.error('Error listing collections:', error);
    return NextResponse.json({ error: 'Failed to list collections' }, { status: 500 });
  }
}
