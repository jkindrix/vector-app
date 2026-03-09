import Link from 'next/link';
import { Header } from '@/components/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">404</p>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          This document could not be found.
        </p>
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          &larr; Back to home
        </Link>
      </main>
    </>
  );
}
