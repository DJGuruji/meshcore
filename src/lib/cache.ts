import { createClient, RedisClientType } from 'redis';

// Types for our cache
interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

interface CacheClient {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any, options?: CacheOptions) => Promise<boolean>;
  del: (key: string) => Promise<number>;
  exists: (key: string) => Promise<boolean>;
  quit: () => Promise<void>;
}

// Create Redis client for frontend
class RedisCacheClient implements CacheClient {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      // In a frontend environment, we typically won't connect directly to Redis
      // Instead, we'll use a backend API endpoint for caching
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<any> {
    // In frontend, we don't directly connect to Redis for security reasons
    // This is a no-op implementation
    return null;
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    // In frontend, we don't directly connect to Redis for security reasons
    // This is a no-op implementation
    return true;
  }

  async del(key: string): Promise<number> {
    // In frontend, we don't directly connect to Redis for security reasons
    // This is a no-op implementation
    return 0;
  }

  async exists(key: string): Promise<boolean> {
    // In frontend, we don't directly connect to Redis for security reasons
    // This is a no-op implementation
    return false;
  }

  async quit(): Promise<void> {
    // In frontend, we don't directly connect to Redis for security reasons
    // This is a no-op implementation
  }
}

// Create a simple in-memory cache as fallback
class InMemoryCacheClient implements CacheClient {
  private cache: Map<string, { value: any; expiry: number | null }> = new Map();

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item has expired
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    try {
      const expiry = options?.ttl ? Date.now() + (options.ttl * 1000) : null;
      this.cache.set(key, { value, expiry });
      return true;
    } catch (error) {
      return false;
    }
  }

  async del(key: string): Promise<number> {
    if (key.endsWith('*')) {
      const prefix = key.slice(0, -1);
      let count = 0;
      for (const k of this.cache.keys()) {
        if (k.startsWith(prefix)) {
          if (this.cache.delete(k)) count++;
        }
      }
      return count;
    }
    const result = this.cache.delete(key) ? 1 : 0;
    return result;
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    // Check if item has expired
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async quit(): Promise<void> {
    this.cache.clear();
  }
}

// Cache decorator for API routes
export const withCache = (ttl: number = 300) => {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      // For API routes, we'll implement caching in the route handlers directly
      // This decorator is for future use
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
};

// Create cache instance
const createCacheClient = (): CacheClient => {
  // In production, you might want to use Redis through a backend API
  // For now, we'll use in-memory cache
  return new InMemoryCacheClient();
};

// Export cache client
export const cacheClient = createCacheClient();

// Helper functions for common cache operations
export const cache = {
  /**
   * Get value from cache
   */
  get: async (key: string): Promise<any> => {
    return cacheClient.get(key);
  },

  /**
   * Set value in cache
   */
  set: async (key: string, value: any, options?: CacheOptions): Promise<boolean> => {
    return cacheClient.set(key, value, options);
  },

  /**
   * Delete key from cache
   */
  del: async (key: string): Promise<number> => {
    return cacheClient.del(key);
  },

  /**
   * Check if key exists in cache
   */
  exists: async (key: string): Promise<boolean> => {
    return cacheClient.exists(key);
  },

  /**
   * Clear all cache
   */
  clear: async (): Promise<void> => {
    return cacheClient.quit();
  }
};

export default cache;