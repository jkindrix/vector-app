import { getAllFiles, getContent } from '@/lib/content';

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://vector.jdok.dev';

export async function GET() {
  const files = await getAllFiles();
  const items: { title: string; path: string; date: string; description: string }[] = [];

  for (const file of files) {
    const doc = await getContent(file.replace(/\.md$/, ''));
    if (doc) {
      items.push({
        title: doc.title,
        path: file.replace(/\.md$/, ''),
        date: doc.lastModified || new Date().toISOString(),
        description: doc.markdown
          .replace(/[#*_`~\[\]()>!|-]/g, '')
          .replace(/\n+/g, ' ')
          .trim()
          .slice(0, 200),
      });
    }
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vector</title>
    <link>${SITE_URL}</link>
    <description>Research papers, frameworks, and references.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${SITE_URL}/${item.path}</link>
      <guid>${SITE_URL}/${item.path}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
