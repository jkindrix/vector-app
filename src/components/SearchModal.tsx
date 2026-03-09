import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { contentApi } from '../services/api';
import { SearchResult } from '../types';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input on open, reset state on close
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'input, button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await contentApi.search(q.trim(), 8);
      setResults(data.results);
      setActiveIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 200);
  };

  const navigateToResult = (result: SearchResult) => {
    const path = '/' + result.file_path.replace(/\.md$/, '');
    onClose();
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      navigateToResult(results[activeIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-[15%] left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full max-w-lg">
        <div ref={modalRef} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Input */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search documents..."
              className="w-full py-3 px-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none"
              aria-label="Search documents"
              aria-activedescendant={results[activeIndex] ? `search-result-${activeIndex}` : undefined}
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="search-results"
              aria-autocomplete="list"
            />
            <kbd className="hidden sm:inline-block text-xs text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div id="search-results" role="listbox" aria-live="polite" className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-center">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}

            {!loading && query.trim() && results.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}

            {!loading && results.map((result, i) => (
              <button
                key={result.file_path}
                id={`search-result-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => navigateToResult(result)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full text-left px-4 py-3 flex flex-col transition-colors ${
                  i === activeIndex
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {result.title}
                </span>
                <span className="flex items-center gap-2 mt-0.5">
                  {result.collection && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {result.collection}
                    </span>
                  )}
                  {result.snippet && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {result.snippet}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Footer */}
          {!loading && query.trim() && results.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                <kbd className="border border-gray-200 dark:border-gray-700 rounded px-1 mr-1">&uarr;</kbd>
                <kbd className="border border-gray-200 dark:border-gray-700 rounded px-1 mr-1">&darr;</kbd>
                to navigate
                <kbd className="border border-gray-200 dark:border-gray-700 rounded px-1 mx-1">&crarr;</kbd>
                to open
              </span>
              <button
                onClick={handleViewAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
