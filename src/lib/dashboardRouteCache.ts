type CacheScope = "session" | "local";

type CacheEnvelope<T> = {
  timestamp: number;
  data: T;
};

type CacheKeyOptions = {
  namespace: string;
  userId: string;
  variant?: string;
  scope?: CacheScope;
};

type CacheReadOptions = CacheKeyOptions & {
  ttlMs: number;
};

const CACHE_PREFIX = "dashboard-route-cache-v1";

function getStorage(scope: CacheScope): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return scope === "local" ? window.localStorage : window.sessionStorage;
}

function normalizeVariant(variant?: string): string {
  const value = (variant || "default").trim();
  return value.length > 0 ? value : "default";
}

function buildCacheKey({ namespace, userId, variant }: CacheKeyOptions): string {
  return [
    CACHE_PREFIX,
    encodeURIComponent(namespace),
    encodeURIComponent(userId),
    encodeURIComponent(normalizeVariant(variant)),
  ].join(":");
}

export function readDashboardRouteCache<T>(options: CacheReadOptions): T | null {
  const storage = getStorage(options.scope ?? "session");
  if (!storage) {
    return null;
  }

  const key = buildCacheKey(options);

  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CacheEnvelope<T>>;
    if (typeof parsed.timestamp !== "number") {
      storage.removeItem(key);
      return null;
    }

    if (Date.now() - parsed.timestamp > options.ttlMs) {
      storage.removeItem(key);
      return null;
    }

    return (parsed.data ?? null) as T | null;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function writeDashboardRouteCache<T>(options: CacheKeyOptions, data: T): void {
  const storage = getStorage(options.scope ?? "session");
  if (!storage) {
    return;
  }

  const key = buildCacheKey(options);
  const payload: CacheEnvelope<T> = {
    timestamp: Date.now(),
    data,
  };

  try {
    storage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage errors to keep UI non-blocking.
  }
}

export function clearDashboardRouteCache(options: CacheKeyOptions): void {
  const storage = getStorage(options.scope ?? "session");
  if (!storage) {
    return;
  }

  const key = buildCacheKey(options);
  storage.removeItem(key);
}

export function clearDashboardRouteNamespace(namespace: string, userId: string, scope: CacheScope = "session"): void {
  const storage = getStorage(scope);
  if (!storage) {
    return;
  }

  const prefix = [CACHE_PREFIX, encodeURIComponent(namespace), encodeURIComponent(userId), ""].join(":");

  for (let i = storage.length - 1; i >= 0; i -= 1) {
    const key = storage.key(i);
    if (!key) {
      continue;
    }

    if (key.startsWith(prefix)) {
      storage.removeItem(key);
    }
  }
}
