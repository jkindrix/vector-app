import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { contentApi } from '../services/api';
import { TreeNode, Document } from '../types';
import { SEO } from './SEO';
import { TableOfContents, extractHeadings, slugify } from './TableOfContents';
import { TreeNav } from './TreeNav';
import { CopyButton } from './CopyButton';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { useTree } from '../hooks/useTree';

import 'katex/dist/katex.min.css';

function extractTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractTextContent).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractTextContent((node as React.ReactElement).props.children);
  }
  return '';
}

function getCollectionSubtree(tree: TreeNode, collection: string): TreeNode | null {
  if (tree.children) {
    for (const child of tree.children) {
      if (child.name === collection) return child;
    }
  }
  return null;
}

function flattenFiles(node: TreeNode): TreeNode[] {
  if (node.type === 'file') return [node];
  return (node.children ?? []).flatMap(flattenFiles);
}

function stripMarkdown(md: string): string {
  return md
    .replace(/[#*_`~\[\]()>!|-]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

export const DocumentView: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  const contentPath = params['*'] || location.pathname.replace(/^\//, '');

  const [document, setDocument] = useState<Document | null>(null);
  const { tree } = useTree();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!contentPath) return;
    setLoading(true);
    setError(null);

    contentApi.getContent(contentPath)
      .then(setDocument)
      .catch(err => setError(err?.message || 'Failed to load document'))
      .finally(() => setLoading(false));
  }, [contentPath]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [contentPath]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [sidebarOpen]);

  const pathSegments = contentPath.split('/');
  const collection = pathSegments[0];

  const collectionTree = useMemo(
    () => (tree ? getCollectionSubtree(tree, collection) : null),
    [tree, collection]
  );

  const siblings = useMemo(() => {
    if (!collectionTree) return [];
    return flattenFiles(collectionTree);
  }, [collectionTree]);

  const currentIndex = siblings.findIndex(n => n.path === contentPath);
  const prevDoc = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextDoc = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; to?: string }[] = [{ label: 'Home', to: '/' }];
    let accumulated = '';
    for (let i = 0; i < pathSegments.length; i++) {
      accumulated += (i > 0 ? '/' : '') + pathSegments[i];
      const isLast = i === pathSegments.length - 1;
      const label = pathSegments[i]
        .replace(/\.md$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      crumbs.push(isLast ? { label } : { label, to: `/${accumulated}` });
    }
    return crumbs;
  }, [pathSegments]);

  const seoDescription = useMemo(() => {
    if (!document?.markdown) return '';
    return stripMarkdown(document.markdown).slice(0, 160);
  }, [document]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const headings = useMemo(
    () => (document?.markdown ? extractHeadings(document.markdown) : []),
    [document]
  );

  const headingIds = useMemo(() => headings.map(h => h.id), [headings]);
  const activeId = useScrollSpy(headingIds);

  const [tocOpen, setTocOpen] = useState(false);

  const markdownComponents = useMemo<Components>(() => {
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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-8" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <SEO title="Not Found - Vector" />
        <p className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">404</p>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          {error || 'This document could not be found.'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          The page at <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">/{contentPath}</code> doesn't exist.
        </p>
        <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          &larr; Back to home
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${document.title} - Vector`}
        description={seoDescription}
        type="article"
        dateModified={document.lastModified}
      />

      <div className="flex min-h-screen">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-[4.25rem] left-4 z-50 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm"
          aria-label="Toggle navigation"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/30 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        {collectionTree && (
          <aside
            className={`
              w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 overflow-y-auto
              fixed top-0 left-0 h-full z-40 transition-transform
              lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            <Link to="/" className="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
              &larr; All collections
            </Link>
            <TreeNav node={collectionTree} currentPath={contentPath} />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 py-12 max-w-3xl mx-auto">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400 mb-8 flex flex-wrap gap-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1">/</span>}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-gray-700 dark:hover:text-gray-300">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-600 dark:text-gray-300">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          {/* Header */}
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
              {document.title}
            </h1>
            {document.lastModified && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last modified {formatDate(document.lastModified)}
              </div>
            )}
          </header>

          {/* Mobile ToC dropdown */}
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

          {/* Markdown content */}
          <article className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-pre:bg-gray-50 dark:prose-pre:bg-gray-900 prose-code:text-sm prose-headings:scroll-mt-20">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
              components={markdownComponents}
            >
              {document.markdown}
            </ReactMarkdown>
          </article>

          {/* Previous / Next navigation */}
          {(prevDoc || nextDoc) && (
            <nav className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              {prevDoc ? (
                <Link
                  to={`/${prevDoc.path}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  &larr; {prevDoc.displayName}
                </Link>
              ) : (
                <span />
              )}
              {nextDoc ? (
                <Link
                  to={`/${nextDoc.path}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {nextDoc.displayName} &rarr;
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </main>

        {/* Right sidebar: Table of Contents (desktop) */}
        {headings.length > 0 && (
          <aside className="hidden xl:block w-56 shrink-0 py-12 pr-4">
            <div className="sticky top-8">
              <TableOfContents headings={headings} activeId={activeId} />
            </div>
          </aside>
        )}
      </div>
    </>
  );
};

export default DocumentView;
