import express, {Application, Request, Response} from 'express';
import helmet from 'helmet';
import {Server as HttpServer} from 'http';

import {Config} from '@/config/types';
import {DatabasePool} from '@/infrastructure/database/postgres';
import {CacheSet} from '@/infrastructure/cache/memory-cache';
import {createSearchIdTracker, IRedisClient, SearchIdTracker} from '@/infrastructure/redis/client';
import {BlockChainCenterApi, createBlockChainCenterApi} from '@/infrastructure/blockchain/blockchain-center-api';
import {Logger} from '@/utils/logger';

import {createRateLimiter} from '@/api/middleware';
import {createErrorHandler, notFoundHandler} from '@/api/middleware';

import {createUserRoutes} from '@/api/routes';
import {createHeroRoutes} from '@/api/routes';
import {createHouseRoutes} from '@/api/routes';
import {createAdminRoutes} from '@/api/routes';

import {createHeroTransactionRepository} from '@/repositories/hero-transaction.repository';
import {createHouseTransactionRepository} from '@/repositories/house-transaction.repository';
import {createWalletHistoryRepository} from '@/repositories/wallet-history.repository';
import {createAdminRepository} from '@/repositories/block-tracking.repository';

import {createRankingRoutes} from '@/api/routes/ranking.routes';
import {createExplorerRoutes} from '@/api/routes/explorer.routes';
import {createRankingRepository} from '@/repositories/ranking.repository';
import {NETWORK_BY_ALIAS} from '@/domain/models/ranking';

// Server dependencies
export interface ServerDeps {
    config: Config;
    db: DatabasePool;
    cacheSet: CacheSet;
    redis: IRedisClient | null;
    logger: Logger;
    /** Game database (bombcrypto2) - only set when rankings are enabled */
    gameDb?: DatabasePool | null;
}

// Server instance
export class ApiServer {
    private app: Application;
    private httpServer: HttpServer | null = null;
    private searchIdTracker: SearchIdTracker;
    private blockchainApi: BlockChainCenterApi | null = null;

    constructor(private deps: ServerDeps) {
        this.app = express();
        this.searchIdTracker = createSearchIdTracker(deps.redis, deps.config.server.network);
        this.setupBlockchainApi();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * Start the server
     */
    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            const {config, logger} = this.deps;
            const port = parseInt(config.server.port, 10);

            try {
                this.httpServer = this.app.listen(port, '0.0.0.0', () => {
                    logger.info(`Server is listening on 0.0.0.0:${port}`);
                    resolve();
                });

                this.httpServer.on('error', (err) => {
                    logger.error('Server error:', err);
                    reject(err);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Stop the server gracefully
     */
    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.httpServer) {
                resolve();
                return;
            }

            this.httpServer.close((err) => {
                if (err) {
                    this.deps.logger.error('Error closing server:', err);
                    reject(err);
                    return;
                }

                this.deps.logger.info('Server stopped');
                this.httpServer = null;
                resolve();
            });
        });
    }

    /**
     * Get the Express application (for testing)
     */
    getApp(): Application {
        return this.app;
    }

    private setupBlockchainApi(): void {
        const {config, logger} = this.deps;

        // Setup BlockchainCenterApi for contract calls
        if (config.server.blockchainCenterApiUrl) {
            try {
                this.blockchainApi = createBlockChainCenterApi({
                    baseUrl: config.server.blockchainCenterApiUrl,
                    network: config.server.network,
                    logger,
                });
                logger.info('BlockchainCenterApi initialized for API server');
            } catch (err) {
                logger.error('Failed to setup BlockchainCenterApi:', err);
            }
        } else {
            logger.warn('No BlockchainCenterApi URL configured, burn endpoints will not work');
        }
    }

    private setupMiddleware(): void {
        // Security headers
        this.app.use(helmet());

        // Rate limiting: 100 requests per 10 seconds per IP + endpoint
        this.app.use(createRateLimiter(10000, 100));

        // Body parsing
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));

        // Request logging
        this.app.use((req, _res, next) => {
            this.deps.logger.info(`${req.method} ${req.url}`);
            next();
        });
    }

    private setupRoutes(): void {
        const {config, db, cacheSet, logger} = this.deps;

        // Health check
        this.app.get('/', (_req: Request, res: Response) => {
            res.status(200).send('OK');
        });

        // Create repositories
        const heroTxRepo = createHeroTransactionRepository(db, logger);
        const houseTxRepo = createHouseTransactionRepository(db, logger);
        const walletHistoryRepo = createWalletHistoryRepository(db, logger);
        const adminRepo = createAdminRepository(db, logger);

        // API routes
        this.app.use(
            '/users',
            createUserRoutes({
                walletHistoryRepo,
                cache: cacheSet.getCache,
                redis: this.deps.redis,
                network: config.server.network,
                logger,
            })
        );

        this.app.use(
            '/transactions/heroes',
            createHeroRoutes({
                heroTxRepo,
                cache: cacheSet.listCache,
                searchIdTracker: this.searchIdTracker,
                blockchainApi: this.blockchainApi,
                contractAddress: config.server.bheroContractAddress,
                redis: this.deps.redis,
                network: config.server.network,
                logger,
            })
        );

        this.app.use(
            '/transactions/houses',
            createHouseRoutes({
                houseTxRepo,
                cache: cacheSet.listCache,
                searchIdTracker: this.searchIdTracker,
                blockchainApi: this.blockchainApi,
                contractAddress: config.server.bhouseContractAddress,
                logger,
            })
        );

        this.app.use(
            '/admin',
            createAdminRoutes(
                {
                    adminRepo,
                    cache: cacheSet.listCache,
                    logger,
                },
                config.server.adminApiKey
            )
        );

        this.setupRankingRoutes();
    }

    /**
     * Stake rankings + wallet/hero/house explorer. Read-only queries over the
     * game database (bombcrypto2); without that pool the routes stay off.
     */
    private setupRankingRoutes(): void {
        const {config, logger, gameDb, cacheSet} = this.deps;

        if (!gameDb) {
            logger.info('Rankings/explorer disabled (no game database configured)');
            return;
        }

        const network = NETWORK_BY_ALIAS[config.server.network] ?? 'BSC';
        const rankingRepo = createRankingRepository(gameDb, network, logger);

        this.app.use(
            '/rankings',
            createRankingRoutes({
                rankingRepo,
                cache: cacheSet.listCache,
                logger,
            })
        );
        this.app.use(
            '/explorer',
            createExplorerRoutes({
                rankingRepo,
                cache: cacheSet.getCache,
                logger,
            })
        );
        logger.info(`Rankings/explorer routes mounted at /rankings and /explorer (network ${network})`);
    }

    private setupErrorHandling(): void {
        // 404 handler
        this.app.use(notFoundHandler);

        // Global error handler
        this.app.use(createErrorHandler(this.deps.logger));
    }
}

// Factory function
export function createApiServer(deps: ServerDeps): ApiServer {
    return new ApiServer(deps);
}
