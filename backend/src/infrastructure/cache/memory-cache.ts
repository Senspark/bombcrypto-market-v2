import {createHash} from 'crypto';
import {Logger} from '@/utils/logger';

// Cache entry with expiration
interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

// Cache setter function type (for loading on miss)
export type CacheSetter<T> = () => Promise<T>;

// Cache interface
export interface ICache {
    // Get value from cache, or load it using setter if not found
    get<T>(key: string, setter: CacheSetter<T>): Promise<T>;

    // Get value from cache without setter (returns undefined if not found)
    getOnly<T>(key: string): T | undefined;

    // Set value in cache directly
    set<T>(key: string, value: T): void;

    // Check if key exists and is not expired
    has(key: string): boolean;

    // Delete specific key
    delete(key: string): void;

    // Clear all cache entries
    clear(): void;

    // Get cache size
    size(): number;

    // Stop cleanup interval
    stop(): void;
}

// Memory cache with TTL
export class MemoryCache implements ICache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private keyLocks: Map<string, Promise<unknown>> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;
    private readonly ttlMs: number;

    constructor(
        private readonly evictionSeconds: number,
        private readonly logger?: Logger
    ) {
        this.ttlMs = evictionSeconds * 1000;
        this.startCleanup();
    }

    async get<T>(key: string, setter: CacheSetter<T>): Promise<T> {
        const now = Date.now();
        const entry = this.cache.get(key);

        // Check if cached and not expired
        if (entry && entry.expiresAt > now) {
            return entry.value as T;
        }

        // Check if there's already a pending load for this key
        const existingLock = this.keyLocks.get(key);
        if (existingLock) {
            return existingLock as Promise<T>;
        }

        // Create a new load promise to prevent thundering herd
        const loadPromise = (async () => {
            try {
                const value = await setter();
                this.cache.set(key, {
                    value,
                    expiresAt: now + this.ttlMs,
                });
                return value;
            } finally {
                this.keyLocks.delete(key);
            }
        })();

        this.keyLocks.set(key, loadPromise);
        return loadPromise;
    }

    getOnly<T>(key: string): T | undefined {
        const now = Date.now();
        const entry = this.cache.get(key);

        if (entry && entry.expiresAt > now) {
            return entry.value as T;
        }

        return undefined;
    }

    set<T>(key: string, value: T): void {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs,
        });
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;
        return entry.expiresAt > Date.now();
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
        this.keyLocks.clear();
        this.logger?.info('Cache cleared');
    }

    size(): number {
        return this.cache.size;
    }

    stop(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    private startCleanup(): void {
        // Cleanup expired entries every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60_000);

        // Unref so it doesn't prevent process exit
        this.cleanupInterval.unref();
    }

    private cleanup(): void {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache) {
            if (entry.expiresAt <= now) {
                this.cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            this.logger?.debug(`Cache cleanup: removed ${removed} expired entries`);
        }
    }
}

// Generate cache key from query and params
export function generateCacheKey(prefix: string, query: string, params: unknown[]): string {
    const data = JSON.stringify({query, params});
    const hash = createHash('sha256').update(data).digest('hex');
    return prefix ? `${prefix}:${hash}` : hash;
}

// Generate cache key from arbitrary data
export function generateCacheKeyFromData(prefix: string, data: unknown): string {
    const serialized = JSON.stringify(data);
    const hash = createHash('sha256').update(serialized).digest('hex');
    return prefix ? `${prefix}:${hash}` : hash;
}

// Factory function
export function createMemoryCache(
    evictionSeconds: number,
    logger?: Logger
): ICache {
    return new MemoryCache(evictionSeconds, logger);
}

// Create two caches: one for list queries, one for single-item queries
export interface CacheSet {
    listCache: ICache;
    getCache: ICache;

    stop(): void;
}

export function createCacheSet(
    listCacheSeconds: number,
    getCacheSeconds: number,
    logger?: Logger
): CacheSet {
    const listCache = createMemoryCache(listCacheSeconds, logger);
    const getCache = createMemoryCache(getCacheSeconds, logger);

    return {
        listCache,
        getCache,
        stop() {
            listCache.stop();
            getCache.stop();
        },
    };
}
