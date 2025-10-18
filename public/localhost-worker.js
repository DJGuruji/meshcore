/**
 * Service Worker for Localhost API Testing
 * 
 * This Service Worker bypasses CORS restrictions by running fetch()
 * in an isolated context with elevated permissions.
 * 
 * How it works:
 * 1. Main thread sends fetch request via postMessage
 * 2. Service Worker executes fetch (no CORS restrictions!)
 * 3. Service Worker reads full response (status, headers, body)
 * 4. Sends response back to main thread via MessageChannel
 * 
 * This enables ZERO-CONFIG localhost testing - users don't need
 * to add CORS headers to their localhost APIs!
 */

// Store active fetch operations
const pendingFetches = new Map();

/**
 * Service Worker installation
 * Skip waiting to activate immediately
 */
self.addEventListener('install', (event) => {
  console.log('[LocalhostWorker] Installing Service Worker...');
  self.skipWaiting();
});

/**
 * Service Worker activation
 * Claim all clients immediately
 */
self.addEventListener('activate', (event) => {
  console.log('[LocalhostWorker] Activating Service Worker...');
  event.waitUntil(self.clients.claim());
});

/**
 * Message handler - receives fetch requests from main thread
 */
self.addEventListener('message', async (event) => {
  const { type, requestId, request } = event.data;

  if (type === 'FETCH_LOCALHOST') {
    console.log('[LocalhostWorker] Received fetch request:', requestId, request.url);

    try {
      // Perform fetch in Service Worker context (bypasses CORS!)
      const startTime = Date.now();
      
      const response = await fetch(request.url, {
        method: request.method || 'GET',
        headers: request.headers || {},
        body: request.body || null,
        // No 'mode' restriction - Service Worker can read any response!
      });

      const endTime = Date.now();

      // Read response body (works even without CORS headers!)
      let responseBody;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          responseBody = await response.json();
        } catch (e) {
          responseBody = await response.text();
        }
      } else {
        responseBody = await response.text();
      }

      // Calculate response size
      const responseSize = new Blob([
        typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)
      ]).size;

      // Convert headers to object
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Send successful response back to main thread
      const result = {
        requestId,
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: endTime - startTime,
        size: responseSize
      };

      console.log('[LocalhostWorker] Fetch successful:', requestId, response.status);
      
      // Send response via MessageChannel port
      event.ports[0].postMessage(result);

    } catch (error) {
      console.error('[LocalhostWorker] Fetch failed:', requestId, error);

      // Send error response back to main thread
      const result = {
        requestId,
        success: false,
        error: error.message || 'Fetch failed',
        errorType: error.name || 'Error'
      };

      event.ports[0].postMessage(result);
    }
  }
});

/**
 * Fetch event handler
 * We don't intercept regular fetches, only handle explicit messages
 */
self.addEventListener('fetch', (event) => {
  // Let all requests pass through normally
  // We only handle explicit localhost fetches via postMessage
  return;
});

console.log('[LocalhostWorker] Service Worker script loaded');
