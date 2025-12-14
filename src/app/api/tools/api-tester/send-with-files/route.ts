import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db';
import { ApiTesterHistory } from '@/lib/models';

// Enable Node.js runtime for file handling
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST - Send HTTP Request with file uploads
export async function POST(request: NextRequest) {
  try {
    // Use JWT token instead of session for compatibility
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    
    // Get request metadata
    const requestMetadataStr = formData.get('request') as string;
    if (!requestMetadataStr) {
      return NextResponse.json({ error: 'Request metadata is required' }, { status: 400 });
    }
    
    const requestMetadata = JSON.parse(requestMetadataStr);
    const { 
      method = 'GET',
      url,
      headers = [],
      params = [],
      auth
    } = requestMetadata;

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
        // Handle form-data with files
        const bodyType = formData.get('bodyType') as string;
        
        if (bodyType === 'form-data') {
          // Use the formData directly (it already contains files)
          // Remove metadata fields to avoid sending them as form fields
          const cleanFormData = new FormData();
          for (const [key, value] of formData.entries()) {
            if (key !== 'request' && key !== 'bodyType') {
              cleanFormData.append(key, value);
            }
          }
          requestOptions.body = cleanFormData;
        } else if (bodyType === 'binary') {
          // Handle binary file
          const binaryFile = formData.get('binaryFile');
          if (binaryFile && binaryFile instanceof Blob) {
            requestOptions.body = binaryFile;
          }
        }
      }

      // Send request
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

      // Save to history
      try {
        await connectDB();
        const historyEntry = new ApiTesterHistory({
          method: method.toUpperCase(),
          url: finalUrl.toString(),
          statusCode: response.status,
          responseTime: endTime - startTime,
          responseSize,
          user: token.sub,
          requestData: {
            headers: headers.filter((h: any) => h.enabled),
            params: params.filter((p: any) => p.enabled),
            // Note: We don't save file data in history for security reasons
            body: { type: formData.get('bodyType') },
            auth: auth
          }
        });
        await historyEntry.save();
      } catch (historyError) {
        // Log error but don't fail the request
      }

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