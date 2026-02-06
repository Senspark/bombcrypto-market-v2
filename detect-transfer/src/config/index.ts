import 'dotenv/config';
import {AppConfig, appConfigSchema} from './types';

function getEnvOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export function getPostgresUrl(): string {
    return getEnvOrThrow('POSTGRES_URL');
}

export function getRedisUrl(): string {
    return getEnvOrThrow('REDIS_URL');
}

export function getBlockchainCenterApiUrl(): string {
    return getEnvOrThrow('BLOCKCHAIN_CENTER_API_URL');
}

export function loadAppConfig(): AppConfig {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    const rawConfig = {
        logger: {
            development: isDevelopment,
            level: (process.env.LOG_LEVEL ?? 'info') as AppConfig['logger']['level'],
        },
        postgres: {
            dsn: getPostgresUrl(),
        },
        redis: {
            url: getRedisUrl(),
        },
        blockchainCenter: {
            apiUrl: getBlockchainCenterApiUrl(),
        },
    };

    return appConfigSchema.parse(rawConfig);
}

export * from './types';
