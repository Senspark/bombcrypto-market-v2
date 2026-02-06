/**
 * BlockChain Center API Client
 * HTTP client for the centralized blockchain API service
 *
 * Provides contract calls via HTTP API:
 * - callContract (read-only contract calls)
 */

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
