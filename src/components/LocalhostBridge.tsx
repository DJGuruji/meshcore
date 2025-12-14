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

  // Register Service Worker on mount
  useEffect(() => {
    const registerWorker = async () => {
      try {
        const workerStatus = await localhostWorker.register();
        
        if (workerStatus.active) {
        }
      } catch (error) {
      }
    };

    registerWorker();
  }, []);

  useEffect(() => {
    if (!socket || !isReady) {
      return;
    }

    
    // Listen for performFetch commands from relay server
    const handlePerformFetch = async (request: LocalhostRequest) => {
      
      // Prevent duplicate processing
      if (processingRef.current.has(request.requestId)) {
        return;
      }

      processingRef.current.add(request.requestId);

      const startTime = Date.now();

      try {
        // Build URL with query parameters
        const finalUrl = new URL(request.url);
        request.params.filter((p: any) => p.enabled).forEach((p: any) => {
          finalUrl.searchParams.append(p.key, p.value);
        });

        // Build headers with zero-configuration CORS support
        const requestHeaders: Record<string, string> = {};
        Object.entries(request.headers).forEach(([key, value]) => {
          if (value) {
            requestHeaders[key] = value;
          }
        });

        // Add CORS bypass headers for localhost requests
        requestHeaders['Access-Control-Allow-Origin'] = '*';
        requestHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS';
        requestHeaders['Access-Control-Allow-Headers'] = '*';
        requestHeaders['Access-Control-Allow-Credentials'] = 'true';

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
          } else if (request.body.type === 'xml' && request.body.xml) {
            requestBody = request.body.xml;
            if (!requestHeaders['Content-Type']) {
              requestHeaders['Content-Type'] = 'application/xml';
            }
          } else if (request.body.type === 'text' && request.body.text) {
            requestBody = request.body.text;
            if (!requestHeaders['Content-Type']) {
              requestHeaders['Content-Type'] = 'text/plain';
            }
          } else if (request.body.type === 'raw' && request.body.raw) {
            requestBody = request.body.raw;
          } else if (request.body.type === 'form-data' && request.body.formData) {
            const formData = new FormData();
            request.body.formData.filter((f: any) => f.enabled).forEach((f: any) => {
              // Check if this is a file field (starts with [FILE])
              if (f.value && f.value.startsWith('[FILE] ')) {
                // For file fields, we would normally attach the actual file
                // But in this browser context, we can't access the file directly
                // We'll just send the filename as a placeholder
                formData.append(f.key, f.value.substring(7)); // Remove "[FILE] " prefix
              } else {
                formData.append(f.key, f.value);
              }
            });
            requestBody = formData;
          } else if (request.body.type === 'x-www-form-urlencoded' && request.body.formUrlEncoded) {
            const urlEncoded = new URLSearchParams();
            request.body.formUrlEncoded.filter((f: any) => f.enabled).forEach((f: any) => {
              urlEncoded.append(f.key, f.value);
            });
            requestBody = urlEncoded;
            if (!requestHeaders['Content-Type']) {
              requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
            }
          } else if (request.body.type === 'binary' && request.body.binary) {
            // For binary data, we'll treat it as a base64 string that needs to be decoded
            try {
              const binaryData = atob(request.body.binary);
              const bytes = new Uint8Array(binaryData.length);
              for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
              }
              requestBody = bytes;
            } catch (e) {
              // If not valid base64, send as-is
              requestBody = request.body.binary;
            }
          }
        }        // Check if Service Worker is active
        let workerStatus = localhostWorker.getStatus();
        
        
        if (workerStatus.active) {
          
          try {
            // Execute via Service Worker (bypasses CORS!)
            const result = await localhostWorker.executeFetch({
              url: finalUrl.toString(),
              method: request.method,
              headers: requestHeaders,
              body: requestBody,
            });

            const endTime = Date.now();

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

          } catch (workerError) {
            throw workerError;
          }
        } else {
          
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

          } catch (fetchError: any) {
            // Handle CORS and other fetch errors
            
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
                '   - Access-Control-Allow-Origin: https://AnyTimeRequest.vercel.app\n' +
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

        // Check if this is a mixed content error (HTTPS -> HTTP)
        const isMixedContent = error.message?.includes('NetworkError') || 
                              error.message?.includes('fetch') ||
                              error.message?.includes('Mixed Content') ||
                              (error instanceof TypeError && error.message.includes('fetch'));
        
        let errorMessage = error.message || 'Failed to execute local fetch';
        
        if (isMixedContent && window.location.protocol === 'https:') {
          errorMessage = 
            'Mixed Content Blocked: HTTPS page cannot fetch HTTP localhost\n\n' +
            'Add the domain AnyTimeRequest.vercel.app to the allowed origins:\n' +
            'or use ngrok to make the url public for testing\n\n';
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