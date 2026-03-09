'use client';

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function extractHeadings(markdown: string): TocEntry[] {
  const headings: TocEntry[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[#*_`~\[\]()>!]/g, '').trim();
      headings.push({ id: slugify(text), text, level });
    }
  }

  return headings;
}

export function TableOfContents({ headings, activeId }: { headings: TocEntry[]; activeId: string }) {
  return (
    <nav aria-label="Table of contents">
      <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        On this page
      </h2>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block text-xs py-1.5 transition-colors ${
                h.level === 3 ? 'pl-3' : h.level === 4 ? 'pl-6' : ''
              } ${
                activeId === h.id
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
