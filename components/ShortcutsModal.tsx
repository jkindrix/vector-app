'use client';

import { useState, useEffect } from 'react';

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Open search' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close modal / sidebar' },
];

const adminShortcuts = [{ keys: ['⌘', 'S'], description: 'Save document' }];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.includes('Mac'));
    setIsAdmin(window.location.pathname.startsWith('/admin'));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === '?' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  const mod = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="fixed top-[20%] left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
            >
              <kbd className="border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-xs">esc</kbd>
            </button>
          </div>
          <div className="p-4 space-y-3">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">{s.description}</span>
                <span className="flex gap-1">
                  {s.keys.map((k, j) => (
                    <kbd
                      key={j}
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-gray-500 dark:text-gray-400 min-w-[1.5rem] text-center"
                    >
                      {k === '⌘' ? mod : k}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Editor</p>
                </div>
                {adminShortcuts.map((s, i) => (
                  <div key={`admin-${i}`} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{s.description}</span>
                    <span className="flex gap-1">
                      {s.keys.map((k, j) => (
                        <kbd
                          key={j}
                          className="text-xs border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-gray-500 dark:text-gray-400 min-w-[1.5rem] text-center"
                        >
                          {k === '⌘' ? mod : k}
                        </kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
