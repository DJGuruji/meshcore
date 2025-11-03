/**
 * Service Worker for Localhost API Testing
 * 
 * This Service Worker is no longer needed as requests are now handled server-side.
 * The file is kept for backward compatibility but doesn't perform any actions.
 */

// Store active fetch operations

/**
 * Service Worker installation
 * Skip waiting to activate immediately
 */
self.addEventListener('install', (event) => {
  console.log('[LocalhostWorker] Service Worker not needed - requests are handled server-side');
  self.skipWaiting();
});

/**
 * Service Worker activation
 * Claim all clients immediately
 */
self.addEventListener('activate', (event) => {
  console.log('[LocalhostWorker] Service Worker not needed - requests are handled server-side');
  event.waitUntil(self.clients.claim());
});

/**
 * Message handler - receives fetch requests from main thread
 * 
 * Updated to not handle any requests since we're using server-side execution
 */
self.addEventListener('message', async (event) => {
  const { type, requestId, request } = event.data;

  if (type === 'FETCH_LOCALHOST') {
    console.log('[LocalhostWorker] Service Worker not needed - requests are handled server-side');
    
    // Send error response back to main thread
    const result = {
      requestId,
      success: false,
      error: 'Service Worker not needed - requests are now handled server-side',
      errorType: 'NotNeeded'
    };

    event.ports[0].postMessage(result);
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