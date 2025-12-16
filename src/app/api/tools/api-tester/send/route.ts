import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Enable Edge Runtime
export const runtime = 'edge';

// API Tester - Send HTTP Request (Edge Runtime)
export async function POST(request: NextRequest) {
  try {
    // Use JWT token instead of session for Edge compatibility
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      method = 'GET',
      url,
      headers = [],
      params = [],
      requestBody,
      auth,
      graphqlQuery,
      graphqlVariables
    } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Check if trying to access localhost from production
    // Allow localhost access when the app itself is running on localhost
    const urlLower = url.toLowerCase();
    const isLocalhostUrl = urlLower.includes('localhost') || 
                          urlLower.includes('127.0.0.1') ||
                          urlLower.match(/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/);
    
    // Check if the app is running on localhost (development mode)
    const isAppRunningLocally = process.env.NODE_ENV === 'development' || 
                               (typeof process.env.VERCEL_ENV === 'undefined' && typeof process.env.NEXT_PUBLIC_VERCEL_URL === 'undefined');

    if (isLocalhostUrl && !isAppRunningLocally) {
      return NextResponse.json({
        error: true,
        message: "Cannot access localhost/local network from production server.\n\nℹ️ Localhost URLs only work when testing from localhost (development mode).\n\nTo test localhost APIs:\n1. Run this app locally (npm run dev)\n2. Access at http://localhost:3000\n3. Then test your localhost APIs\n\nAlternative: Use tools like ngrok to expose your local API publicly.",
        time: 0,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    const startTime = Date.now();

    try {
      // Build URL with query parameters
      const finalUrl = new URL(url);
      params.filter((p: any) => p.enabled).forEach((p: any) => {
        finalUrl.searchParams.append(p.key, p.value);
      });

      // Build headers
      const requestHeaders: HeadersInit = {};
      headers.filter((h: any) => h.enabled).forEach((h: any) => {
        requestHeaders[h.key] = h.value;
      });

      // Add authentication headers
      if (auth && auth.type !== 'none') {
        switch (auth.type) {
          case 'basic':
            // Use btoa instead of Buffer for Edge compatibility
            const basicAuth = btoa(`${auth.basic.username}:${auth.basic.password}`);
            requestHeaders['Authorization'] = `Basic ${basicAuth}`;
            break;
          
          case 'bearer':
            requestHeaders['Authorization'] = `Bearer ${auth.bearer.token}`;
            break;
          
          case 'api-key':
            if (auth.apiKey.addTo === 'header') {
              requestHeaders[auth.apiKey.key] = auth.apiKey.value;
            } else {
              finalUrl.searchParams.append(auth.apiKey.key, auth.apiKey.value);
            }
            break;
        }
      }

      // Build request options
      const requestOptions: RequestInit = {
        method: method.toUpperCase(),
        headers: requestHeaders,
      };

      // Add body for non-GET requests
      if (method !== 'GET' && method !== 'HEAD') {
        // Check if this is a GraphQL request
        if (graphqlQuery) {
          // GraphQL request
          requestOptions.body = JSON.stringify({
            query: graphqlQuery,
            variables: graphqlVariables ? JSON.parse(graphqlVariables) : {}
          });
          if (!requestHeaders['Content-Type']) {
            requestHeaders['Content-Type'] = 'application/json';
          }
        } else if (requestBody) {
          
          if (requestBody.type === 'json' && requestBody.json) {
            requestOptions.body = requestBody.json;
            if (!requestHeaders['Content-Type']) {
              requestHeaders['Content-Type'] = 'application/json';
            }
          } else if (requestBody.type === 'xml' && requestBody.xml) {
            requestOptions.body = requestBody.xml;
            if (!requestHeaders['Content-Type']) {
              requestHeaders['Content-Type'] = 'application/xml';
            }
          } else if (requestBody.type === 'text' && requestBody.text) {
            requestOptions.body = requestBody.text;
            if (!requestHeaders['Content-Type']) {
              requestHeaders['Content-Type'] = 'text/plain';
            }
          } else if (requestBody.type === 'raw' && requestBody.raw) {
            requestOptions.body = requestBody.raw;
          } else if (requestBody.type === 'form-data' && requestBody.formData) {
            const formData = new FormData();
            requestBody.formData.filter((f: any) => f.enabled).forEach((f: any) => {
              // Check if this is a file field (starts with [FILE])
              if (f.value.startsWith('[FILE] ')) {
                // For file fields, we would normally attach the actual file
                // But in this edge runtime, we can't process file uploads
                // We'll just send the filename as a placeholder
                formData.append(f.key, f.value.substring(7)); // Remove "[FILE] " prefix
              } else {
                formData.append(f.key, f.value);
              }
            });
            requestOptions.body = formData as any;          } else if (requestBody.type === 'x-www-form-urlencoded' && requestBody.formUrlEncoded) {
            const urlEncoded = new URLSearchParams();
            requestBody.formUrlEncoded.filter((f: any) => f.enabled).forEach((f: any) => {
              urlEncoded.append(f.key, f.value);
            });
            requestOptions.body = urlEncoded;
            requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
          } else if (requestBody.type === 'binary' && requestBody.binary) {
            // For binary data, we'll treat it as a base64 string that needs to be decoded
            try {
              const binaryData = atob(requestBody.binary);
              const bytes = new Uint8Array(binaryData.length);
              for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
              }
              requestOptions.body = bytes;
            } catch (e) {
              // If not valid base64, send as-is
              requestOptions.body = requestBody.binary;
            }
          }
        }
      }      // Send request
      const response = await fetch(finalUrl.toString(), requestOptions);
      const endTime = Date.now();

      // Get response body
      const contentType = response.headers.get('content-type') || '';
      let responseBody: any;
      let responseText = '';

      try {
        responseText = await response.text();
        if (contentType.includes('application/json')) {
          responseBody = JSON.parse(responseText);
        } else {
          responseBody = responseText;
        }
      } catch (e) {
        responseBody = responseText;
      }

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Calculate response size
      const responseSize = new Blob([responseText]).size;

      // Save to history asynchronously (fire-and-forget)
      // This doesn't block the response
      const historyData = {
        method: method.toUpperCase(),
        url: finalUrl.toString(),
        statusCode: response.status,
        responseTime: endTime - startTime,
        responseSize,
        requestData: {
          headers: headers.filter((h: any) => h.enabled),
          params: params.filter((p: any) => p.enabled),
          body: requestBody,
          auth: auth,
          graphqlQuery: graphqlQuery,
          graphqlVariables: graphqlVariables
        }
      };

      // Async history save - don't await
      fetch(new URL('/api/tools/api-tester/history', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward the cookie for authentication
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify(historyData)
      }).catch(err => {
        // Log error but don't fail the request
      });

      return NextResponse.json({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: endTime - startTime,
        size: responseSize,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      const endTime = Date.now();
      
      return NextResponse.json({
        error: true,
        message: error.message || 'Request failed',
        time: endTime - startTime,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}