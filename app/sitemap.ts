import type { MetadataRoute } from 'next';
import { getAllFiles } from '@/lib/content';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://vector.jdok.dev';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const files = await getAllFiles();

  const contentUrls = files.map((filePath: string) => ({
    url: `${BASE_URL}/${filePath.replace(/\.md$/i, '')}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/search`, changeFrequency: 'daily', priority: 0.5 },
    ...contentUrls,
  ];
}
