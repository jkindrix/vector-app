export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-3 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-8" />
      <div className="h-8 w-80 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
      <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-10" />
      <div className="space-y-4">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    </div>
  );
}
