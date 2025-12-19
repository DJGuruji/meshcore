export const siteConfig = {
  name: 'AnyTimeRequest',
  shortDescription: 'Mock server and API testing workspace',
  description:
    'AnyTimeRequest is the fastest way to spin up a mock REST API online, generate fake JSON, and run authenticated HTTP requests in one collaborative workspace.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://anytimerequest.com',
  keywords: [
    'mock server online',
    'fake API generator',
    'generate dummy API',
    'API request tester',
    'JSON response tester',
    'mock REST API online',
    'HTTP testing tool',
    'API playground',
    'test my API online',
    'fake JSON API',
    'API mock tool',
    'backend-less API tool',
    'API debug UI',
    'request builder tool',
    'REST API tester',
    'API testing automation',
    'JSON API generator',
    'API testing tool',
    'API client',
    'API collection runner'
  ],
  socials: {
    twitter: 'https://twitter.com/anytimerequest',
    github: 'https://github.com/anytimerequest'
  }
};

export const ogImage = `${siteConfig.url}/favicon.png`;
