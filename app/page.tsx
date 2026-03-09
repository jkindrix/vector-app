import { listCollections, getRecentlyUpdated } from '@/lib/content';
import { Header } from '@/components/Header';
import { HomeContent } from '@/components/HomeContent';

export const revalidate = 60;

export default async function HomePage() {
  let error: string | null = null;

  const [collections, recentDocs] = await Promise.all([
    listCollections().catch(() => {
      error = 'Unable to load collections. Please try again later.';
      return [];
    }),
    getRecentlyUpdated(8).catch(() => []),
  ]);

  return (
    <>
      <Header />
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Vector</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-10">
          Explore collections of research, frameworks, and references.
        </p>

        {error ? (
          <p className="text-red-600 dark:text-red-400 py-12 text-center">{error}</p>
        ) : (
          <HomeContent collections={collections} recentDocs={recentDocs} />
        )}
      </main>
    </>
  );
}
