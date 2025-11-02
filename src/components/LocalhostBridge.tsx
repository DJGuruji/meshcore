/**
 * Localhost Fetch Bridge Component
 * 
 * This component runs in the browser and listens for WebSocket commands
 * to execute local fetch requests.
 * 
 * Two modes:
 * 1. Direct fetch (HTTP->HTTP in local dev)
 * 2. Proxy mode (HTTPS production via /api/localhost-proxy)
 */

'use client';

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface LocalhostRequest {
  requestId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  params: Array<{ key: string; value: string; enabled: boolean }>;
  body?: any;
  auth?: any;
}

interface Props {
  socket: Socket | null;
  isReady: boolean;
}

export default function LocalhostBridge({ socket, isReady }: Props) {
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket || !isReady) {
      return;
    }

    // Listen for performFetch commands from relay server
    const handlePerformFetch = async (request: LocalhostRequest) => {
      // Prevent duplicate processing
      if (processingRef.current.has(request.requestId)) {
        console.warn(`[LocalhostBridge] Request ${request.requestId} already processing`);
        return;
      }

      processingRef.current.add(request.requestId);
      console.log(`[LocalhostBridge] Executing local fetch: ${request.method} ${request.url}`);

      const startTime = Date.now();

      try {
        // Build URL with query parameters
        const finalUrl = new URL(request.url);
        request.params.filter(p => p.enabled).forEach(p => {
          finalUrl.searchParams.append(p.key, p.value);
        });

        // Build headers
        const requestHeaders: Record<string, string> = {};
        Object.entries(request.headers).forEach(([key, value]) => {
          if (value) {
            requestHeaders[key] = value;
          }
        });

        // Add authentication headers
        if (request.auth && request.auth.type !== 'none') {
          switch (request.auth.type) {
            case 'basic':
              const basicAuth = btoa(
                `${request.auth.basic?.username}:${request.auth.basic?.password}`
              );
              requestHeaders['Authorization'] = `Basic ${basicAuth}`;
              break;

            case 'bearer':
              requestHeaders['Authorization'] = `Bearer ${request.auth.bearer?.token}`;
              break;

            case 'api-key':
              if (request.auth.apiKey?.addTo === 'header') {
                requestHeaders[request.auth.apiKey.key] = request.auth.apiKey.value;
              } else {
                finalUrl.searchParams.append(
                  request.auth.apiKey?.key || '',
                  request.auth.apiKey?.value || ''
                );
              }
              break;
          }
        }

        // Build request body
        let requestBody = null;
        if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
          if (request.body.type === 'json' && request.body.json) {
            requestBody = request.body.json;
            if (!requestHeaders['Content-Type']) {
              requestHeaders['Content-Type'] = 'application/json';
            }
          } else if (request.body.type === 'raw' && request.body.raw) {
            requestBody = request.body.raw;
          }
        }

        // Execute fetch directly
        // Note: This will work in browser because it's the user's localhost
        const response = await fetch(finalUrl.toString(), {
          method: request.method.toUpperCase(),
          headers: requestHeaders,
          body: requestBody,
        });

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

        // Send successful response back to relay
        socket.emit('localhost:fetchComplete', {
          requestId: request.requestId,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody,
          time: endTime - startTime,
          size: responseSize,
          timestamp: new Date().toISOString(),
        });

        console.log(`[LocalhostBridge] Fetch completed: ${response.status} in ${endTime - startTime}ms`);
      } catch (error: any) {
        const endTime = Date.now();
        console.error('[LocalhostBridge] Fetch error:', error.name);

        // Check if this is a mixed content error (HTTPS -> HTTP)
        const isMixedContent = error.message?.includes('NetworkError') || 
                              error.message?.includes('fetch') ||
                              error.message?.includes('Mixed Content') ||
                              (error instanceof TypeError && error.message.includes('fetch'));
        
        let errorMessage = error.message || 'Failed to execute local fetch';
        
        if (isMixedContent && window.location.protocol === 'https:') {
          errorMessage = 
            'Mixed Content Blocked: HTTPS page cannot fetch HTTP localhost\n\n' +
            'The request is now being routed through our server-side proxy automatically.\n' +
            'If you see this error, the proxy may have failed.\n\n' +
            'Alternative solutions:\n' +
            '1. Setup HTTPS on localhost (recommended):\n' +
            '   - Use mkcert or ngrok\n' +
            '2. Run app locally:\n' +
            '   - Add sadasya.vercel.app to allowed origins when testing localhost API';
        }

        // Send error response back to relay
        socket.emit('localhost:fetchError', {
          requestId: request.requestId,
          error: errorMessage,
        });
      } finally {
        processingRef.current.delete(request.requestId);
      }
    };

    // Register listener
    socket.on('localhost:performFetch', handlePerformFetch);

    // Cleanup
    return () => {
      socket.off('localhost:performFetch', handlePerformFetch);
    };
  }, [socket, isReady]);

  // This component doesn't render anything visible
  return null;
}
