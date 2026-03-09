import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { contentApi } from '../services/api';
import { SearchResult } from '../types';
import { SEO } from './SEO';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await contentApi.search(q.trim());
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      setSearchParams({ q });
      doSearch(q);
    }
  };

  const resultPath = (filePath: string) => {
    const stripped = filePath.replace(/\.md$/, '');
    return `/${stripped}`;
  };

  return (
    <>
      <SEO title="Search - Vector" description="Search content" />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Search</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-600" />
            <label htmlFor="search-input" className="sr-only">Search content</label>
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </form>

        <div aria-live="polite">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : searched && results.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No results found for &ldquo;{searchParams.get('q')}&rdquo;.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {results.map(result => (
              <article key={result.file_path} className="py-5 first:pt-0">
                <Link to={resultPath(result.file_path)} className="group">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                    {result.title}
                  </h2>
                </Link>
                <div className="flex items-center gap-2 mb-1">
                  {result.collection && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {result.collection}
                    </span>
                  )}
                </div>
                {result.snippet && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                    {result.snippet}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default SearchPage;
