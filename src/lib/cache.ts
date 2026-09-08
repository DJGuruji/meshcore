import { createClient, RedisClientType } from 'redis';

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

const REDIS_CONNECT_TIMEOUT_MS = 2500;
const REDIS_OP_TIMEOUT_MS = 3000;
const REDIS_RETRY_INTERVAL_MS = 30_000;

function getUsableRedisUrl(): string | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  try {
    const host = new URL(url).hostname.toLowerCase();
    const isLoopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    // Loopback Redis is unreachable from cloud/serverless and can hang TCP connect
    if (isLoopback && process.env.NODE_ENV === 'production') {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

class RedisCacheClient implements CacheClient {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectPromise: Promise<RedisClientType> | null = null;

  destroySilent() {
    if (!this.client) return;
    try {
      this.client.destroy();
    } catch {
      // ignore
    }
    this.client = null;
    this.isConnected = false;
    this.connectPromise = null;
  }

  private createRedisClient(): RedisClientType {
    const redisUrl = getUsableRedisUrl() || 'redis://localhost:6379';

    const common = {
      url: redisUrl,
      disableOfflineQueue: true
    } as const;

    const client = redisUrl.startsWith('rediss://')
      ? createClient({
          ...common,
          socket: {
            connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
            reconnectStrategy: false,
            tls: true
          }
        })
      : createClient({
          ...common,
          socket: {
            connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
            reconnectStrategy: false
          }
        });

    client.on('error', () => {
      this.isConnected = false;
    });

    client.on('end', () => {
      this.isConnected = false;
    });

    return client as RedisClientType;
  }

  async connect(): Promise<RedisClientType> {
    if (this.client && this.isConnected) return this.client;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = this.connectInternal();
    try {
      return await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  private async connectInternal(): Promise<RedisClientType> {
    this.destroySilent();
    this.client = this.createRedisClient();

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Redis connect timeout')), REDIS_CONNECT_TIMEOUT_MS);
    });

    try {
      await Promise.race([this.client.connect(), timeout]);
      this.isConnected = true;
      return this.client;
    } catch (error) {
      this.destroySilent();
      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async get(key: string): Promise<any> {
    const client = await this.connect();
    const value = await client.get(key);
    if (typeof value !== 'string' || !value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    const client = await this.connect();
    const stringValue = JSON.stringify(value);
    if (options?.ttl) {
      await client.setEx(key, options.ttl, stringValue);
    } else {
      await client.set(key, stringValue);
    }
    return true;
  }

  async del(key: string): Promise<number> {
    const client = await this.connect();
    if (key.endsWith('*')) {
      const keys = await client.keys(key);
      if (keys.length > 0) {
        return await client.del(keys);
      }
      return 0;
    }
    return await client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const client = await this.connect();
    const result = await client.exists(key);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    const client = await this.connect();
    return await client.incr(key);
  }

  async pexpire(key: string, milliseconds: number): Promise<boolean> {
    const client = await this.connect();
    const result = await client.pExpire(key, milliseconds);
    return result === 1;
  }

  async quit(): Promise<void> {
    this.destroySilent();
  }
}

class InMemoryCacheClient implements CacheClient {
  private cache: Map<string, { value: any; expiry: number | null }> = new Map();

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    const expiry = options?.ttl ? Date.now() + (options.ttl * 1000) : null;
    this.cache.set(key, { value, expiry });
    return true;
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
    return this.cache.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

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

class ResilientCacheClient implements CacheClient {
  private redis = new RedisCacheClient();
  private memory = new InMemoryCacheClient();
  private redisEnabled = Boolean(getUsableRedisUrl());
  private redisHealthy = true;
  private lastFailureAt = 0;
  private hasWarnedFallback = false;

  private shouldTryRedis(): boolean {
    if (!this.redisEnabled) return false;
    if (this.redisHealthy) return true;
    return Date.now() - this.lastFailureAt >= REDIS_RETRY_INTERVAL_MS;
  }

  private markFailure() {
    this.redisHealthy = false;
    this.lastFailureAt = Date.now();
    if (!this.hasWarnedFallback) {
      this.hasWarnedFallback = true;
      console.warn('[cache] Redis unavailable, falling back to in-memory cache');
    }
  }

  private markSuccess() {
    this.redisHealthy = true;
  }

  private async withTimeout<T>(operation: Promise<T>, ms: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Cache operation timeout')), ms);
    });
    try {
      return await Promise.race([operation, timeout]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  private async withFallback<T>(
    operation: (client: CacheClient) => Promise<T>
  ): Promise<T> {
    if (this.shouldTryRedis()) {
      try {
        const result = await this.withTimeout(operation(this.redis), REDIS_OP_TIMEOUT_MS);
        this.markSuccess();
        return result;
      } catch {
        this.markFailure();
        this.redis.destroySilent();
      }
    }

    return operation(this.memory);
  }

  get(key: string) {
    return this.withFallback((client) => client.get(key));
  }

  set(key: string, value: any, options?: CacheOptions) {
    return this.withFallback((client) => client.set(key, value, options));
  }

  del(key: string) {
    return this.withFallback((client) => client.del(key));
  }

  exists(key: string) {
    return this.withFallback((client) => client.exists(key));
  }

  incr(key: string) {
    return this.withFallback((client) => client.incr(key));
  }

  pexpire(key: string, milliseconds: number) {
    return this.withFallback((client) => client.pexpire(key, milliseconds));
  }

  async quit() {
    await Promise.allSettled([this.redis.quit(), this.memory.quit()]);
  }
}

export const withCache = (ttl: number = 300) => {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
};

export const cacheClient = new ResilientCacheClient();

export const cache = {
  get: async (key: string): Promise<any> => {
    return cacheClient.get(key);
  },

  set: async (key: string, value: any, options?: CacheOptions): Promise<boolean> => {
    return cacheClient.set(key, value, options);
  },

  del: async (key: string): Promise<number> => {
    return cacheClient.del(key);
  },

  exists: async (key: string): Promise<boolean> => {
    return cacheClient.exists(key);
  },

  incr: async (key: string): Promise<number> => {
    return cacheClient.incr(key);
  },

  pexpire: async (key: string, milliseconds: number): Promise<boolean> => {
    return cacheClient.pexpire(key, milliseconds);
  },

  clear: async (): Promise<void> => {
    return cacheClient.quit();
  }
};

export default cache;
