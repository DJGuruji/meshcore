/**
 * Client-Side Proxy Manager
 * 
 * Manages the Service Worker-based proxy for localhost API testing.
 * This bypasses CORS restrictions by running fetch() in an isolated
 * context with elevated permissions.
 */

export interface ProxyManagerStatus {
  registered: boolean;
  active: boolean;
  error?: string;
}

export interface ProxyRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  time: number;
  size: number;
}

class ProxyManager {
  private worker: ServiceWorker | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private status: ProxyManagerStatus = {
    registered: false,
    active: false,
  };

  /**
   * Register the Service Worker with retry logic
   */
  async register(): Promise<ProxyManagerStatus> {
    // Check if Service Workers are supported
    if (!('serviceWorker' in navigator)) {
      this.status = {
        registered: false,
        active: false,
        error: 'Service Workers not supported in this browser',
      };
      console.log('[ProxyManager] Service Workers not supported in this browser');
      return this.status;
    }

    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[ProxyManager] Registration attempt ${attempt}/${maxRetries}...`);
        
        // Register the Service Worker with updateViaCache to force fresh registration
        this.registration = await navigator.serviceWorker.register(
          '/proxy-worker.js',
          { 
            scope: '/',
            updateViaCache: 'none' // Force fresh registration
          }
        );

        console.log('[ProxyManager] Service Worker registered:', this.registration);

        // If there's a waiting worker, activate it immediately
        if (this.registration.waiting) {
          console.log('[ProxyManager] Waiting worker found, activating...');
          this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Wait for Service Worker to be active
        if (this.registration.active) {
          this.worker = this.registration.active;
          this.status = { registered: true, active: true };
          console.log('[ProxyManager] ✅ Service Worker already active');
        } else {
          await this.waitForActivation();
        }

        console.log('[ProxyManager] ✅ Service Worker status:', this.status);
        return this.status;
        
      } catch (error: any) {
        console.error(`[ProxyManager] Attempt ${attempt} failed:`, error.name, error.message);
        
        if (attempt < maxRetries) {
          console.log(`[ProxyManager] Retrying in ${retryDelay * attempt}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        } else {
          this.status = {
            registered: false,
            active: false,
            error: error.message || 'Failed to register Service Worker after 3 attempts',
          };
        }
      }
    }

    return this.status;
  }

  /**
   * Wait for Service Worker to become active
   */
  private async waitForActivation(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.registration) {
        reject(new Error('No registration found'));
        return;
      }

      const worker = this.registration.installing || this.registration.waiting;
      
      if (!worker) {
        // Already active
        this.worker = this.registration.active;
        this.status = { registered: true, active: true };
        console.log('[ProxyManager] Service Worker activated');
        resolve();
        return;
      }

      console.log('[ProxyManager] State changed:', worker.state);

      const handleStateChange = () => {
        console.log('[ProxyManager] State changed:', worker.state);
        if (worker.state === 'activated') {
          this.worker = worker;
          this.status = { registered: true, active: true };
          console.log('[ProxyManager] Service Worker activated');
          worker.removeEventListener('statechange', handleStateChange);
          resolve();
        } else if (worker.state === 'redundant') {
          this.status = { registered: false, active: false, error: 'Worker became redundant' };
          console.error('[ProxyManager] Worker became redundant');
          worker.removeEventListener('statechange', handleStateChange);
          reject(new Error('Service Worker became redundant'));
        }
      };

      worker.addEventListener('statechange', handleStateChange);
    });
  }

  /**
   * Execute a proxy request via Service Worker (bypasses CORS!)
   */
  async executeRequest(request: ProxyRequest): Promise<ProxyResponse> {
    console.log('[ProxyManager] Sending proxy request:', request.url);
    
    // Validate the URL
    try {
      const url = new URL(request.url);
      
      // Check if it's a bare domain without path
      if (url.pathname === '/') {
        console.warn('[ProxyManager] Warning: Request to bare domain detected, this may cause timeout');
        // For localhost bare domains, provide a clearer error message
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]') {
          throw new Error('Please specify a complete URL path for localhost (e.g., http://localhost:3000/api/users)');
        }
      }
    } catch (e) {
      throw new Error('Invalid URL format: ' + request.url + '. ' + (e as Error).message);
    }
    
    if (!this.worker || !this.status.active) {
      throw new Error('Service Worker not active. Call register() first.');
    }

    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}-${Math.random()}`;

      // Create MessageChannel for response
      const messageChannel = new MessageChannel();

      // Listen for response from Service Worker
      messageChannel.port1.onmessage = (event) => {
        console.log('[ProxyManager] Received response:', event.data.requestId, event.data.success);
        if (event.data.success) {
          resolve({
            status: event.data.status,
            statusText: event.data.statusText,
            headers: event.data.headers,
            body: event.data.body,
            time: event.data.time,
            size: event.data.size
          });
        } else {
          reject(new Error(event.data.error || 'Proxy request failed'));
        }
      };

      // Send proxy request to Service Worker
      if (!this.worker) {
        reject(new Error('Service Worker not available'));
        return;
      }

      this.worker.postMessage(
        {
          type: 'PROXY_REQUEST',
          requestId,
          proxyRequest: request,
        },
        [messageChannel.port2]
      );

      // Timeout after 30 seconds with a more descriptive message
      setTimeout(() => {
        reject(new Error('Request timeout - localhost server may not be running, not accessible, or the URL is incomplete (e.g., missing path like /api/users)'));
      }, 30000);
    });
  }

  /**
   * Get current status
   */
  getStatus(): ProxyManagerStatus {
    return { ...this.status };
  }

  /**
   * Unregister the Service Worker
   */
  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      this.worker = null;
      this.registration = null;
      this.status = { registered: false, active: false };
    }
  }

  /**
   * Check if a URL should be proxied
   */
  shouldProxy(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Only proxy HTTP requests to localhost addresses
      const isHttp = urlObj.protocol === 'http:';
      const isLocalhost = (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '[::1]' ||
        hostname.match(/^192\.168\.\d{1,3}\.\d{1,3}$/) !== null ||
        hostname.match(/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) !== null ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/) !== null
      );
      
      return isHttp && isLocalhost;
    } catch (e) {
      console.error('[ProxyManager] Error parsing URL for proxy check:', e);
      return false;
    }
  }
}

// Singleton instance
export const proxyManager = new ProxyManager();