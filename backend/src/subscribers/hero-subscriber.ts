/**
 * Hero Subscriber
 * Processes hero marketplace events (CreateOrder, Sold, CancelOrder)
 */

import {Log} from 'ethers';
import {BaseSubscriber, SubscriberConfig} from './base-subscriber';
import {BlockChainCenterApi} from '@/infrastructure/blockchain/blockchain-center-api';
import {IBlockTrackingRepository, IHeroTransactionRepository} from '@/domain/interfaces/repository';
import {BHeroMarketService} from '@/infrastructure/blockchain/contracts/bhero-market';
import {
    ALL_MARKET_TOPICS,
    CancelOrderEvent,
    CreateOrderEvent,
    EventParser,
    SoldEvent,
} from '@/infrastructure/blockchain/events/parser';
import {HeroTxReq, TX_STATUS} from '@/domain/models/hero';
import {Logger} from '@/utils/logger';

/**
 * Hero Subscriber Configuration
 * @interface HeroSubscriberConfig
 * @extends {SubscriberConfig}
 */
export interface HeroSubscriberConfig extends SubscriberConfig {
    heroContractAddress: string;
}

/**
 * HeroSubscriber processes hero marketplace events.
 * It listens to blockchain logs, parses them into events, and updates the database.
 *
 * Responsibilities:
 * - Listen for CreateOrder, Sold, CancelOrder.
 * - Sync listing status to DB (listing -> sold/deleted).
 * - Send notifications for sales.
 */
export class HeroSubscriber extends BaseSubscriber {
    private readonly heroRepo: IHeroTransactionRepository;
    private readonly heroMarket: BHeroMarketService;
    private readonly eventParser: EventParser;

    constructor(
        client: BlockChainCenterApi,
        blockRepo: IBlockTrackingRepository,
        heroRepo: IHeroTransactionRepository,
        heroMarket: BHeroMarketService,
        logger: Logger,
        config: HeroSubscriberConfig
    ) {
        super(client, blockRepo, logger, {
            ...config,
            contractAddress: config.heroContractAddress,
        });
        this.heroRepo = heroRepo;
        this.heroMarket = heroMarket;
        this.eventParser = new EventParser();
    }

    protected getName(): string {
        return 'HeroSubscriber';
    }

    protected getEventTopics(): string[] {
        return ALL_MARKET_TOPICS;
    }

    /**
     * Process a batch of blockchain logs.
     * Iterates through logs and delegates to processEvent.
     * Stops if shutdown signal is received.
     *
     * @param {Log[]} logs - Array of Ethers logs.
     * @throws {Error} If processing fails, allowing block retry logic to kick in.
     */
    protected async processEvents(logs: Log[]): Promise<void> {
        for (const log of logs) {
            if (this.shouldShutdown()) break;

            try {
                await this.processEvent(log);
            } catch (err) {
                this.logger.error('HeroSubscriber failed to process event', {
                    txHash: log.transactionHash,
                    logIndex: log.index,
                    error: this.getErrorMessage(err),
                });
                throw err; // Re-throw to mark block as failed
            }
        }
    }

    /**
     * Processes a single log entry.
     * Parses the log into a typed event and routes to specific handlers.
     *
     * @param {Log} log - The log to process.
     */
    private async processEvent(log: Log): Promise<void> {
        const event = this.eventParser.parseLog(log, 'hero');
        if (!event) {
            this.logger.warn('HeroSubscriber unknown event', {
                txHash: log.transactionHash,
                topic: log.topics[0],
            });
            return;
        }

        switch (event.type) {
            case 'CreateOrder':
                await this.handleCreateOrder(event);
                break;
            case 'Sold':
                await this.handleSold(event);
                break;
            case 'CancelOrder':
                await this.handleCancelOrder(event);
                break;
        }
    }

    /**
     * Handles the CreateOrder event (New Listing).
     *
     * Actions:
     * 1. Fetches block timestamp.
     * 2. Identifies payment token (BCOIN/SEN).
     * 3. Upserts order to DB with status 'listing'.
     *
     * @param {CreateOrderEvent} event - The parsed event.
     */
    private async handleCreateOrder(event: CreateOrderEvent): Promise<void> {
        const timestamp = await this.client.getBlockTimestamp(event.blockNumber);
        if (timestamp === null) {
            throw new Error(`Block ${event.blockNumber} not found`);
        }

        // Get payment token
        const payToken = await this.getPayToken(event.tokenId);

        const req: HeroTxReq = {
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            blockTimestamp: new Date(timestamp * 1000),
            status: TX_STATUS.LISTING,
            sellerWalletAddress: event.seller,
            buyerWalletAddress: '',
            heroDetails: event.tokenDetail.toString(),
            amount: event.price.toString(),
            tokenId: event.tokenId.toString(),
            payToken,
        };

        await this.heroRepo.upsert(req);

        this.logger.info('HeroSubscriber processed CreateOrder', {
            tokenId: event.tokenId.toString(),
            seller: event.seller,
            price: event.price.toString(),
        });
    }

    /**
     * Handles the Sold event (Successful Sale).
     *
     * Actions:
     * 1. Fetches block timestamp.
     * 2. Identifies payment token.
     * 3. Upserts order to DB with status 'sold'.
     * 4. Triggers external notification webhook.
     *
     * @param {SoldEvent} event - The parsed event.
     */
    private async handleSold(event: SoldEvent): Promise<void> {
        const timestamp = await this.client.getBlockTimestamp(event.blockNumber);
        if (timestamp === null) {
            throw new Error(`Block ${event.blockNumber} not found`);
        }

        // Get payment token
        const payToken = await this.getPayToken(event.tokenId);

        const req: HeroTxReq = {
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            blockTimestamp: new Date(timestamp * 1000),
            status: TX_STATUS.SOLD,
            sellerWalletAddress: event.seller,
            buyerWalletAddress: event.buyer,
            heroDetails: event.tokenDetail.toString(),
            amount: event.price.toString(),
            tokenId: event.tokenId.toString(),
            payToken,
        };

        await this.heroRepo.upsert(req);

        this.logger.info('HeroSubscriber processed Sold', {
            tokenId: event.tokenId.toString(),
            seller: event.seller,
            buyer: event.buyer,
            price: event.price.toString(),
        });

        // Send notification (fire and forget)
        this.sendSoldNotification(event).catch(err => {
            this.logger.warn('HeroSubscriber failed to send sold notification', {
                error: this.getErrorMessage(err),
            });
        });
    }

    /**
     * Handles the CancelOrder event (Listing Removed).
     *
     * Actions:
     * 1. Deletes all active 'create' orders for this token from DB.
     *
     * @param {CancelOrderEvent} event - The parsed event.
     */
    private async handleCancelOrder(event: CancelOrderEvent): Promise<void> {
        await this.heroRepo.deleteAllCreateOrders(event.tokenId.toString());

        this.logger.info('HeroSubscriber processed CancelOrder', {
            tokenId: event.tokenId.toString(),
        });
    }

    /**
     * Resolves the payment token name (e.g., 'BCOIN') for a specific token ID.
     * Defaults to 'BCOIN' if lookup fails.
     *
     * @param {bigint} tokenId - The token ID to check.
     * @returns {Promise<string>} The token symbol/name.
     */
    private async getPayToken(tokenId: bigint): Promise<string> {
        try {
            const payTokenAddresses = await this.heroMarket.getTokenPayList([tokenId]);
            if (payTokenAddresses.length > 0) {
                return this.getPayTokenName(payTokenAddresses[0]);
            }
        } catch (err) {
            this.logger.warn('HeroSubscriber failed to get pay token', {
                tokenId: tokenId.toString(),
                error: this.getErrorMessage(err),
            });
        }
        return 'BCOIN'; // Default to BCOIN
    }

    /**
     * Sends a webhook notification for a sold item.
     *
     * @param {SoldEvent} event - The sale event.
     */
    private async sendSoldNotification(event: SoldEvent): Promise<void> {
        if (!this.config.soldNotifyUrl) return;

        const url = new URL(this.config.soldNotifyUrl);
        url.searchParams.set('seller', event.seller);
        url.searchParams.set('buyer', event.buyer);
        url.searchParams.set('tokenId', event.tokenId.toString());
        url.searchParams.set('price', event.price.toString());

        const response = await fetch(url.toString(), {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            throw new Error(`Notification failed with status ${response.status}`);
        }
    }
}

/**
 * Factory function to create HeroSubscriber
 */
export function createHeroSubscriber(
    client: BlockChainCenterApi,
    blockRepo: IBlockTrackingRepository,
    heroRepo: IHeroTransactionRepository,
    heroMarket: BHeroMarketService,
    logger: Logger,
    config: HeroSubscriberConfig
): HeroSubscriber {
    return new HeroSubscriber(
        client,
        blockRepo,
        heroRepo,
        heroMarket,
        logger,
        config
    );
}
