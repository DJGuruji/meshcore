// Cache service to communicate with backend cache API
const CACHE_API_BASE_URL = process.env.NEXT_PUBLIC_CACHE_API_URL || 'http://localhost:8080/api/cache';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

class CacheService {
  private baseUrl: string;

  constructor(baseUrl: string = CACHE_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies/session if needed
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.value as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
      } else {
      }
      // Return null on error to allow fallback to direct data fetching
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies/session if needed
        body: JSON.stringify({
          key,
          value,
          ttl: options?.ttl,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return !!data.key;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
      } else {
      }
      // Return false on error to allow fallback to direct data fetching
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies/session if needed
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return !!data.key;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
      } else {
      }
      // Return false on error to allow fallback to direct data fetching
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies/session if needed
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.status === 200;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
      } else {
      }
      // Return false on error to allow fallback to direct data fetching
      return false;
    }
  }

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.baseUrl}/pattern/${encodeURIComponent(pattern)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies/session if needed
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.deletedCount || 0;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
      } else {
      }
      // Return 0 on error to allow fallback to direct data fetching
      return 0;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;

// Export types
export type { CacheOptions };