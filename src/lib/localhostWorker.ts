/**
 * Localhost Worker Manager
 * 
 * Updated to work with server-side localhost request execution
 */

export interface LocalhostWorkerStatus {
  registered: boolean;
  active: boolean;
  error?: string;
}

class LocalhostWorkerManager {
  private status: LocalhostWorkerStatus = {
    registered: false,
    active: false,
  };

  /**
   * Register the Service Worker
   * 
   * Updated to return a status indicating that Service Worker is not needed
   */
  async register(): Promise<LocalhostWorkerStatus> {
    // With the new server-side implementation, we don't need Service Worker
    this.status = {
      registered: false,
      active: false,
      error: 'Service Worker not needed - requests are handled server-side',
    };
    console.log('[LocalhostWorker] Service Worker not needed - requests are handled server-side');
    return this.status;
  }

  /**
   * Execute a fetch request via Service Worker (bypasses CORS!)
   * 
   * Updated to throw an error since we're not using Service Worker anymore
   */
  async executeFetch(request: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  }): Promise<any> {
    throw new Error('Service Worker not active. Requests are now handled server-side.');
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
    // Nothing to unregister since we're not using Service Worker
    this.status = { registered: false, active: false };
  }
}

// Singleton instance
export const localhostWorker = new LocalhostWorkerManager();