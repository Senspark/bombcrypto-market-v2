import Redis from 'ioredis';
import {Logger} from '@/utils/logger';

export interface RedisClient {
    exists(key: string): Promise<number>;
    set(key: string, value: string | number, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    popFromSet(key: string): Promise<string | null>;
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

        popFromSet: async (key: string) => {
            return redis.spop(key);
        },

        disconnect: async () => {
            await redis.quit();
        },
    };
}
