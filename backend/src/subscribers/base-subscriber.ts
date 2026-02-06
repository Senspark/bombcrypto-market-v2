/**
 * Base Subscriber
 * Abstract base class for blockchain event subscribers
 * Provides shared logic for block processing, retry mechanism, and graceful shutdown
 */

import {Log} from 'ethers';
import {BlockChainCenterApi} from '@/infrastructure/blockchain/blockchain-center-api';
import {IBlockTrackingRepository} from '@/domain/interfaces/repository';
import {Logger} from '@/utils/logger';

// Constants
const BLOCK_STEP = 499; // Process 499 blocks per chunk
const RETRY_BLOCK_STEP = 499; // Retry 499 blocks per chunk
const TIME_PER_BLOCK_MS = 10_000; // 10 seconds wait for new blocks
const TIME_PER_RETRY_MS = 5 * 60 * 1000; // 5 minutes between retry scans
const MAX_FAILURES = 50; // Max retry attempts before giving up
const PROCESS_CHUNK_DELAY_MS = 5000;

/**
 * Subscriber configuration
 */
export interface SubscriberConfig {
    contractAddress: string;
    startingBlockNumber: number;
    soldNotifyUrl?: string;
    bcoinContractAddress: string;
    senContractAddress: string;
}

/**
 * Abstract base class for blockchain subscribers
 */
export abstract class BaseSubscriber {
    protected readonly client: BlockChainCenterApi;
    protected readonly blockRepo: IBlockTrackingRepository;
    protected readonly logger: Logger;
    protected readonly config: SubscriberConfig;

    private isShuttingDown = false;
    private subscribeLoopActive = false;
    private retryLoopActive = false;

    constructor(
        client: BlockChainCenterApi,
        blockRepo: IBlockTrackingRepository,
        logger: Logger,
        config: SubscriberConfig
    ) {
        this.client = client;
        this.blockRepo = blockRepo;
        this.logger = logger;
        this.config = config;
    }

    /**
     * Start the subscriber
     * Runs both subscribe and retry loops concurrently
     */
    async start(): Promise<void> {
        this.logger.info(`${this.getName()} starting...`);

        // Run both loops concurrently
        const subscribePromise = this.subscribeLoop();
        const retryPromise = this.retryLoop();

        // Wait for both to complete (they will complete on shutdown)
        await Promise.all([subscribePromise, retryPromise]);

        this.logger.info(`${this.getName()} stopped`);
    }

    /**
     * Signal graceful shutdown
     */
    shutdown(): void {
        this.logger.info(`${this.getName()} received shutdown signal`);
        this.isShuttingDown = true;
    }

    /**
     * Abstract method to process events from a block range
     * Implemented by HeroSubscriber and HouseSubscriber
     */
    protected abstract processEvents(logs: Log[]): Promise<void>;

    /**
     * Get the event topics to filter for
     */
    protected abstract getEventTopics(): string[];

    /**
     * Get the subscriber name for logging
     */
    protected abstract getName(): string;

    /**
     * Check if shutdown has been signaled
     */
    protected shouldShutdown(): boolean {
        return this.isShuttingDown;
    }

    /**
     * Process a block range - fetch logs and process events
     */
    protected async processBlockRange(fromBlock: number, toBlock: number): Promise<void> {
        // Fetch logs using BlockChainCenterApi
        const logs = await this.client.filterLogs(
            this.config.contractAddress,
            [this.getEventTopics()],
            fromBlock,
            toBlock,
        );

        // Filter out removed logs
        const validLogs = logs.filter(log => !log.removed);

        if (validLogs.length > 0) {
            this.logger.info(`${this.getName()} found events`, {
                fromBlock,
                toBlock,
                eventCount: validLogs.length,
            });

            // Process each event
            await this.processEvents(validLogs);
        }
    }

    /**
     * Sleep with shutdown check
     */
    protected async sleepWithShutdownCheck(ms: number): Promise<void> {
        const checkInterval = 1000; // Check every second
        let elapsed = 0;

        while (elapsed < ms && !this.shouldShutdown()) {
            await this.sleep(Math.min(checkInterval, ms - elapsed));
            elapsed += checkInterval;
        }
    }

    /**
     * Simple sleep helper
     */
    protected sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Extract error message safely
     */
    protected getErrorMessage(err: unknown): string {
        if (err instanceof Error) return err.message;
        return String(err);
    }

    /**
     * Map token address to token name (BCOIN, SEN, or address)
     */
    protected getPayTokenName(tokenAddress: string): string {
        const addr = tokenAddress.toLowerCase();

        if (addr === this.config.bcoinContractAddress.toLowerCase()) {
            return 'BCOIN';
        }

        if (addr === this.config.senContractAddress.toLowerCase()) {
            return 'SEN';
        }

        return tokenAddress;
    }

    /**
     * Main subscribe loop - processes new blocks forward
     */
    private async subscribeLoop(): Promise<void> {
        this.subscribeLoopActive = true;
        this.logger.info(`${this.getName()} subscribe loop started`);

        while (!this.shouldShutdown()) {
            try {
                await this.processNextChunk();
            } catch (err) {
                this.logger.error(`${this.getName()} subscribe loop error`, {
                    error: this.getErrorMessage(err),
                });
                // Continue after error with a small delay
                await this.sleep(PROCESS_CHUNK_DELAY_MS);
            }
        }

        this.subscribeLoopActive = false;
        this.logger.info(`${this.getName()} subscribe loop stopped`);
    }

    /**
     * Retry loop - processes failed blocks
     */
    private async retryLoop(): Promise<void> {
        this.retryLoopActive = true;
        this.logger.info(`${this.getName()} retry loop started`);

        while (!this.shouldShutdown()) {
            try {
                await this.processFailedBlocks();
            } catch (err) {
                this.logger.error(`${this.getName()} retry loop error`, {
                    error: this.getErrorMessage(err),
                });
            }

            // Wait before next retry scan
            await this.sleepWithShutdownCheck(TIME_PER_RETRY_MS);
        }

        this.retryLoopActive = false;
        this.logger.info(`${this.getName()} retry loop stopped`);
    }

    /**
     * Process the next chunk of blocks
     */
    private async processNextChunk(): Promise<void> {
        // Get current block from DB
        const fromBlock = await this.blockRepo.getBlockNumber();
        let toBlock = fromBlock + BLOCK_STEP;

        // Get current chain height
        const latestBlock = await this.client.getBlockNumber();

        // Adjust toBlock to not exceed available blocks (like Go version)
        if (toBlock > latestBlock) {
            toBlock = latestBlock;
        }

        // Only wait if we're completely caught up (no new blocks at all)
        if (toBlock <= fromBlock) {
            await this.waitForNewBlock(fromBlock);
            toBlock = await this.client.getBlockNumber();
        }

        if (this.shouldShutdown()) return;

        // Process the block range
        try {
            await this.processBlockRange(fromBlock, toBlock);
            // Update the block number on success
            await this.blockRepo.setBlockNumber(toBlock);
            this.logger.info(`${this.getName()} processed blocks`, {
                fromBlock,
                toBlock,
            });
        } catch (err) {
            // Mark as failed and still advance to prevent getting stuck
            await this.blockRepo.increaseFailure(fromBlock);
            await this.blockRepo.setBlockNumber(toBlock);
            this.logger.warn(`${this.getName()} failed to process blocks, marked for retry`, {
                fromBlock,
                toBlock,
                error: this.getErrorMessage(err),
            });
        }

        // Small delay between chunks
        await this.sleep(PROCESS_CHUNK_DELAY_MS);
    }

    /**
     * Wait until at least one new block is available beyond currentBlock
     * Only called when completely caught up to chain tip
     */
    private async waitForNewBlock(currentBlock: number): Promise<void> {
        while (!this.shouldShutdown()) {
            try {
                const latestBlock = await this.client.getBlockNumber();

                if (latestBlock > currentBlock) {
                    return; // New block is available
                }

                this.logger.debug(`${this.getName()} waiting for new block`, {
                    currentBlock,
                    latestBlock,
                });
            } catch (err) {
                this.logger.warn(`${this.getName()} failed to get block number`, {
                    error: this.getErrorMessage(err),
                });
            }

            // Wait before checking again
            await this.sleepWithShutdownCheck(TIME_PER_BLOCK_MS);
        }
    }

    /**
     * Process all failed blocks
     */
    private async processFailedBlocks(): Promise<void> {
        const failedBlocks = await this.blockRepo.getFailedBlocks(MAX_FAILURES);

        if (failedBlocks.length === 0) {
            return;
        }

        this.logger.info(`${this.getName()} retrying failed blocks`, {
            count: failedBlocks.length,
        });

        for (const {blockNumber, failure} of failedBlocks) {
            if (this.shouldShutdown()) break;

            const toBlock = blockNumber + RETRY_BLOCK_STEP;

            try {
                await this.processBlockRange(blockNumber, toBlock);

                // Success - remove from failed blocks
                await this.blockRepo.removeFailedBlock(blockNumber);
                this.logger.info(`${this.getName()} successfully retried block`, {
                    blockNumber,
                    previousFailures: failure,
                });
            } catch (err) {
                // Failed again - increment failure counter
                await this.blockRepo.increaseFailure(blockNumber);
                this.logger.warn(`${this.getName()} failed to retry block`, {
                    blockNumber,
                    failure: failure + 1,
                    error: this.getErrorMessage(err),
                });
            }

            // Small delay between retries
            await this.sleep(PROCESS_CHUNK_DELAY_MS);
        }
    }
}
