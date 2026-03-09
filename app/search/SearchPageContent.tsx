'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface SearchResult {
  file_path: string;
  title: string;
  collection: string | null;
  snippet: string;
}

export function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;
  const urlUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync URL with search query (debounced)
  useEffect(() => {
    if (urlUpdateRef.current) clearTimeout(urlUpdateRef.current);
    urlUpdateRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      const url = params.toString() ? `?${params.toString()}` : '/search';
      router.replace(url, { scroll: false });
    }, 300);
    return () => {
      if (urlUpdateRef.current) clearTimeout(urlUpdateRef.current);
    };
  }, [query, router]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=${limit}&offset=${page * limit}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setResults([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [query, page]);

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Search</h1>
      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg px-4 mb-8">
        <Search className="w-5 h-5 text-gray-500 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search documents..."
          className="w-full py-3 px-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          autoFocus
        />
      </div>

      {loading && (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 py-12 text-center">No results for &ldquo;{query}&rdquo;</p>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {total} result{total !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
          </p>
          <div className="space-y-4">
            {results.map((result) => (
              <Link
                key={result.file_path}
                href={'/' + result.file_path.replace(/\.md$/, '')}
                className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{result.title}</h2>
                {result.collection && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 mr-2">
                    {result.collection}
                  </span>
                )}
                {result.snippet && (
                  <p
                    className="text-sm text-gray-600 dark:text-gray-300 mt-2"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                )}
              </Link>
            ))}
          </div>

          {total > limit && (
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50 min-h-[44px]"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * limit >= total}
                className="px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50 min-h-[44px]"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
