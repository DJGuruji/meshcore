/**
 * Localhost Worker Manager
 * 
 * Registers and manages the Service Worker that bypasses CORS
 * restrictions for localhost API testing.
 */

export interface LocalhostWorkerStatus {
  registered: boolean;
  active: boolean;
  error?: string;
}

class LocalhostWorkerManager {
  private worker: ServiceWorker | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private status: LocalhostWorkerStatus = {
    registered: false,
    active: false,
  };

  /**
   * Register the Service Worker with retry logic
   */
  async register(): Promise<LocalhostWorkerStatus> {
    // Check if Service Workers are supported
    if (!('serviceWorker' in navigator)) {
      this.status = {
        registered: false,
        active: false,
        error: 'Service Workers not supported in this browser',
      };
      console.log('[LocalhostWorker] Service Workers not supported in this browser');
      return this.status;
    }

    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[LocalhostWorker] Registration attempt ${attempt}/${maxRetries}...`);
        
        // Register the Service Worker with updateViaCache to force fresh registration
        this.registration = await navigator.serviceWorker.register(
          '/localhost-worker.js',
          { 
            scope: '/',
            updateViaCache: 'none' // Force fresh registration
          }
        );

        console.log('[LocalhostWorker] Service Worker registered:', this.registration);

        // If there's a waiting worker, activate it immediately
        if (this.registration.waiting) {
          console.log('[LocalhostWorker] Waiting worker found, activating...');
          this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Wait for Service Worker to be active
        if (this.registration.active) {
          this.worker = this.registration.active;
          this.status = { registered: true, active: true };
          console.log('[LocalhostWorker] ✅ Service Worker already active');
        } else {
          await this.waitForActivation();
        }

        console.log('[LocalhostWorker] ✅ Service Worker status:', this.status);
        return this.status;
        
      } catch (error: any) {
        console.error(`[LocalhostWorker] Attempt ${attempt} failed:`, error.name, error.message);
        
        if (attempt < maxRetries) {
          console.log(`[LocalhostWorker] Retrying in ${retryDelay * attempt}ms...`);
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
        console.log('[LocalhostWorker] Service Worker activated');
        resolve();
        return;
      }

      console.log('[LocalhostWorker] State changed:', worker.state);

      const handleStateChange = () => {
        console.log('[LocalhostWorker] State changed:', worker.state);
        if (worker.state === 'activated') {
          this.worker = worker;
          this.status = { registered: true, active: true };
          console.log('[LocalhostWorker] Service Worker activated');
          worker.removeEventListener('statechange', handleStateChange);
          resolve();
        } else if (worker.state === 'redundant') {
          this.status = { registered: false, active: false, error: 'Worker became redundant' };
          console.error('[LocalhostWorker] Worker became redundant');
          worker.removeEventListener('statechange', handleStateChange);
          reject(new Error('Service Worker became redundant'));
        }
      };

      worker.addEventListener('statechange', handleStateChange);
    });
  }

  /**
   * Execute a fetch request via Service Worker (bypasses CORS!)
   */
  async executeFetch(request: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  }): Promise<any> {
    console.log('[LocalhostWorker] Sending fetch request:', request.url);
    
    if (!this.worker || !this.status.active) {
      throw new Error('Service Worker not active. Call register() first.');
    }

    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}-${Math.random()}`;

      // Create MessageChannel for response
      const messageChannel = new MessageChannel();

      // Listen for response from Service Worker
      messageChannel.port1.onmessage = (event) => {
        console.log('[LocalhostWorker] Received response:', event.data.requestId, event.data.success);
        if (event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data.error || 'Fetch failed'));
        }
      };

      // Send fetch request to Service Worker
      if (!this.worker) {
        reject(new Error('Service Worker not available'));
        return;
      }

      this.worker.postMessage(
        {
          type: 'FETCH_LOCALHOST',
          requestId,
          request,
        },
        [messageChannel.port2]
      );

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);
    });
  }

  /**
   * Get current status
   */
  getStatus(): LocalhostWorkerStatus {
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
}

// Singleton instance
export const localhostWorker = new LocalhostWorkerManager();