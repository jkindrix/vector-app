import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { clearIndex, indexFile } from '@/lib/database';
import { getAllFiles, getContent } from '@/lib/content';

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await clearIndex();
    const files = await getAllFiles();
    let count = 0;

    for (const filePath of files) {
      const doc = await getContent(filePath);
      if (doc) {
        const segments = filePath.split('/');
        const collection = segments.length > 1 ? segments[0] : null;
        await indexFile(filePath, doc.title, doc.markdown, collection);
        count++;
      }
    }

    return NextResponse.json({ indexed: count });
  } catch (error) {
    console.error('Error reindexing:', error);
    return NextResponse.json({ error: 'Failed to reindex' }, { status: 500 });
  }
}
