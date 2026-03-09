import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContent, getTree, getAllFiles, getCollectionInfo } from '@/lib/content';
import type { TreeNode } from '@/lib/content';
import { Library, FileText } from 'lucide-react';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function generateStaticParams() {
  const files = await getAllFiles();
  return files.map((f) => ({
    path: f.replace(/\.md$/, '').split('/'),
  }));
}
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
const MarkdownContent = dynamic(() => import('@/components/MarkdownContent').then((m) => m.MarkdownContent), {
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
    </div>
  ),
});
import { DocumentSidebar } from '@/components/DocumentSidebar';
import { Footer } from '@/components/Footer';
import { ReadingProgress } from '@/components/ReadingProgress';
import { DocumentHistory } from '@/components/DocumentHistory';
import { PageViewTracker } from '@/components/PageViewTracker';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { CollectionDocList } from '@/components/CollectionDocList';

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

  // Check if this is a collection
  const collection = await getCollectionInfo(contentPath);
  if (collection) {
    const description = collection.description || `${collection.documentCount} documents in ${collection.displayName}`;
    return {
      title: `${collection.displayName} - Vector`,
      description,
      openGraph: { title: `${collection.displayName} - Vector`, description, type: 'website' },
    };
  }

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

  // Check if this path is a collection (directory)
  const collectionInfo = await getCollectionInfo(contentPath);
  if (collectionInfo) {
    return <CollectionLandingPage collectionInfo={collectionInfo} path={path} />;
  }

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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vector.jdok.dev';

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    description: stripMarkdown(doc.markdown).slice(0, 160),
    url: `${baseUrl}/${contentPath}`,
    ...(doc.lastModified && { dateModified: doc.lastModified }),
    publisher: { '@type': 'Organization', name: 'Vector' },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      ...(crumb.href && { item: `${baseUrl}${crumb.href}` }),
    })),
  };

  return (
    <>
      <Header />
      <ReadingProgress />
      <PageViewTracker path={contentPath} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="flex min-h-screen">
        {collectionTree && <DocumentSidebar tree={collectionTree} currentPath={contentPath} />}

        <main
          id="main-content"
          className={`flex-1 min-w-0 px-6 py-12 ${collectionTree ? 'max-w-4xl' : 'max-w-3xl mx-auto'}`}
        >
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
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              {doc.lastModified && (
                <time dateTime={doc.lastModified}>Last modified {formatDate(doc.lastModified)}</time>
              )}
              {doc.lastModified && <span>&middot;</span>}
              <span>{Math.max(1, Math.round(doc.markdown.split(/\s+/).length / 230))} min read</span>
            </div>
          </header>

          <MarkdownContent markdown={doc.markdown} />

          <FeedbackWidget path={contentPath} />

          {process.env.NEXT_PUBLIC_EDIT_URL && (
            <div className="mt-8">
              <a
                href={`${process.env.NEXT_PUBLIC_EDIT_URL}/${contentPath}.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Edit this page &rarr;
              </a>
            </div>
          )}

          <DocumentHistory filePath={contentPath} />

          {(prevDoc || nextDoc) && (
            <nav
              aria-label="Previous and next documents"
              className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-between"
            >
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

function CollectionLandingPage({
  collectionInfo,
  path,
}: {
  collectionInfo: Awaited<ReturnType<typeof getCollectionInfo>> & {};
  path: string[];
}) {
  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  const breadcrumbs: { label: string; href?: string }[] = [{ label: 'Home', href: '/' }];
  let accumulated = '';
  for (let i = 0; i < path.length; i++) {
    accumulated += (i > 0 ? '/' : '') + path[i];
    const isLast = i === path.length - 1;
    const label = path[i].replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    breadcrumbs.push(isLast ? { label } : { label, href: `/${accumulated}` });
  }

  return (
    <>
      <Header />
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-12">
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
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Library className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {collectionInfo.displayName}
            </h1>
          </div>
          {collectionInfo.description && (
            <p className="text-gray-600 dark:text-gray-400">{collectionInfo.description}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {collectionInfo.documentCount} document{collectionInfo.documentCount !== 1 ? 's' : ''}
            {collectionInfo.lastModified && (
              <>
                {' '}
                &middot;{' '}
                <time dateTime={collectionInfo.lastModified}>
                  Last updated {formatDate(collectionInfo.lastModified)}
                </time>
              </>
            )}
          </p>
        </header>

        <CollectionDocList documents={collectionInfo.documents} />
      </main>
      <Footer />
    </>
  );
}
