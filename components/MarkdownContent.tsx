'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { CopyButton } from './CopyButton';
import { TableOfContents, extractHeadings, slugify } from './TableOfContents';
import { useScrollSpy } from './useScrollSpy';

function extractTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractTextContent).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractTextContent((node as React.ReactElement).props.children);
  }
  return '';
}

export function MarkdownContent({ markdown }: { markdown: string }) {
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  const headingIds = useMemo(() => headings.map(h => h.id), [headings]);
  const activeId = useScrollSpy(headingIds);
  const [tocOpen, setTocOpen] = useState(false);

  const components = useMemo<Components>(() => {
    function makeId(children: React.ReactNode): string {
      return slugify(extractTextContent(children).replace(/[#*_`~\[\]()>!]/g, '').trim());
    }
    return {
      h2: ({ children, ...props }) => <h2 id={makeId(children)} {...props}>{children}</h2>,
      h3: ({ children, ...props }) => <h3 id={makeId(children)} {...props}>{children}</h3>,
      h4: ({ children, ...props }) => <h4 id={makeId(children)} {...props}>{children}</h4>,
      pre: ({ children, ...props }) => {
        const code = extractTextContent(children);
        return (
          <pre {...props} className={`${props.className || ''} relative group`}>
            {children}
            <CopyButton text={code} />
          </pre>
        );
      },
    };
  }, []);

  return (
    <div className="flex min-h-0">
      <div className="flex-1 min-w-0">
        {/* Mobile ToC */}
        {headings.length > 0 && (
          <div className="xl:hidden mb-8">
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 w-full hover:bg-gray-50 dark:hover:bg-gray-800"
              aria-expanded={tocOpen}
            >
              <svg className={`w-4 h-4 transition-transform ${tocOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              On this page
            </button>
            {tocOpen && (
              <div className="mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                <TableOfContents headings={headings} activeId={activeId} />
              </div>
            )}
          </div>
        )}

        <article className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-pre:bg-gray-50 dark:prose-pre:bg-gray-900 prose-code:text-sm prose-headings:scroll-mt-20">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeHighlight]}
            components={components}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>

      {/* Desktop ToC */}
      {headings.length > 0 && (
        <aside className="hidden xl:block w-56 shrink-0 pl-8">
          <div className="sticky top-8">
            <TableOfContents headings={headings} activeId={activeId} />
          </div>
        </aside>
      )}
    </div>
  );
}
