import { NextRequest, NextResponse } from 'next/server';
import { getContent, writeContent, invalidateCache } from '@/lib/content';
import { indexFile } from '@/lib/database';
import { getSessionUser } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const contentPath = path.join('/');
    const doc = await getContent(contentPath);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json(doc, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { path } = await params;
    const contentPath = path.join('/');
    const { markdown } = await request.json();

    await writeContent(contentPath, markdown);

    const doc = await getContent(contentPath);
    if (doc) {
      const segments = contentPath.split('/');
      const collection = segments.length > 1 ? segments[0] : null;
      await indexFile(contentPath, doc.title, doc.markdown, collection);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
