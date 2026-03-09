import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContent, getTree, getAllFiles } from '@/lib/content';
import type { TreeNode } from '@/lib/content';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function generateStaticParams() {
  const files = await getAllFiles();
  return files.map((f) => ({
    path: f.replace(/\.md$/, '').split('/'),
  }));
}
import { Header } from '@/components/Header';
import { MarkdownContent } from '@/components/MarkdownContent';
import { DocumentSidebar } from '@/components/DocumentSidebar';

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

type Props = {
  params: Promise<{ path: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params;
  const contentPath = path.join('/');
  const doc = await getContent(contentPath);

  if (!doc) {
    return { title: 'Not Found' };
  }

  const description = stripMarkdown(doc.markdown).slice(0, 160);

  return {
    title: doc.title,
    description,
    openGraph: {
      title: `${doc.title} - Vector`,
      description,
      type: 'article',
      ...(doc.lastModified && { modifiedTime: doc.lastModified }),
    },
    other: {
      'article:modified_time': doc.lastModified || '',
    },
  };
}

export default async function DocumentPage({ params }: Props) {
  const { path } = await params;
  const contentPath = path.join('/');

  const [doc, tree] = await Promise.all([getContent(contentPath), getTree()]);

  if (!doc) {
    notFound();
  }

  const collection = path[0];
  const collectionTree = getCollectionSubtree(tree, collection);

  const siblings = collectionTree ? flattenFiles(collectionTree) : [];
  const currentIndex = siblings.findIndex((n) => n.path === contentPath);
  const prevDoc = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextDoc = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  const breadcrumbs: { label: string; href?: string }[] = [{ label: 'Home', href: '/' }];
  let accumulated = '';
  for (let i = 0; i < path.length; i++) {
    accumulated += (i > 0 ? '/' : '') + path[i];
    const isLast = i === path.length - 1;
    const label = path[i]
      .replace(/\.md$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    breadcrumbs.push(isLast ? { label } : { label, href: `/${accumulated}` });
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    description: stripMarkdown(doc.markdown).slice(0, 160),
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://vector.jdok.dev'}/${contentPath}`,
    ...(doc.lastModified && { dateModified: doc.lastModified }),
    publisher: { '@type': 'Organization', name: 'Vector' },
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex min-h-screen">
        {collectionTree && <DocumentSidebar tree={collectionTree} currentPath={contentPath} />}

        <main id="main-content" className="flex-1 min-w-0 px-6 py-12 max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400 mb-8 flex flex-wrap gap-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-gray-700 dark:hover:text-gray-300">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-600 dark:text-gray-300">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          <header className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">{doc.title}</h1>
            {doc.lastModified && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last modified {formatDate(doc.lastModified)}
              </div>
            )}
          </header>

          <MarkdownContent markdown={doc.markdown} />

          {(prevDoc || nextDoc) && (
            <nav className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              {prevDoc ? (
                <Link href={`/${prevDoc.path}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  &larr; {prevDoc.displayName}
                </Link>
              ) : (
                <span />
              )}
              {nextDoc ? (
                <Link href={`/${nextDoc.path}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  {nextDoc.displayName} &rarr;
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </main>
      </div>
    </>
  );
}
