import {loadAppConfig, SubscriberConfig} from '@/config';
import {initLogger, getLogger} from '@/utils/logger';
import {createPostgresPool} from '@/infrastructure/database/postgres';
import {createRedisClient} from '@/infrastructure/redis/client';
import {createBlockChainCenterApi, BlockChainCenterApi} from '@/infrastructure/blockchain/blockchain-center-api';
import {Subscriber} from '@/core/subscriber';

const SUBSCRIBER_CONFIGS: SubscriberConfig[] = [
    {
        network: 'BSC',
        marketAddress: '0x376A10E7f125A4E0a567cc08043c695Cd8EDd704',
        erc721Address: '0x30cc0553f6fa1faf6d7847891b9b36eb559dc618',
        dbTable: 'hero_orders',
        idInConfig: 'bsc_hero',
        dbSearchPath: 'bsc',
    },
    {
        network: 'BSC',
        marketAddress: '0x049896f350C802CD5C91134E5f35Ec55FA8f0108',
        erc721Address: '0xea3516feb8f3e387eec3004330fd30aff615496a',
        dbTable: 'house_orders',
        idInConfig: 'bsc_house',
        dbSearchPath: 'bsc',
    },
    {
        network: 'POLYGON',
        marketAddress: '0xf3a7195920519f8A22cDf84EBB9F74342abE9812',
        erc721Address: '0xd8a06936506379dbbe6e2d8ab1d8c96426320854',
        dbTable: 'hero_orders',
        idInConfig: 'polygon_hero',
        dbSearchPath: 'polygon',
    },
    {
        network: 'POLYGON',
        marketAddress: '0xBb5966daF83ec4D3f168671a464EB18430EeA3be',
        erc721Address: '0x2d5f4ba3e4a2d991bd72edbf78f607c174636618',
        dbTable: 'house_orders',
        idInConfig: 'polygon_house',
        dbSearchPath: 'polygon',
    },
];

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
    const config = loadAppConfig();
    const logger = initLogger(config.logger);

    logger.info('Starting detect-transfer-ts service...');

    // Initialize database
    const db = await createPostgresPool(config.postgres.dsn, logger);
    logger.info('Database pool created');

    // Initialize Redis
    const redis = await createRedisClient(config.redis.url, logger);
    logger.info('Redis client created');

    // Create BlockChainCenterApi instances per network
    const apiClients: Record<string, BlockChainCenterApi> = {
        BSC: createBlockChainCenterApi({
            baseUrl: config.blockchainCenter.apiUrl,
            network: 'bsc',
            logger,
        }),
        POLYGON: createBlockChainCenterApi({
            baseUrl: config.blockchainCenter.apiUrl,
            network: 'polygon',
            logger,
        }),
    };

    // Create subscribers
    const subscribers: Subscriber[] = [];

    for (const subConfig of SUBSCRIBER_CONFIGS) {
        logger.info(`Initializing subscriber: ${subConfig.idInConfig}`);

        const api = apiClients[subConfig.network];

        const subscriber = new Subscriber(
            subConfig,
            api,
            redis,
            db,
            logger
        );

        subscribers.push(subscriber);
    }

    logger.info('All subscribers initialized. Starting rotation loop.');

    // Graceful shutdown
    let isShuttingDown = false;

    const shutdown = async (signal: string): Promise<void> => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        logger.info(`Received ${signal}, shutting down gracefully...`);

        try {
            // Stop API clients
            for (const api of Object.values(apiClients)) {
                api.stop();
            }
            logger.info('API clients stopped');

            await redis.disconnect();
            logger.info('Redis disconnected');

            await db.end();
            logger.info('Database pool closed');
        } catch (e) {
            logger.error(`Error during shutdown: ${e}`);
        }

        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Main loop
    while (!isShuttingDown) {
        let totalProcessed = 0;

        for (const sub of subscribers) {
            const count = await sub.processBatch(20);
            totalProcessed += count;
        }

        if (totalProcessed === 0) {
            await sleep(1000);
        }
    }
}

// Initial delay (like Python version)
sleep(5000).then(() => {
    main().catch((e) => {
        const logger = getLogger();
        logger.error(`Fatal error: ${e}`);
        process.exit(1);
    });
});
