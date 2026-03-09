'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Search } from 'lucide-react';

interface CollectionDoc {
  path: string;
  displayName: string;
  lastModified?: string;
}

export function CollectionDocList({ documents }: { documents: CollectionDoc[] }) {
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? documents.filter((d) => d.displayName.toLowerCase().includes(filter.toLowerCase()))
    : documents;

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  return (
    <>
      {documents.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter documents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter documents"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-8 text-center text-sm">
          No documents matching &ldquo;{filter}&rdquo;
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <Link
              key={doc.path}
              href={`/${doc.path}`}
              className="group flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-gray-500 dark:text-gray-500 shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {doc.displayName}
                </span>
              </div>
              {doc.lastModified && (
                <time dateTime={doc.lastModified} className="text-xs text-gray-500 dark:text-gray-500 shrink-0 ml-4">
                  {formatDate(doc.lastModified)}
                </time>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
