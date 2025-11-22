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
import { localhostWorker } from '@/lib/localhostWorker';
import { proxyManager } from '@/lib/proxyManager';

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

  // Register Service Worker and Proxy Manager on mount
  useEffect(() => {
    const registerWorkers = async () => {
      try {
        console.log('[LocalhostBridge] Registering Service Worker...');
        const workerStatus = await localhostWorker.register();
        console.log('[LocalhostBridge] Service Worker registration result:', workerStatus);
        
        console.log('[LocalhostBridge] Registering Proxy Manager...');
        const proxyStatus = await proxyManager.register();
        console.log('[LocalhostBridge] Proxy Manager registration result:', proxyStatus);
        
        if (workerStatus.active) {
          console.log('[LocalhostBridge] ✅ Service Worker active - CORS bypass enabled!');
        }
        if (proxyStatus.active) {
          console.log('[LocalhostBridge] ✅ Proxy Manager active - Additional CORS bypass available!');
        }
      } catch (error) {
        console.error('[LocalhostBridge] Failed to register workers:', error);
      }
    };

    registerWorkers();
  }, []);

  useEffect(() => {
    if (!socket || !isReady) {
      console.log('[LocalhostBridge] Not registering listener - socket or not ready', { socket: !!socket, isReady });
      return;
    }

    console.log('[LocalhostBridge] Registering listener for localhost:performFetch');
    
    // Listen for performFetch commands from relay server
    const handlePerformFetch = async (request: LocalhostRequest) => {
      console.log('[LocalhostBridge] Received localhost:performFetch command', request);
      
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
        request.params.filter((p: any) => p.enabled).forEach((p: any) => {
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

        // Check if we should use the proxy manager for this request
        const shouldUseProxy = proxyManager.shouldProxy(finalUrl.toString());
        const proxyStatus = proxyManager.getStatus();
        
        // Check if Service Worker is active
        let workerStatus = localhostWorker.getStatus();
        
        console.log('[LocalhostBridge] Worker status:', workerStatus);
        console.log('[LocalhostBridge] Proxy status:', proxyStatus);
        
        if (proxyStatus.active && shouldUseProxy) {
          console.log('[LocalhostBridge] 🚀 Executing via Proxy Manager:', request.method, request.url);
          
          try {
            // Execute via Proxy Manager (bypasses CORS!)
            const result = await proxyManager.executeRequest({
              url: finalUrl.toString(),
              method: request.method,
              headers: requestHeaders,
              body: requestBody,
            });

            const endTime = Date.now();
            console.log('[LocalhostBridge] 🔓 Using Proxy Manager - No CORS restrictions!');

            // Send successful response back to relay
            socket.emit('localhost:fetchComplete', {
              requestId: request.requestId,
              status: result.status,
              statusText: result.statusText || '',
              headers: result.headers,
              body: result.body,
              time: result.time || (endTime - startTime),
              size: result.size || 0,
              timestamp: new Date().toISOString(),
            });

            console.log(`[LocalhostBridge] ✅ Fetch completed: ${result.status} in ${result.time || (endTime - startTime)}ms`);
          } catch (proxyError) {
            console.error('[LocalhostBridge] Proxy Manager fetch failed:', proxyError);
            throw proxyError;
          }
        } else if (workerStatus.active) {
          console.log('[LocalhostBridge] 🚀 Executing via Service Worker:', request.method, request.url);
          
          try {
            // Execute via Service Worker (bypasses CORS!)
            const result = await localhostWorker.executeFetch({
              url: finalUrl.toString(),
              method: request.method,
              headers: requestHeaders,
              body: requestBody,
            });

            const endTime = Date.now();
            console.log('[LocalhostBridge] 🔓 Using Service Worker - No CORS restrictions!');

            // Send successful response back to relay
            socket.emit('localhost:fetchComplete', {
              requestId: request.requestId,
              status: result.status,
              statusText: result.statusText || '',
              headers: result.headers,
              body: result.body,
              time: result.time || (endTime - startTime),
              size: result.size || 0,
              timestamp: new Date().toISOString(),
            });

            console.log(`[LocalhostBridge] ✅ Fetch completed: ${result.status} in ${result.time || (endTime - startTime)}ms`);
          } catch (workerError) {
            console.error('[LocalhostBridge] Service Worker fetch failed:', workerError);
            throw workerError;
          }
        } else {
          console.log('[LocalhostBridge] Executing localhost URL directly (bypassing Service Worker)');
          
          try {
            // Execute fetch directly with CORS mode
            const response = await fetch(finalUrl.toString(), {
              method: request.method.toUpperCase(),
              headers: requestHeaders,
              body: requestBody,
              mode: 'cors', // Explicitly set CORS mode
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
          } catch (fetchError: any) {
            // Handle CORS and other fetch errors
            console.error('[LocalhostBridge] Fetch error:', fetchError.name, fetchError.message);
            
            // Check if this is a CORS error
            const isCORSError = fetchError.name === 'TypeError' && 
                               (fetchError.message.includes('failed to fetch') || 
                                fetchError.message.includes('CORS') ||
                                fetchError.message.includes('NetworkError'));
            
            let errorMessage = fetchError.message || 'Failed to execute local fetch';
            
            if (isCORSError) {
              errorMessage = 
                'CORS Error: Your localhost API needs to have proper CORS headers to be accessed from the browser.\n\n' +
                'Solutions:\n' +
                '1. Add CORS headers to your localhost server:\n' +
                '   - Access-Control-Allow-Origin: https://sadasya.vercel.app\n' +
                '   - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\n' +
                '   - Access-Control-Allow-Headers: *\n\n' +
                '2. Use the WebSocket relay (should be working automatically)\n' +
                '3. Run your localhost server with HTTPS\n' +
                '4. Run this app locally: npm run dev';
            }

            // Send error response back to relay
            socket.emit('localhost:fetchError', {
              requestId: request.requestId,
              error: errorMessage,
            });
          }
        }
      } catch (error: any) {
        const endTime = Date.now();
        console.error('[LocalhostBridge] Fetch error:', error.name, error.message);

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
      console.log('[LocalhostBridge] Cleaning up listener');
      socket.off('localhost:performFetch', handlePerformFetch);
    };
  }, [socket, isReady]);

  // This component doesn't render anything visible
  return null;
}