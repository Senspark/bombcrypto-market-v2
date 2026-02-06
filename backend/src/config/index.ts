import * as dotenv from 'dotenv';
import {Config, configSchema} from './types';

// Load .env file
dotenv.config();

const ENV_PREFIX = 'BOMBCRYPTO_';

function getEnv(key: string, defaultValue = ''): string {
    return process.env[`${ENV_PREFIX}${key}`] ?? process.env[key] ?? defaultValue;
}

function getEnvBool(key: string, defaultValue = false): boolean {
    const value = getEnv(key, '');
    if (value === '') return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
}

function getEnvNumber(key: string, defaultValue = 0): number {
    const value = getEnv(key, '');
    if (value === '') return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

export function loadConfig(): Config {
    // Shared config values
    const blockchainCenterApiUrl = getEnv('BLOCKCHAIN_CENTER_API_URL', '');
    const network = getEnv('NETWORK', 'bsc');
    const redisUrl = getEnv('REDIS_URL', '');

    const rawConfig = {
        server: {
            port: getEnv('SERVER_PORT', '8080'),
            cacheEviction: getEnvNumber('SERVER_CACHE_EVICTION', 60),
            getCacheEviction: getEnvNumber('SERVER_GET_CACHE_EVICTION', 60),
            adminApiKey: getEnv('SERVER_ADMIN_API_KEY', ''),
            blockchainCenterApiUrl,
            bheroContractAddress: getEnv('SERVER_BHERO_CONTRACT_ADDRESS', ''),
            bhouseContractAddress: getEnv('SERVER_BHOUSE_CONTRACT_ADDRESS', ''),
            isProduction: getEnvBool('IS_PROD', false),
            redisUrl,
            network,
        },
        subscriber: {
            blockchainCenterApiUrl,
            network,
            heroContractAddress: getEnv('SUBSCRIBER_HERO_CONTRACT_ADDRESS', ''),
            houseContractAddress: getEnv('SUBSCRIBER_HOUSE_CONTRACT_ADDRESS', ''),
            heroSoldNotifyUrl: getEnv('SUBSCRIBER_HERO_SOLD_NOTIFY_URL', ''),
            houseSoldNotifyUrl: getEnv('SUBSCRIBER_HOUSE_SOLD_NOTIFY_URL', ''),
            blockRetryTimeout: getEnvNumber('SUBSCRIBER_BLOCK_RETRY_TIMEOUT', 10000),
            heroStartingBlockNumber: getEnvNumber('SUBSCRIBER_HERO_STARTING_BLOCK_NUMBER', 0),
            houseStartingBlockNumber: getEnvNumber('SUBSCRIBER_HOUSE_STARTING_BLOCK_NUMBER', 0),
            bcoinContractAddress: getEnv('BCOIN_CONTRACT_ADDRESS', ''),
            senContractAddress: getEnv('SEN_CONTRACT_ADDRESS', ''),
        },
        logger: {
            development: getEnvBool('LOGGER_DEVELOPMENT', true),
            level: getEnv('LOGGER_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly',
        },
        postgres: {
            dsn: process.env.POSTGRES_CONN_STR ?? '',
        },
    };

    // Validate and return config
    const result = configSchema.safeParse(rawConfig);
    if (!result.success) {
        console.error('Configuration validation failed:', result.error.format());
        throw new Error('Invalid configuration');
    }

    return result.data;
}

export * from './types';
