import { NextRequest, NextResponse } from 'next/server';

/**
 * Localhost Proxy API Route
 * 
 * ⚠️ IMPORTANT LIMITATION:
 * This proxy runs on Vercel's servers (cloud), NOT on the user's machine.
 * Therefore, it CANNOT access the user's localhost services.
 * 
 * This endpoint is kept for potential future use cases:
 * - Self-hosted deployments (where server and localhost are same machine)
 * - Testing scenarios
 * 
 * For production use, the WebSocket relay architecture is the correct solution.
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
        details: 'This proxy runs on Vercel (cloud) and cannot access your localhost. Use the WebSocket relay instead (it works through your browser).',
        technicalReason: 'Vercel servers are in the cloud; localhost on Vercel is not the same as localhost on your machine.',
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
