'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Revision {
  id: number;
  title: string | null;
  content_length: number;
  edited_by: string | null;
  created_at: string;
}

export function DocumentHistory({ filePath }: { filePath: string }) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || revisions.length > 0) return;
    fetch(`/api/revisions?path=${encodeURIComponent(filePath)}`)
      .then((r) => r.json())
      .then((data) => setRevisions(data.revisions || []))
      .catch(() => {});
  }, [open, filePath, revisions.length]);

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <Clock className="w-4 h-4" />
        Revision history
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-3">
          {revisions.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-500">No revisions recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {revisions.map((rev) => (
                <li key={rev.id} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                  <time dateTime={rev.created_at} className="shrink-0">
                    {new Date(rev.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    {new Date(rev.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </time>
                  {rev.edited_by && <span className="text-gray-500 dark:text-gray-500">by {rev.edited_by}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
