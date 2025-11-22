/**
 * Client-Side Proxy Service Worker
 * 
 * This Service Worker acts as a proxy to bypass CORS restrictions
 * when testing localhost APIs from the production frontend.
 * 
 * How it works:
 * 1. Receives proxy requests via postMessage from main thread
 * 2. Executes requests with elevated permissions (bypassing CORS)
 * 3. Returns full response data to the main thread
 * 
 * This enables ZERO-CONFIG localhost testing - users don't need
 * to add CORS headers to their localhost APIs!
 */

// Store active proxy operations
const pendingProxies = new Map();

/**
 * Service Worker installation
 * Skip waiting to activate immediately
 */
self.addEventListener('install', (event) => {
  console.log('[ProxyWorker] Installing Service Worker...');
  self.skipWaiting();
});

/**
 * Service Worker activation
 * Claim all clients immediately
 */
self.addEventListener('activate', (event) => {
  console.log('[ProxyWorker] Activating Service Worker...');
  event.waitUntil(self.clients.claim());
});

/**
 * Message handler - receives proxy requests from main thread
 */
self.addEventListener('message', async (event) => {
  const { type, requestId, proxyRequest } = event.data;

  // Handle skip waiting message for immediate activation
  if (type === 'SKIP_WAITING') {
    console.log('[ProxyWorker] Received SKIP_WAITING, activating immediately...');
    self.skipWaiting();
    return;
  }

  if (type === 'PROXY_REQUEST') {
    console.log('[ProxyWorker] Received proxy request:', requestId, proxyRequest.url);

    try {
      // Parse the URL to check if it's a localhost URL
      const requestURL = new URL(proxyRequest.url);
      const isLocalhost = requestURL.hostname === 'localhost' ||
        requestURL.hostname === '127.0.0.1' ||
        requestURL.hostname === '[::1]' ||
        requestURL.hostname.match(/^192\.168\.\d{1,3}\.\d{1,3}$/) ||
        requestURL.hostname.match(/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) ||
        requestURL.hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/);

      if (!isLocalhost) {
        throw new Error('Only localhost URLs are allowed for proxy requests');
      }

      // Check for HTTPS -> HTTP (mixed content) issue
      const isHTTPS = self.location.protocol === 'https:';
      const isHTTPRequest = requestURL.protocol === 'http:';

      // For localhost URLs, we can bypass mixed content restrictions
      // because we're in a Service Worker context with elevated permissions
      if (isHTTPS && isHTTPRequest && isLocalhost) {
        console.log('[ProxyWorker] Handling mixed content localhost request - bypassing browser restrictions');
        // We can proceed with the fetch in Service Worker context
        // Service Workers have elevated permissions that bypass mixed content restrictions
      }

      // Perform fetch in Service Worker context (bypasses CORS!)
      const startTime = Date.now();
      console.log('[ProxyWorker] About to fetch:', proxyRequest.url, {
        method: proxyRequest.method || 'GET',
        headers: proxyRequest.headers || {},
        body: proxyRequest.body || null,
      });

      let response;
      try {
        response = await fetch(proxyRequest.url, {
          method: proxyRequest.method || 'GET',
          headers: proxyRequest.headers || {},
          body: proxyRequest.body || null,
          // No 'mode' restriction - Service Worker can read any response!
        });
      } catch (fetchError) {
        console.error('[ProxyWorker] Fetch failed:', fetchError.name, fetchError.message);
        throw new Error(`Failed to connect to localhost server: ${fetchError.message}`);
      }

      const endTime = Date.now();
      console.log('[ProxyWorker] Proxy request successful:', requestId, response.status);

      // Read response body (works even without CORS headers!)
      let responseBody;
      const contentType = response.headers.get('content-type') || '';
      console.log('[ProxyWorker] Response content-type:', contentType);

      if (contentType.includes('application/json')) {
        try {
          responseBody = await response.json();
          console.log('[ProxyWorker] Parsed JSON response');
        } catch (e) {
          console.log('[ProxyWorker] Failed to parse JSON, falling back to text');
          responseBody = await response.text();
        }
      } else {
        responseBody = await response.text();
        console.log('[ProxyWorker] Read text response');
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

      // Send response via MessageChannel port
      event.ports[0].postMessage(result);
      console.log('[ProxyWorker] Response sent back to main thread');

    } catch (error) {
      console.error('[ProxyWorker] Proxy request failed:', requestId, error.name, error.message, error.stack);
      // Send error response back to main thread
      const result = {
        requestId,
        success: false,
        error: error.message || 'Proxy request failed',
        errorType: error.name || 'Error'
      };

      try {
        event.ports[0].postMessage(result);
      } catch (postError) {
        console.error('[ProxyWorker] Failed to send error response:', postError);
      }
    }
  }
});
