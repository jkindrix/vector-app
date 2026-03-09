'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sun, Moon, Search } from 'lucide-react';
import { SearchModal } from './SearchModal';

export function Header() {
  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.platform.includes('Mac'));
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.add('dark-transition');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setTimeout(() => document.documentElement.classList.remove('dark-transition'), 300);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-gray-900 dark:text-white">
            Vector
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Search size={16} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Search</span>
              <kbd className="hidden sm:inline-block text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">
                {isMac ? '⌘' : 'Ctrl+'}K
              </kbd>
            </button>
            <button
              onClick={toggleDark}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </nav>
        </div>
      </header>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
