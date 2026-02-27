import Redis from 'ioredis';
import {Logger} from '@/utils/logger';

export interface RedisClient {
    exists(key: string): Promise<number>;
    set(key: string, value: string | number, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<number>;
    hexists(key: string, field: string): Promise<number>;
    hexpire(key: string, seconds: number, field: string): Promise<number>;
    addToSet(key: string, ...members: string[]): Promise<number>;
    popFromSet(key: string): Promise<string | null>;
    popManyFromSet(key: string, count: number): Promise<string[]>;
    hmset(key: string, fieldValues: Record<string, string>): Promise<void>;
    hmexpire(key: string, seconds: number, fields: string[]): Promise<void>;
    disconnect(): Promise<void>;
}

export async function createRedisClient(url: string, logger: Logger): Promise<RedisClient> {
    const redis = new Redis(url);

    redis.on('error', (err) => {
        logger.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
        logger.info('Redis connected successfully');
    });

    await redis.ping();

    return {
        exists: async (key: string) => {
            return redis.exists(key);
        },

        set: async (key: string, value: string | number, ttlSeconds?: number) => {
            if (ttlSeconds) {
                await redis.set(key, value, 'EX', ttlSeconds);
            } else {
                await redis.set(key, value);
            }
        },

        get: async (key: string) => {
            return redis.get(key);
        },

        hset: async (key: string, field: string, value: string) => {
            return redis.hset(key, field, value);
        },

        hexists: async (key: string, field: string) => {
            return redis.hexists(key, field);
        },

        hexpire: async (key: string, seconds: number, field: string) => {
            return redis.call('HEXPIRE', key, String(seconds), 'FIELDS', '1', field) as Promise<number>;
        },

        addToSet: async (key: string, ...members: string[]) => {
            return redis.sadd(key, ...members);
        },

        popFromSet: async (key: string) => {
            return redis.spop(key);
        },

        popManyFromSet: async (key: string, count: number) => {
            const result = await redis.spop(key, count);
            return result ?? [];
        },

        hmset: async (key: string, fieldValues: Record<string, string>) => {
            const entries = Object.entries(fieldValues);
            if (entries.length === 0) return;
            const args = entries.flat();
            await redis.hset(key, ...args);
        },

        hmexpire: async (key: string, seconds: number, fields: string[]) => {
            if (fields.length === 0) return;
            await redis.call(
                'HEXPIRE', key, String(seconds),
                'FIELDS', String(fields.length), ...fields
            );
        },

        disconnect: async () => {
            await redis.quit();
        },
    };
}
