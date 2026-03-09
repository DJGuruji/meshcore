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
  incr: (key: string) => Promise<number>;
  pexpire: (key: string, milliseconds: number) => Promise<boolean>;
  quit: () => Promise<void>;
}

// Create Redis client for backend
class RedisCacheClient implements CacheClient {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<RedisClientType> {
    if (this.client && this.isConnected) return this.client;

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
    });

    try {
      await this.client.connect();
      this.isConnected = true;
      return this.client;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  async get(key: string): Promise<any> {
    try {
      const client = await this.connect();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    try {
      const client = await this.connect();
      const stringValue = JSON.stringify(value);
      if (options?.ttl) {
        await client.setEx(key, options.ttl, stringValue);
      } else {
        await client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async del(key: string): Promise<number> {
    try {
      const client = await this.connect();
      if (key.endsWith('*')) {
        const pattern = key;
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          return await client.del(keys);
        }
        return 0;
      }
      return await client.del(key);
    } catch (error) {
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.connect();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      const client = await this.connect();
      return await client.incr(key);
    } catch (error) {
      return 0;
    }
  }

  async pexpire(key: string, milliseconds: number): Promise<boolean> {
    try {
      const client = await this.connect();
      const result = await client.pExpire(key, milliseconds);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  async quit(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
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

  async incr(key: string): Promise<number> {
    const item = this.cache.get(key);
    let newValue = 1;
    if (item) {
      newValue = (Number(item.value) || 0) + 1;
      this.cache.set(key, { ...item, value: newValue });
    } else {
      this.cache.set(key, { value: newValue, expiry: null });
    }
    return newValue;
  }

  async pexpire(key: string, milliseconds: number): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    this.cache.set(key, { ...item, expiry: Date.now() + milliseconds });
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
  // In production or if REDIS_URL is provided, use Redis
  if (process.env.REDIS_URL || process.env.NODE_ENV === 'production') {
    return new RedisCacheClient();
  }
  
  // Fallback to in-memory cache for local development without Redis
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
   * Atomic increment
   */
  incr: async (key: string): Promise<number> => {
    return cacheClient.incr(key);
  },

  /**
   * Set expiration in milliseconds
   */
  pexpire: async (key: string, milliseconds: number): Promise<boolean> => {
    return cacheClient.pexpire(key, milliseconds);
  },

  /**
   * Clear all cache
   */
  clear: async (): Promise<void> => {
    return cacheClient.quit();
  }
};

export default cache;