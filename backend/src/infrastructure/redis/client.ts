import Redis, {RedisOptions} from 'ioredis';
import {Logger} from '@/utils/logger';

// Redis client interface
export interface IRedisClient {
    // Add members to a set (SADD)
    addToSet(key: string, ...members: (string | number)[]): Promise<number>;

    // Check if member exists in set (SISMEMBER)
    isMemberOfSet(key: string, member: string | number): Promise<boolean>;

    // Get all members of a set (SMEMBERS)
    getSetMembers(key: string): Promise<string[]>;

    // Remove members from a set (SREM)
    removeFromSet(key: string, ...members: (string | number)[]): Promise<number>;

    // Get set cardinality (SCARD)
    getSetSize(key: string): Promise<number>;

    // Generic get/set for caching
    get(key: string): Promise<string | null>;

    set(key: string, value: string, ttlSeconds?: number): Promise<void>;

    del(key: string): Promise<number>;

    // Check connection
    ping(): Promise<string>;

    // Close connection
    quit(): Promise<void>;

    // Check if client is connected
    isConnected(): boolean;
}

// Redis client wrapper
export class RedisClient implements IRedisClient {
    private client: Redis;
    private connected: boolean = false;

    constructor(
        private readonly url: string,
        private readonly logger: Logger
    ) {
        const options = this.parseUrl(url);
        this.client = new Redis(options);

        this.client.on('connect', () => {
            this.connected = true;
            this.logger.info('Redis client connected');
        });

        this.client.on('error', (err) => {
            this.connected = false;
            this.logger.error('Redis client error:', err);
        });

        this.client.on('close', () => {
            this.connected = false;
            this.logger.info('Redis client connection closed');
        });

        this.client.on('reconnecting', () => {
            this.logger.info('Redis client reconnecting...');
        });
    }

    async addToSet(key: string, ...members: (string | number)[]): Promise<number> {
        if (members.length === 0) return 0;
        return this.client.sadd(key, ...members.map(String));
    }

    async isMemberOfSet(key: string, member: string | number): Promise<boolean> {
        const result = await this.client.sismember(key, String(member));
        return result === 1;
    }

    async getSetMembers(key: string): Promise<string[]> {
        return this.client.smembers(key);
    }

    async removeFromSet(key: string, ...members: (string | number)[]): Promise<number> {
        if (members.length === 0) return 0;
        return this.client.srem(key, ...members.map(String));
    }

    async getSetSize(key: string): Promise<number> {
        return this.client.scard(key);
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async del(key: string): Promise<number> {
        return this.client.del(key);
    }

    async ping(): Promise<string> {
        return this.client.ping();
    }

    async quit(): Promise<void> {
        await this.client.quit();
    }

    isConnected(): boolean {
        return this.connected;
    }

    private parseUrl(url: string): RedisOptions {
        try {
            const parsed = new URL(url);
            const options: RedisOptions = {
                host: parsed.hostname,
                port: parseInt(parsed.port, 10) || 6379,
                lazyConnect: false,
                retryStrategy: (times) => {
                    if (times > 10) {
                        return null; // Stop retrying
                    }
                    return Math.min(times * 100, 3000); // Exponential backoff, max 3s
                },
            };

            if (parsed.password) {
                options.password = parsed.password;
            }

            if (parsed.username && parsed.username !== 'default') {
                options.username = parsed.username;
            }

            // Parse database from path (e.g., redis://host:port/0)
            const dbPath = parsed.pathname.slice(1);
            if (dbPath) {
                options.db = parseInt(dbPath, 10);
            }

            return options;
        } catch {
            throw new Error(`Invalid Redis URL format: ${url}`);
        }
    }
}

// Search ID tracker using Redis sets
export class SearchIdTracker {
    private readonly heroKey: string;
    private readonly houseKey: string;

    constructor(
        private readonly redis: IRedisClient | null,
        network: string
    ) {
        this.heroKey = `MKP_HERO_SEARCH_IDS_${network.toUpperCase()}`;
        this.houseKey = `MKP_HOUSE_SEARCH_IDS_${network.toUpperCase()}`;
    }

    // Track hero search IDs (async, non-blocking)
    async trackHeroSearchIds(ids: number[]): Promise<void> {
        if (!this.redis || ids.length === 0) return;

        try {
            await this.redis.addToSet(this.heroKey, ...ids);
        } catch (err) {
            // Log but don't throw - this is a non-critical operation
            console.error('Failed to track hero search IDs:', err);
        }
    }

    // Track house search IDs (async, non-blocking)
    async trackHouseSearchIds(ids: number[]): Promise<void> {
        if (!this.redis || ids.length === 0) return;

        try {
            await this.redis.addToSet(this.houseKey, ...ids);
        } catch (err) {
            // Log but don't throw - this is a non-critical operation
            console.error('Failed to track house search IDs:', err);
        }
    }

    // Check if hero ID has been searched
    async isHeroSearched(id: number): Promise<boolean> {
        if (!this.redis) return false;
        return this.redis.isMemberOfSet(this.heroKey, id);
    }

    // Check if house ID has been searched
    async isHouseSearched(id: number): Promise<boolean> {
        if (!this.redis) return false;
        return this.redis.isMemberOfSet(this.houseKey, id);
    }
}

// Factory function to create Redis client
export async function createRedisClient(
    url: string | undefined,
    logger: Logger
): Promise<IRedisClient | null> {
    if (!url) {
        logger.info('Redis URL not provided, skipping Redis client initialization');
        return null;
    }

    try {
        const client = new RedisClient(url, logger);
        // Test connection
        await client.ping();
        logger.info('Redis client initialized successfully');
        return client;
    } catch (err) {
        logger.error('Failed to initialize Redis client:', err);
        return null;
    }
}

// Factory function to create search ID tracker
export function createSearchIdTracker(
    redis: IRedisClient | null,
    network: string
): SearchIdTracker {
    return new SearchIdTracker(redis, network);
}
