import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { SearchPageContent } from './SearchPageContent';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search Vector research papers and documents.',
};

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Suspense fallback={<div className="text-zinc-400">Loading...</div>}>
          <SearchPageContent />
        </Suspense>
      </main>
    </>
  );
}
