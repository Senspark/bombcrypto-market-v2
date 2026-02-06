import {z} from 'zod';

export const blockchainCenterConfigSchema = z.object({
    apiUrl: z.string().url(),
});

export const subscriberConfigSchema = z.object({
    network: z.enum(['BSC', 'POLYGON']),
    marketAddress: z.string(),
    erc721Address: z.string(),
    dbTable: z.enum(['hero_orders', 'house_orders']),
    idInConfig: z.string(),
    dbSearchPath: z.string(),
});

export const loggerConfigSchema = z.object({
    development: z.boolean().default(true),
    level: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
});

export const postgresConfigSchema = z.object({
    dsn: z.string(),
});

export const redisConfigSchema = z.object({
    url: z.string(),
});

export const appConfigSchema = z.object({
    logger: loggerConfigSchema,
    postgres: postgresConfigSchema,
    redis: redisConfigSchema,
    blockchainCenter: blockchainCenterConfigSchema,
});

export type BlockchainCenterConfig = z.infer<typeof blockchainCenterConfigSchema>;
export type SubscriberConfig = z.infer<typeof subscriberConfigSchema>;
export type LoggerConfig = z.infer<typeof loggerConfigSchema>;
export type PostgresConfig = z.infer<typeof postgresConfigSchema>;
export type RedisConfig = z.infer<typeof redisConfigSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>;
