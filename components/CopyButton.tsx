'use client';

import { useState } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-2 rounded bg-gray-200/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={copied ? 'Copied to clipboard' : 'Copy code'}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      {copied && (
        <span className="sr-only" role="status" aria-live="polite">
          Code copied to clipboard
        </span>
      )}
    </>
  );
}
