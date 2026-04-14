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
 */
export interface HeroSubscriberConfig extends SubscriberConfig {
    heroContractAddress: string;
}

/**
 * HeroSubscriber processes hero marketplace events
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
     * Process hero market events
     */
    protected async processEvents(logs: Log[]): Promise<void> {
        if (logs.length === 0) return;

        // BATCH OPTIMIZATION: Resolve all timestamps and pay tokens in one go
        const blockNumbers = Array.from(new Set(logs.map(log => log.blockNumber)));
        const tokenIds = Array.from(new Set(logs.map(log => {
            const event = this.eventParser.parseLog(log, 'hero');
            return event && 'tokenId' in event ? event.tokenId : null;
        }).filter((id): id is bigint => id !== null)));

        // Cache for batch results
        const timestampMap = new Map<number, number>();
        const payTokenMap = new Map<string, string>();

        // 1. Fetch all timestamps
        await Promise.all(blockNumbers.map(async (bn) => {
            const ts = await this.client.getBlockTimestamp(bn);
            if (ts !== null) timestampMap.set(bn, ts);
        }));

        // 2. Fetch all pay tokens via multicall if needed, or using existing service
        if (tokenIds.length > 0) {
            const payTokens = await this.heroMarket.getTokenPayList(tokenIds);
            tokenIds.forEach((id, index) => {
                if (payTokens[index]) {
                    payTokenMap.set(id.toString(), this.getPayTokenName(payTokens[index]));
                }
            });
        }

        for (const log of logs) {
            if (this.shouldShutdown()) break;

            try {
                const event = this.eventParser.parseLog(log, 'hero');
                if (!event) continue;

                const timestamp = timestampMap.get(log.blockNumber);
                const payToken = ('tokenId' in event) ? (payTokenMap.get(event.tokenId.toString()) || 'BCOIN') : 'BCOIN';

                if (timestamp === undefined) {
                    throw new Error(`Timestamp for block ${log.blockNumber} not pre-fetched`);
                }

                await this.processParsedEvent(event, log, timestamp, payToken);
            } catch (err) {
                this.logger.error('HeroSubscriber failed to process event', {
                    txHash: log.transactionHash,
                    logIndex: log.index,
                    error: this.getErrorMessage(err),
                });
                throw err;
            }
        }
    }

    /**
     * Process a single event (Internal version with pre-fetched data)
     */
    private async processParsedEvent(event: any, log: Log, timestamp: number, payToken: string): Promise<void> {
        switch (event.type) {
            case 'CreateOrder':
                await this.handleCreateOrderWithData(event, timestamp, payToken);
                break;
            case 'Sold':
                await this.handleSoldWithData(event, timestamp, payToken);
                break;
            case 'CancelOrder':
                await this.handleCancelOrder(event);
                break;
        }
    }

    /**
     * Handle CreateOrder event - create listing
     */
    private async handleCreateOrderWithData(event: CreateOrderEvent, timestamp: number, payToken: string): Promise<void> {
        const req: HeroTxReq = {
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            blockTimestamp: new Date(timestamp * 1000),
            status: TX_STATUS.LISTING,
            sellerWalletAddress: event.seller,
            buyerWalletAddress: '',
            heroDetails: event.tokenDetail.toString(),
            amount: event.price.toString(),
            tokenId: Number(event.tokenId),
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
     * Handle Sold event - mark as sold
     */
    private async handleSoldWithData(event: SoldEvent, timestamp: number, payToken: string): Promise<void> {
        const req: HeroTxReq = {
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            blockTimestamp: new Date(timestamp * 1000),
            status: TX_STATUS.SOLD,
            sellerWalletAddress: event.seller,
            buyerWalletAddress: event.buyer,
            heroDetails: event.tokenDetail.toString(),
            amount: event.price.toString(),
            tokenId: Number(event.tokenId),
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
     * Handle CancelOrder event - delete listing
     */
    private async handleCancelOrder(event: CancelOrderEvent): Promise<void> {
        await this.heroRepo.deleteAllCreateOrders(Number(event.tokenId));

        this.logger.info('HeroSubscriber processed CancelOrder', {
            tokenId: event.tokenId.toString(),
        });
    }

    /**
     * Get payment token name for a token
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
     * Send notification for sold event
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
