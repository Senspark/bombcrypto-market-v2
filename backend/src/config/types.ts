import {z} from 'zod';

// Server configuration schema
export const serverConfigSchema = z.object({
    port: z.string().default('8080'),
    cacheEviction: z.number().default(60), // seconds
    getCacheEviction: z.number().default(60), // seconds
    adminApiKey: z.string().default(''),
    blockchainCenterApiUrl: z.string().default(''),
    bheroContractAddress: z.string().default(''),
    bhouseContractAddress: z.string().default(''),
    isProduction: z.boolean().default(false),
    redisUrl: z.string().default(''),
    network: z.string().default('bsc'),
});

// Subscriber configuration schema
export const subscriberConfigSchema = z.object({
    blockchainCenterApiUrl: z.string().default(''),
    network: z.string().default('bsc'),
    heroContractAddress: z.string().default(''),
    houseContractAddress: z.string().default(''),
    heroSoldNotifyUrl: z.string().default(''),
    houseSoldNotifyUrl: z.string().default(''),
    blockRetryTimeout: z.number().default(10000), // milliseconds
    heroStartingBlockNumber: z.number().default(0),
    houseStartingBlockNumber: z.number().default(0),
    bcoinContractAddress: z.string().default(''),
    senContractAddress: z.string().default(''),
});

// Logger configuration schema
export const loggerConfigSchema = z.object({
    development: z.boolean().default(true),
    level: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
});

// Postgres configuration schema
export const postgresConfigSchema = z.object({
    dsn: z.string(),
});

/**
 * House rental (P2P) configuration.
 *
 * Rentals are paid with in-game balance, so they read/write the GAME database
 * (bombcrypto2) plus the accounts database (backend) - both different from the
 * marketplace database used by the rest of this service. Leave `gameDsn` empty
 * to disable the feature entirely.
 */
export const rentalConfigSchema = z.object({
    enabled: z.boolean().default(false),
    gameDsn: z.string().default(''),
    accountDsn: z.string().default(''),
    apLoginUrl: z.string().default(''),
    isOpen: z.boolean().default(true),
    enableChargeJob: z.boolean().default(true),
    chargeCron: z.string().default('*/5 * * * *'),
});

// Full configuration schema
export const configSchema = z.object({
    server: serverConfigSchema,
    subscriber: subscriberConfigSchema,
    logger: loggerConfigSchema,
    postgres: postgresConfigSchema,
    rental: rentalConfigSchema,
});

// Inferred types from schemas
export type ServerConfig = z.infer<typeof serverConfigSchema>;
export type SubscriberConfig = z.infer<typeof subscriberConfigSchema>;
export type LoggerConfig = z.infer<typeof loggerConfigSchema>;
export type PostgresConfig = z.infer<typeof postgresConfigSchema>;
export type RentalConfig = z.infer<typeof rentalConfigSchema>;
export type Config = z.infer<typeof configSchema>;
