'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
