'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function FeedbackWidget({ path }: { path: string }) {
  const [status, setStatus] = useState<Status>('idle');

  const submit = async (helpful: boolean) => {
    setStatus('submitting');
    try {
      const res = await fetch('/api/analytics/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, helpful }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        Thanks for your feedback!
      </div>
    );
  }

  return (
    <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
      {status === 'error' ? (
        <>
          <span className="text-sm text-red-600 dark:text-red-400">Failed to submit feedback.</span>
          <button
            onClick={() => setStatus('idle')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        </>
      ) : (
        <>
          <span className="text-sm text-gray-500 dark:text-gray-400">Was this helpful?</span>
          <button
            onClick={() => submit(true)}
            disabled={status === 'submitting'}
            className="p-2 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50"
            aria-label="Yes, this was helpful"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => submit(false)}
            disabled={status === 'submitting'}
            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50"
            aria-label="No, this was not helpful"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
