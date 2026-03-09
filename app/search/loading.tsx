export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-lg mb-8" />
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-5 w-64 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded mb-1" />
            <div className="h-3 w-4/5 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
