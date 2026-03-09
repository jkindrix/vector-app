'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>&copy; {new Date().getFullYear()} Vector</span>
        <nav aria-label="Footer navigation" className="flex items-center gap-4">
          <Link href="/feed.xml" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            RSS
          </Link>
          <button
            className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
            aria-label="Show keyboard shortcuts"
          >
            Shortcuts <kbd className="ml-0.5 border border-gray-200 dark:border-gray-700 rounded px-1">?</kbd>
          </button>
        </nav>
      </div>
    </footer>
  );
}
