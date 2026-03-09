'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Search, ThumbsUp } from 'lucide-react';

interface PageView {
  file_path: string;
  views: number;
}

interface SearchEntry {
  query: string;
  count: number;
  avg_results: number;
}

interface FeedbackEntry {
  file_path: string;
  helpful: number;
  not_helpful: number;
}

export default function AnalyticsPage() {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [searches, setSearches] = useState<SearchEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((data) => {
        setPageViews(data.pageViews || []);
        setSearches(data.searches || []);
        setFeedback(data.feedback || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">Last 30 days</p>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <BarChart3 className="w-5 h-5" />
          Top Pages
        </h2>
        {pageViews.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No page view data yet.</p>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Page</th>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300 text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {pageViews.map((pv) => (
                  <tr key={pv.file_path} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2 text-gray-900 dark:text-white font-mono text-xs">{pv.file_path}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white text-right tabular-nums">{pv.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <Search className="w-5 h-5" />
          Top Searches
        </h2>
        {searches.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No search data yet.</p>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Query</th>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300 text-right">Searches</th>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300 text-right">Avg Results</th>
                </tr>
              </thead>
              <tbody>
                {searches.map((s) => (
                  <tr key={s.query} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2 text-gray-900 dark:text-white">{s.query}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white text-right tabular-nums">{s.count}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white text-right tabular-nums">{s.avg_results}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
          <ThumbsUp className="w-5 h-5" />
          Document Feedback
        </h2>
        {feedback.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No feedback data yet.</p>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Page</th>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300 text-right">Helpful</th>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300 text-right">Not Helpful</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((f) => (
                  <tr key={f.file_path} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2 text-gray-900 dark:text-white font-mono text-xs">{f.file_path}</td>
                    <td className="px-4 py-2 text-green-600 dark:text-green-400 text-right tabular-nums">
                      {f.helpful}
                    </td>
                    <td className="px-4 py-2 text-red-600 dark:text-red-400 text-right tabular-nums">
                      {f.not_helpful}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
