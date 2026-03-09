'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Library, FileText, ArrowRight, Search, Clock } from 'lucide-react';
import type { CollectionSummary, RecentDocument } from '@/lib/content';

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
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {item.documentCount && item.documentCount > 1 && <span>{item.documentCount} documents</span>}
                  {item.documentCount && item.documentCount > 1 && item.lastModified && <span> &middot; </span>}
                  {item.lastModified && (
                    <time dateTime={item.lastModified}>
                      Updated{' '}
                      {new Date(item.lastModified).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function HomeContent({
  collections,
  recentDocs,
}: {
  collections: CollectionSummary[];
  recentDocs: RecentDocument[];
}) {
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? collections.filter(
        (c) =>
          c.displayName.toLowerCase().includes(filter.toLowerCase()) ||
          c.description?.toLowerCase().includes(filter.toLowerCase()),
      )
    : collections;

  return (
    <>
      {collections.length > 3 && (
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter collections..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter collections"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          {filter ? (
            <p className="text-gray-500 dark:text-gray-400">No collections matching &ldquo;{filter}&rdquo;</p>
          ) : (
            <>
              <Library className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-1">No collections yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Research papers and documents will appear here.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <CollectionCard key={item.path} item={item} />
          ))}
        </div>
      )}

      {recentDocs.length > 0 && !filter && (
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <Clock className="w-5 h-5 text-gray-500" />
            Recently Updated
          </h2>
          <div className="space-y-1">
            {recentDocs.map((doc) => (
              <Link
                key={doc.path}
                href={`/${doc.path}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {doc.displayName}
                  </span>
                  {doc.collection && (
                    <span className="text-xs text-gray-500 dark:text-gray-500 shrink-0">{doc.collection}</span>
                  )}
                </div>
                <time dateTime={doc.lastModified} className="text-xs text-gray-500 dark:text-gray-500 shrink-0 ml-4">
                  {formatDate(doc.lastModified)}
                </time>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
