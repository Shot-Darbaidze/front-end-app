type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class CacheManager {
  private store = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value as string | undefined;
      if (firstKey) {
        this.store.delete(firstKey);
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  getStats(): { size: number; maxSize: number } {
    return { size: this.store.size, maxSize: this.maxSize };
  }
}

let cacheManagerSingleton: CacheManager | null = null;

export const getCacheManager = (): CacheManager => {
  if (!cacheManagerSingleton) {
    cacheManagerSingleton = new CacheManager();
  }
  return cacheManagerSingleton;
};
