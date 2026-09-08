const CACHE_API_BASE_URL = process.env.NEXT_PUBLIC_CACHE_API_URL || 'http://localhost:8080/api/cache';
const CACHE_TIMEOUT_MS = 800;
const CIRCUIT_COOLDOWN_MS = 30_000;

interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

class CacheService {
  private baseUrl: string;
  private failUntil = 0;
  private hasWarned = false;

  constructor(baseUrl: string = CACHE_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private isDisabled(): boolean {
    if (Date.now() < this.failUntil) return true;
    try {
      const host = new URL(this.baseUrl).hostname.toLowerCase();
      if (
        process.env.NODE_ENV === 'production' &&
        (host === 'localhost' || host === '127.0.0.1' || host === '::1')
      ) {
        return true;
      }
    } catch {
      return true;
    }
    return false;
  }

  private recordFailure() {
    this.failUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    if (!this.hasWarned) {
      this.hasWarned = true;
      console.warn('[cacheService] Remote cache unavailable, continuing without it');
    }
  }

  private recordSuccess() {
    this.failUntil = 0;
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    if (this.isDisabled()) {
      throw new Error('Cache circuit open');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CACHE_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      });
      this.recordSuccess();
      return response;
    } catch (error) {
      this.recordFailure();
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const response = await this.request(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.value as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const response = await this.request(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          key,
          value,
          ttl: options?.ttl,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return !!data.key;
    } catch {
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const response = await this.request(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return !!data.key;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const response = await this.request(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.status === 200;
    } catch {
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    try {
      const response = await this.request(`${this.baseUrl}/pattern/${encodeURIComponent(pattern)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.deletedCount || 0;
    } catch {
      return 0;
    }
  }
}

const cacheService = new CacheService();

export default cacheService;

export type { CacheOptions };
