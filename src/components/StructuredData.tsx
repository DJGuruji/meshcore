'use client';

import Script from 'next/script';
import { siteConfig } from '@/lib/seoConfig';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteConfig.name,
  url: siteConfig.url,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  description: siteConfig.description,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '128',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  keywords: siteConfig.keywords.join(', '),
};

const organizationData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  sameAs: Object.values(siteConfig.socials).filter(Boolean),
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@anytimerequest.com',
  },
};

export default function StructuredData() {
  return (
    <>
      <Script id="ld-json-software" type="application/ld+json">
        {JSON.stringify(structuredData)}
      </Script>
      <Script id="ld-json-organization" type="application/ld+json">
        {JSON.stringify(organizationData)}
      </Script>
    </>
  );
}
