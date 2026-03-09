'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="text-center py-16">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">An error occurred in the admin panel.</p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Try again
        </button>
        <Link
          href="/admin/files"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
        >
          Back to files
        </Link>
      </div>
    </div>
  );
}
