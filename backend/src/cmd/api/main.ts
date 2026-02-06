/**
 * REST API Server Entry Point
 *
 * This is the main entry point for the BombCrypto Marketplace REST API.
 * It initializes all dependencies and starts the HTTP server.
 */

import {loadConfig} from '@/config';
import {createDatabasePool, DatabasePool} from '@/infrastructure/database/postgres';
import {CacheSet, createCacheSet} from '@/infrastructure/cache/memory-cache';
import {createRedisClient, IRedisClient} from '@/infrastructure/redis/client';
import {createLogger, Logger} from '@/utils/logger';
import {ApiServer, createApiServer} from '@/api/server';

// Application state
interface AppState {
    logger: Logger;
    db: DatabasePool | null;
    cacheSet: CacheSet | null;
    redis: IRedisClient | null;
    server: ApiServer | null;
}

const state: AppState = {
    logger: null as unknown as Logger,
    db: null,
    cacheSet: null,
    redis: null,
    server: null,
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

    state.logger.info('Starting REST API server...');
    state.logger.info(`Network: ${config.server.network}`);

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

    // Create cache set
    state.cacheSet = createCacheSet(
        config.server.cacheEviction,
        config.server.getCacheEviction,
        state.logger
    );
    state.logger.info('Cache initialized');

    // Create Redis client (optional)
    state.redis = await createRedisClient(config.server.redisUrl, state.logger);

    // Ensure required dependencies are initialized
    if (!state.db) {
        throw new Error('Database connection not initialized');
    }
    if (!state.cacheSet) {
        throw new Error('Cache not initialized');
    }

    // Create and start API server
    state.server = createApiServer({
        config,
        db: state.db,
        cacheSet: state.cacheSet,
        redis: state.redis,
        logger: state.logger,
    });

    await state.server.start();
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
    state.logger?.info(`Received ${signal}, shutting down gracefully...`);

    try {
        // Stop server
        if (state.server) {
            await state.server.stop();
        }

        // Stop cache cleanup
        if (state.cacheSet) {
            state.cacheSet.stop();
        }

        // Close Redis connection
        if (state.redis) {
            await state.redis.quit();
            state.logger?.info('Redis connection closed');
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
 * Run the API server
 */
export async function runApi(): Promise<void> {
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
        console.error('Failed to initialize application:', err);
        process.exit(1);
    }
}
