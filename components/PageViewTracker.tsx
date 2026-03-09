'use client';

import { useEffect } from 'react';

export function PageViewTracker({ path }: { path: string }) {
  useEffect(() => {
    fetch('/api/analytics/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }, [path]);

  return null;
}
