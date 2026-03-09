export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
      <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded mb-10" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg shrink-0" />
              <div className="flex-1">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
