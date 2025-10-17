import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Meta Tag Inspector API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    try {
      // Fetch the webpage
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        return NextResponse.json({ 
          error: 'Failed to fetch URL',
          status: response.status
        }, { status: 400 });
      }

      const html = await response.text();

      // Parse meta tags
      const metaTags = parseMetaTags(html);
      const openGraph = parseOpenGraph(html);
      const twitter = parseTwitterCards(html);
      const title = parseTitle(html);
      const description = parseDescription(html);

      return NextResponse.json({
        url,
        title,
        description,
        metaTags,
        openGraph,
        twitter,
        message: 'Meta tags extracted successfully'
      });

    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch or parse URL',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function parseMetaTags(html: string): any[] {
  const metaRegex = /<meta\s+([^>]*?)>/gi;
  const tags: any[] = [];
  let match;

  while ((match = metaRegex.exec(html)) !== null) {
    const attrs = match[1];
    const tag: any = {};

    const nameMatch = attrs.match(/name=["']([^"']+)["']/i);
    const contentMatch = attrs.match(/content=["']([^"']+)["']/i);
    const propertyMatch = attrs.match(/property=["']([^"']+)["']/i);

    if (nameMatch) tag.name = nameMatch[1];
    if (propertyMatch) tag.property = propertyMatch[1];
    if (contentMatch) tag.content = contentMatch[1];

    if (Object.keys(tag).length > 0) {
      tags.push(tag);
    }
  }

  return tags;
}

function parseOpenGraph(html: string): any {
  const ogRegex = /<meta\s+property=["']og:([^"']+)["']\s+content=["']([^"']+)["']/gi;
  const og: any = {};
  let match;

  while ((match = ogRegex.exec(html)) !== null) {
    og[match[1]] = match[2];
  }

  return og;
}

function parseTwitterCards(html: string): any {
  const twitterRegex = /<meta\s+name=["']twitter:([^"']+)["']\s+content=["']([^"']+)["']/gi;
  const twitter: any = {};
  let match;

  while ((match = twitterRegex.exec(html)) !== null) {
    twitter[match[1]] = match[2];
  }

  return twitter;
}

function parseTitle(html: string): string | null {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

function parseDescription(html: string): string | null {
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  return descMatch ? descMatch[1] : null;
}
