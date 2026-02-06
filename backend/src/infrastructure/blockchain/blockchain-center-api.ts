/**
 * BlockChain Center API Client
 * HTTP client for the centralized blockchain API service
 *
 * Replaces direct RPC connections with API calls for:
 * - getLogs (filter contract events)
 * - getBlockNumber (latest block)
 * - getBlockTimestamp (block timestamp)
 * - callContract (read-only contract calls)
 */

import {Log} from 'ethers';
import type {Logger} from '@/utils/logger';

/** Retry configuration */
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 3000]; // ms

/** API response types */
interface ApiResponse<T> {
    success: boolean;
    result?: T;
    error?: string;
}

interface RawLog {
    address: string;
    topics: string[];
    data: string;
    blockNumber: number;
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    logIndex: number;
    removed: boolean;
}

export interface BlockChainCenterApiConfig {
    baseUrl: string;
    network: string;
    logger: Logger;
}

/**
 * BlockChainCenterApi provides HTTP-based blockchain operations
 * via a centralized API service
 */
export class BlockChainCenterApi {
    private readonly baseUrl: string;
    private readonly network: string;
    private readonly logger: Logger;

    constructor(config: BlockChainCenterApiConfig) {
        const {baseUrl, network, logger} = config;

        if (!baseUrl) {
            throw new Error('BlockChainCenterApi baseUrl is required');
        }
        if (!network) {
            throw new Error('BlockChainCenterApi network is required');
        }

        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.network = network;
        this.logger = logger;

        this.logger.info('BlockChainCenterApi initialized', {
            baseUrl: this.baseUrl,
            network: this.network,
        });
    }

    /**
     * Filter logs for contract events
     * POST /getLogs
     */
    async filterLogs(
        address: string,
        topics: (string | string[] | null)[],
        fromBlock: number,
        toBlock: number,
    ): Promise<Log[]> {
        const response = await this.postWithRetry<RawLog[]>('/getLogs', {
            network: this.network,
            address,
            topics,
            fromBlock,
            toBlock,
        });

        // Convert raw logs to ethers Log format
        return response.map(raw => this.toEthersLog(raw));
    }

    /**
     * Get latest block number
     * GET /latestBlockNumber?network=X
     */
    async getBlockNumber(): Promise<number> {
        const url = `${this.baseUrl}/latestBlockNumber?network=${encodeURIComponent(this.network)}`;

        const response = await this.fetchWithRetry<number>(url, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
        });

        return response;
    }

    /**
     * Get block timestamp
     * POST /getBlockTimestamp
     * @returns timestamp in seconds, or null if block not found
     */
    async getBlockTimestamp(blockNumber: number): Promise<number | null> {
        const response = await this.postWithRetry<number | null>('/getBlockTimestamp', {
            network: this.network,
            blockNumber,
        });

        return response;
    }

    /**
     * Call a read-only contract method
     * POST /callContract
     */
    async callContract<T>(
        contractAddress: string,
        abi: unknown[],
        methodName: string,
        args: unknown[] = [],
    ): Promise<T> {
        const response = await this.postWithRetry<T>('/callContract', {
            network: this.network,
            contractAddress,
            abi,
            methodName,
            args,
        });

        return response;
    }

    /**
     * Stop the client (no-op for HTTP client, included for interface compatibility)
     */
    stop(): void {
        this.logger.info('BlockChainCenterApi stopped');
    }

    /**
     * POST request with retry logic
     */
    private async postWithRetry<T>(
        path: string,
        body: Record<string, unknown>,
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;

        return this.fetchWithRetry<T>(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
    }

    /**
     * Fetch with retry logic
     */
    private async fetchWithRetry<T>(
        url: string,
        options: RequestInit,
    ): Promise<T> {
        let lastError: unknown;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(url, options);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = (await response.json()) as ApiResponse<T>;

                if (!data.success) {
                    throw new Error(data.error ?? 'API returned success=false');
                }

                return data.result as T;
            } catch (err) {
                lastError = err;

                this.logger.warn('BlockChainCenterApi request failed', {
                    url,
                    attempt: attempt + 1,
                    maxRetries: MAX_RETRIES,
                    error: this.getErrorMessage(err),
                });

                // Wait before retry (except on last attempt)
                if (attempt < MAX_RETRIES - 1) {
                    const delay = RETRY_DELAYS[attempt] ?? 3000;
                    await this.sleep(delay);
                }
            }
        }

        throw new Error(
            `BlockChainCenterApi request failed after ${MAX_RETRIES} retries: ${this.getErrorMessage(lastError)}`,
        );
    }

    /**
     * Convert raw log from API to ethers Log format
     */
    private toEthersLog(raw: RawLog): Log {
        // Create a minimal Log-compatible object
        // The subscriber only uses: address, topics, data, blockNumber, transactionHash, index, removed
        return {
            address: raw.address,
            topics: raw.topics,
            data: raw.data,
            blockNumber: raw.blockNumber,
            transactionHash: raw.transactionHash,
            transactionIndex: raw.transactionIndex,
            blockHash: raw.blockHash,
            index: raw.logIndex,
            removed: raw.removed,
            provider: null,
            getBlock: () => {
                throw new Error('getBlock not supported in API mode');
            },
            getTransaction: () => {
                throw new Error('getTransaction not supported in API mode');
            },
            getTransactionReceipt: () => {
                throw new Error('getTransactionReceipt not supported in API mode');
            },
            removedEvent: () => {
                throw new Error('removedEvent not supported in API mode');
            },
            toJSON: () => ({
                address: raw.address,
                topics: raw.topics,
                data: raw.data,
                blockNumber: raw.blockNumber,
                transactionHash: raw.transactionHash,
                transactionIndex: raw.transactionIndex,
                blockHash: raw.blockHash,
                index: raw.logIndex,
                removed: raw.removed,
            }),
        } as unknown as Log;
    }

    private getErrorMessage(err: unknown): string {
        if (err instanceof Error) return err.message;
        return String(err);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Factory function to create BlockChainCenterApi
 */
export function createBlockChainCenterApi(
    config: BlockChainCenterApiConfig,
): BlockChainCenterApi {
    return new BlockChainCenterApi(config);
}
