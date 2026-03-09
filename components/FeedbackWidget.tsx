'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export function FeedbackWidget({ path }: { path: string }) {
  const [submitted, setSubmitted] = useState(false);

  const submit = (helpful: boolean) => {
    setSubmitted(true);
    fetch('/api/analytics/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, helpful }),
    }).catch(() => {});
  };

  if (submitted) {
    return (
      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        Thanks for your feedback!
      </div>
    );
  }

  return (
    <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
      <span className="text-sm text-gray-500 dark:text-gray-400">Was this helpful?</span>
      <button
        onClick={() => submit(true)}
        className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Yes, this was helpful"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => submit(false)}
        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="No, this was not helpful"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}
