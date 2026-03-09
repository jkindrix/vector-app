import React from 'react';

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
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const text = match[2].replace(/[#*_`~\[\]()>!]/g, '').trim();
      headings.push({
        id: slugify(text),
        text,
        level: match[1].length,
      });
    }
  }
  return headings;
}

export const TableOfContents: React.FC<{ headings: TocEntry[]; activeId: string }> = ({ headings, activeId }) => {
  if (headings.length === 0) return null;
  const minLevel = Math.min(...headings.map(h => h.level));

  return (
    <nav aria-label="Table of contents">
      <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        On this page
      </h2>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: (h.level - minLevel) * 12 }}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`block text-sm py-0.5 transition-colors ${
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
};
