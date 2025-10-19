import { NextRequest, NextResponse } from 'next/server';

/**
 * Localhost Proxy API Route
 * 
 * Proxies requests to localhost APIs from the server-side,
 * bypassing browser CORS and mixed content restrictions.
 * 
 * This allows HTTPS production sites to fetch HTTP localhost APIs
 * without requiring HTTPS setup on localhost or desktop agents.
 * 
 * Security: Only allows localhost/127.0.0.1 URLs
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method, headers, body: requestBody } = body;

    // Validate that URL is localhost
    if (!isLocalhostUrl(url)) {
      return NextResponse.json(
        { 
          error: true, 
          message: 'Only localhost URLs are allowed through this proxy for security reasons' 
        },
        { status: 403 }
      );
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: headers || {},
    };

    // Add body for non-GET requests
    if (method !== 'GET' && method !== 'HEAD' && requestBody) {
      fetchOptions.body = typeof requestBody === 'string' 
        ? requestBody 
        : JSON.stringify(requestBody);
    }

    // Execute fetch from server-side (bypasses CORS!)
    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const endTime = Date.now();

    // Read response
    const contentType = response.headers.get('content-type') || '';
    let responseBody: any;

    try {
      const text = await response.text();
      if (contentType.includes('application/json')) {
        responseBody = JSON.parse(text);
      } else {
        responseBody = text;
      }
    } catch (e) {
      responseBody = await response.text();
    }

    // Convert headers to object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Calculate response size
    const responseSize = new Blob([
      typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)
    ]).size;

    // Return proxied response
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      time: endTime - startTime,
      size: responseSize,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: true,
        message: error.message || 'Failed to proxy request',
        details: 'The localhost API may be offline or unreachable from the server.',
      },
      { status: 500 }
    );
  }
}

/**
 * Check if URL is localhost
 */
function isLocalhostUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost') ||
      hostname.match(/^192\.168\.\d{1,3}\.\d{1,3}$/) !== null ||
      hostname.match(/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) !== null ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/) !== null
    );
  } catch (e) {
    return false;
  }
}
