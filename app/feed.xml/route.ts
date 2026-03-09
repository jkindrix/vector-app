import { getAllFiles, getContent } from '@/lib/content';

export const revalidate = 3600;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vector.jdok.dev';
  const files = await getAllFiles();

  const items: { title: string; path: string; lastModified: string; description: string }[] = [];

  for (const file of files.slice(0, 50)) {
    const path = file.replace(/\.md$/, '');
    const doc = await getContent(path);
    if (!doc) continue;
    items.push({
      title: doc.title,
      path,
      lastModified: doc.lastModified || new Date().toISOString(),
      description: doc.markdown
        .replace(/[#*_`~\[\]()>!|-]/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .slice(0, 200),
    });
  }

  items.sort((a, b) => b.lastModified.localeCompare(a.lastModified));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vector</title>
    <link>${baseUrl}</link>
    <description>Research papers, frameworks, and references</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items
      .map(
        (item) => `<item>
      <title>${escapeXml(item.title)}</title>
      <link>${baseUrl}/${item.path}</link>
      <guid>${baseUrl}/${item.path}</guid>
      <pubDate>${new Date(item.lastModified).toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`,
      )
      .join('\n    ')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
