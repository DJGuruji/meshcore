import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { ApiTesterHistory } from '@/lib/models';

// API Tester - Send HTTP Request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
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
    const urlLower = url.toLowerCase();
    const isLocalhostUrl = urlLower.includes('localhost') || 
                          urlLower.includes('127.0.0.1') ||
                          urlLower.match(/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/);                      
    
    if (isLocalhostUrl) {
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
            const basicAuth = Buffer.from(`${auth.basic.username}:${auth.basic.password}`).toString('base64');
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
          } else if (requestBody.type === 'raw' && requestBody.raw) {
            requestOptions.body = requestBody.raw;
          } else if (requestBody.type === 'form-data' && requestBody.formData) {
            const formData = new FormData();
            requestBody.formData.filter((f: any) => f.enabled).forEach((f: any) => {
              formData.append(f.key, f.value);
            });
            requestOptions.body = formData as any;
          } else if (requestBody.type === 'x-www-form-urlencoded' && requestBody.formData) {
            const urlEncoded = new URLSearchParams();
            requestBody.formData.filter((f: any) => f.enabled).forEach((f: any) => {
              urlEncoded.append(f.key, f.value);
            });
            requestOptions.body = urlEncoded;
            requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
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
        const userId = (session.user as any).id || (session.user as any)._id;
        
        if (userId) {
          await ApiTesterHistory.create({
            method: method.toUpperCase(),
            url: finalUrl.toString(),
            statusCode: response.status,
            responseTime: endTime - startTime,
            responseSize,
            timestamp: new Date(),
            user: userId,
            requestData: {
              headers: headers.filter((h: any) => h.enabled),
              params: params.filter((p: any) => p.enabled),
              body: requestBody,
              auth: auth,
              // Add GraphQL data to history if present
              graphqlQuery: graphqlQuery,
              graphqlVariables: graphqlVariables
            }
          });
        }
      } catch (historyError) {
        console.error('Failed to save request history:', historyError);
        // Don't fail the request if history save fails
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