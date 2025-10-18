/**
 * Localhost Fetch Bridge Component
 * 
 * This component runs in the browser and listens for WebSocket commands
 * to execute local fetch requests via Service Worker.
 * 
 * The Service Worker bypasses CORS restrictions by running fetch() in an
 * isolated context with elevated permissions - NO CORS configuration needed!
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { localhostWorker } from '@/lib/localhostWorker';

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
  const [workerReady, setWorkerReady] = useState(false);

  // Register Service Worker on mount
  useEffect(() => {
    const registerWorker = async () => {
      try {
        console.log('[LocalhostBridge] Registering Service Worker...');
        const status = await localhostWorker.register();
        
        if (status.active) {
          console.log('[LocalhostBridge] ✅ Service Worker active - CORS bypass enabled!');
          setWorkerReady(true);
        } else {
          console.error('[LocalhostBridge] ❌ Service Worker registration failed:', status.error);
        }
      } catch (error) {
        console.error('[LocalhostBridge] Service Worker error:', error);
      }
    };

    registerWorker();
  }, []);

  useEffect(() => {
    if (!socket || !isReady || !workerReady) {
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
      console.log(`[LocalhostBridge] 🚀 Executing via Service Worker: ${request.method} ${request.url}`);

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

        // Execute fetch via Service Worker (BYPASSES CORS!)
        console.log('[LocalhostBridge] 🔒 Using Service Worker - No CORS restrictions!');
        
        const result = await localhostWorker.executeFetch({
          url: finalUrl.toString(),
          method: request.method.toUpperCase(),
          headers: requestHeaders,
          body: requestBody,
        });

        const endTime = Date.now();

        // Send successful response back to relay
        socket.emit('localhost:fetchComplete', {
          requestId: request.requestId,
          status: result.status,
          statusText: result.statusText,
          headers: result.headers,
          body: result.body,
          time: result.time || (endTime - startTime),
          size: result.size,
          timestamp: new Date().toISOString(),
        });

        console.log(`[LocalhostBridge] ✅ Fetch completed: ${result.status} in ${result.time}ms`);
      } catch (error: any) {
        const endTime = Date.now();
        console.error(`[LocalhostBridge] ❌ Fetch error:`, error);

        let errorMessage = error.message || 'Failed to execute local fetch';

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
  }, [socket, isReady, workerReady]);

  // This component doesn't render anything visible
  return null;
}
