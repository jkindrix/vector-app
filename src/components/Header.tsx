import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { SearchModal } from './SearchModal';

export const Header: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.add('dark-transition');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setTimeout(() => document.documentElement.classList.remove('dark-transition'), 300);
  };

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-gray-900 dark:text-white">
            Vector
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search size={16} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-block text-xs text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'}K
              </kbd>
            </button>
            <button
              onClick={toggleDark}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isAuthenticated && (
              <Link
                to="/admin"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
