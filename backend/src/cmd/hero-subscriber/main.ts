/**
 * Hero Subscriber Entry Point
 *
 * This is the main entry point for the BombCrypto Hero Marketplace subscriber.
 * It listens to blockchain events (CreateOrder, Sold, CancelOrder) and stores them in the database.
 */

import {loadConfig} from '@/config';
import {createDatabasePool, DatabasePool} from '@/infrastructure/database/postgres';
import {BlockChainCenterApi, createBlockChainCenterApi} from '@/infrastructure/blockchain/blockchain-center-api';
import {BHeroMarketService, createBHeroMarketService} from '@/infrastructure/blockchain/contracts/bhero-market';
import {createHeroBlockTrackingRepository} from '@/repositories/block-tracking.repository';
import {createHeroTransactionRepository} from '@/repositories/hero-transaction.repository';
import {createHeroSubscriber, HeroSubscriber, HeroSubscriberConfig} from '@/subscribers/hero-subscriber';
import {createLogger, Logger} from '@/utils/logger';
import {IBlockTrackingRepository, IHeroTransactionRepository} from '@/domain/interfaces/repository';

// Application state
interface AppState {
    logger: Logger;
    db: DatabasePool | null;
    blockchainClient: BlockChainCenterApi | null;
    heroMarket: BHeroMarketService | null;
    blockRepo: IBlockTrackingRepository | null;
    heroRepo: IHeroTransactionRepository | null;
    subscriber: HeroSubscriber | null;
}

const state: AppState = {
    logger: null as unknown as Logger,
    db: null,
    blockchainClient: null,
    heroMarket: null,
    blockRepo: null,
    heroRepo: null,
    subscriber: null,
};

/**
 * Initialize all dependencies
 */
async function initialize(): Promise<void> {
    // Load configuration
    const config = loadConfig();

    // Create logger
    state.logger = createLogger({
        development: config.logger.development,
        level: config.logger.level,
    });

    state.logger.info('Starting Hero Subscriber...');

    // Validate subscriber config
    if (!config.subscriber.blockchainCenterApiUrl) {
        throw new Error('SUBSCRIBER_BLOCKCHAIN_CENTER_API_URL is required');
    }
    if (!config.subscriber.network) {
        throw new Error('SUBSCRIBER_NETWORK is required');
    }
    if (!config.subscriber.heroContractAddress) {
        throw new Error('SUBSCRIBER_HERO_CONTRACT_ADDRESS is required');
    }
    if (!config.postgres.dsn) {
        throw new Error('POSTGRES_DSN is required');
    }

    // Create database connection pool
    state.logger.info('Connecting to database...');
    state.db = createDatabasePool(config.postgres.dsn);

    // Test database connection
    try {
        await state.db.query('SELECT 1');
        state.logger.info('Database connection established');
    } catch (err) {
        state.logger.error('Failed to connect to database:', err);
        throw err;
    }

    // Create blockchain center API client
    state.logger.info('Initializing BlockChainCenterApi client...');
    state.blockchainClient = createBlockChainCenterApi({
        baseUrl: config.subscriber.blockchainCenterApiUrl,
        network: config.subscriber.network,
        logger: state.logger,
    });

    // Create hero market service
    state.heroMarket = createBHeroMarketService(
        config.subscriber.heroContractAddress,
        state.blockchainClient
    );

    // Create repositories
    state.blockRepo = createHeroBlockTrackingRepository(state.db, state.logger);
    state.heroRepo = createHeroTransactionRepository(state.db, state.logger);

    // Create subscriber config
    const subscriberConfig: HeroSubscriberConfig = {
        heroContractAddress: config.subscriber.heroContractAddress,
        contractAddress: config.subscriber.heroContractAddress,
        startingBlockNumber: config.subscriber.heroStartingBlockNumber,
        soldNotifyUrl: config.subscriber.heroSoldNotifyUrl,
        bcoinContractAddress: config.subscriber.bcoinContractAddress,
        senContractAddress: config.subscriber.senContractAddress,
    };

    // Create subscriber
    state.subscriber = createHeroSubscriber(
        state.blockchainClient,
        state.blockRepo,
        state.heroRepo,
        state.heroMarket,
        state.logger,
        subscriberConfig
    );

    state.logger.info('Hero Subscriber initialized');

    // Start the subscriber
    await state.subscriber.start();
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
    state.logger?.info(`Received ${signal}, shutting down gracefully...`);

    try {
        // Signal subscriber to shutdown
        if (state.subscriber) {
            state.subscriber.shutdown();
            state.logger?.info('Subscriber shutdown signaled, waiting for completion...');
        }

        // Stop blockchain client
        if (state.blockchainClient) {
            state.blockchainClient.stop();
            state.logger?.info('BlockChainCenterApi client stopped');
        }

        // Close database pool
        if (state.db) {
            await state.db.end();
            state.logger?.info('Database connection pool closed');
        }

        state.logger?.info('Shutdown complete');
        process.exit(0);
    } catch (err) {
        state.logger?.error('Error during shutdown:', err);
        process.exit(1);
    }
}

/**
 * Run the Hero Subscriber
 */
export async function runHeroSubscriber(): Promise<void> {
    // Setup signal handlers for graceful shutdown
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error('Uncaught exception:', err);
        shutdown('uncaughtException').catch(() => process.exit(1));
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled rejection at:', promise, 'reason:', reason);
        shutdown('unhandledRejection').catch(() => process.exit(1));
    });

    try {
        await initialize();
    } catch (err) {
        console.error('Failed to initialize Hero Subscriber:', err);
        process.exit(1);
    }
}
