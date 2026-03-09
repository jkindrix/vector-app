import Link from 'next/link';
import { Library, FileText, ArrowRight } from 'lucide-react';
import { listCollections } from '@/lib/content';
import type { CollectionSummary } from '@/lib/content';
import { Header } from '@/components/Header';

export const revalidate = 60;

function CollectionCard({ item }: { item: CollectionSummary }) {
  const isCollection = item.type === 'collection';

  return (
    <Link href={`/${item.path}`} className="group block">
      <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                isCollection
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              {isCollection ? <Library className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.displayName}
              </h2>
              <span
                className={`inline-block text-xs px-1.5 py-0.5 rounded mt-1 ${
                  isCollection
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                {isCollection ? 'Collection' : 'Document'}
              </span>
              {item.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2 line-clamp-3">
                  {item.description}
                </p>
              )}
              {(item.documentCount || item.lastModified) && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {item.documentCount && item.documentCount > 1 && <span>{item.documentCount} documents</span>}
                  {item.documentCount && item.documentCount > 1 && item.lastModified && <span> &middot; </span>}
                  {item.lastModified && (
                    <span>
                      Updated{' '}
                      {new Date(item.lastModified).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 shrink-0 mt-2 transition-colors" />
        </div>
      </article>
    </Link>
  );
}

export default async function HomePage() {
  let collections: CollectionSummary[] = [];
  let error: string | null = null;

  try {
    collections = await listCollections();
  } catch {
    error = 'Unable to load collections. Please try again later.';
  }

  return (
    <>
      <Header />
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Vector</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-10">
          Explore collections of research, frameworks, and references.
        </p>

        {error ? (
          <p className="text-red-600 dark:text-red-400 py-12 text-center">{error}</p>
        ) : collections.length === 0 ? (
          <div className="py-16 text-center">
            <Library className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-1">No collections yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Research papers and documents will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {collections.map((item) => (
              <CollectionCard key={item.path} item={item} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
