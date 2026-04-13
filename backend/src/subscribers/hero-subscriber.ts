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
    TransferEvent,
} from '@/infrastructure/blockchain/events/parser';
import {HeroTxReq, TX_STATUS} from '@/domain/models/hero';
import {Logger} from '@/utils/logger';

/**
 * Hero Subscriber Configuration
 */
export interface HeroSubscriberConfig extends SubscriberConfig {
    heroContractAddress: string;
    heroTokenContractAddress: string;
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
            contractAddress: [config.heroContractAddress, config.heroTokenContractAddress],
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
     * Process a single event
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
            case 'Transfer':
                await this.handleTransfer(event);
                break;
        }
    }

    /**
     * Handle CreateOrder event - create listing
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
     * Handle CancelOrder event
     */
    private async handleCancelOrder(event: CancelOrderEvent): Promise<void> {
        this.logger.info('Processing CancelOrder event', {
            tokenId: event.tokenId.toString(),
            transactionHash: event.transactionHash,
        });

        // Deactivate listing
        await this.heroRepo.deleteAllCreateOrders(Number(event.tokenId));
    }

    /**
     * Handle Transfer event (ERC721)
     * Automatically invalidates listings if the NFT is moved outside the marketplace
     */
    private async handleTransfer(event: TransferEvent): Promise<void> {
        // If it's a mint (from zero address) or a transfer TO the market (not possible here since market doesn't escrow), skip
        if (event.from === '0x0000000000000000000000000000000000000000') {
            return;
        }

        // We use a simple strategy: any transfer of a listed token should invalidate the listing.
        // If it's a 'Sold' event, the Sold handler will also call this, which is fine (idempotent).
        // If it's a manual transfer, this fixes the "ghost" listing.
        this.logger.info('Processing Transfer event for potential ghost listing cleanup', {
            tokenId: event.tokenId.toString(),
            from: event.from,
            to: event.to,
        });

        await this.heroRepo.deleteAllCreateOrders(Number(event.tokenId));
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
