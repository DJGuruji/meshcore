import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seoConfig';

const importantPaths = [
  '',
  '/pricing',
  '/blog',
  '/use-cases',
  '/api-tester',
  '/graphql-tester',
  '/tools',
  '/docs',
  '/contact',
  '/terms',
  '/privacy',
  '/cancellation-refund',
  '/shipping',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  return importantPaths.map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
