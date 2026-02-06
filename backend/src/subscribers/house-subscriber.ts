/**
 * House Subscriber
 * Processes house marketplace events (CreateOrder, Sold, CancelOrder)
 */

import {Log} from 'ethers';
import {BaseSubscriber, SubscriberConfig} from './base-subscriber';
import {BlockChainCenterApi} from '@/infrastructure/blockchain/blockchain-center-api';
import {IBlockTrackingRepository, IHouseTransactionRepository} from '@/domain/interfaces/repository';
import {BHouseMarketService} from '@/infrastructure/blockchain/contracts/bhouse-market';
import {
    ALL_MARKET_TOPICS,
    CancelOrderEvent,
    CreateOrderEvent,
    EventParser,
    SoldEvent,
} from '@/infrastructure/blockchain/events/parser';
import {HouseTxReq} from '@/domain/models/house';
import {TX_STATUS} from '@/domain/models/hero';
import {Logger} from '@/utils/logger';

/**
 * House Subscriber Configuration
 */
export interface HouseSubscriberConfig extends SubscriberConfig {
    houseContractAddress: string;
}

/**
 * HouseSubscriber processes house marketplace events
 */
export class HouseSubscriber extends BaseSubscriber {
    private readonly houseRepo: IHouseTransactionRepository;
    private readonly houseMarket: BHouseMarketService;
    private readonly eventParser: EventParser;

    constructor(
        client: BlockChainCenterApi,
        blockRepo: IBlockTrackingRepository,
        houseRepo: IHouseTransactionRepository,
        houseMarket: BHouseMarketService,
        logger: Logger,
        config: HouseSubscriberConfig
    ) {
        super(client, blockRepo, logger, {
            ...config,
            contractAddress: config.houseContractAddress,
        });
        this.houseRepo = houseRepo;
        this.houseMarket = houseMarket;
        this.eventParser = new EventParser();
    }

    protected getName(): string {
        return 'HouseSubscriber';
    }

    protected getEventTopics(): string[] {
        return ALL_MARKET_TOPICS;
    }

    /**
     * Process house market events
     */
    protected async processEvents(logs: Log[]): Promise<void> {
        for (const log of logs) {
            if (this.shouldShutdown()) break;

            try {
                await this.processEvent(log);
            } catch (err) {
                this.logger.error('HouseSubscriber failed to process event', {
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
        const event = this.eventParser.parseLog(log, 'house');
        if (!event) {
            this.logger.warn('HouseSubscriber unknown event', {
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
     * Handle CreateOrder event - create listing
     */
    private async handleCreateOrder(event: CreateOrderEvent): Promise<void> {
        const timestamp = await this.client.getBlockTimestamp(event.blockNumber);
        if (timestamp === null) {
            throw new Error(`Block ${event.blockNumber} not found`);
        }

        // Get payment token
        const payToken = await this.getPayToken(event.tokenId);

        const req: HouseTxReq = {
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            blockTimestamp: new Date(timestamp * 1000),
            status: TX_STATUS.LISTING,
            sellerWalletAddress: event.seller,
            buyerWalletAddress: '',
            houseDetails: event.tokenDetail.toString(),
            amount: event.price.toString(),
            tokenId: event.tokenId.toString(),
            payToken,
        };

        await this.houseRepo.upsert(req);

        this.logger.info('HouseSubscriber processed CreateOrder', {
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

        const req: HouseTxReq = {
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            blockTimestamp: new Date(timestamp * 1000),
            status: TX_STATUS.SOLD,
            sellerWalletAddress: event.seller,
            buyerWalletAddress: event.buyer,
            houseDetails: event.tokenDetail.toString(),
            amount: event.price.toString(),
            tokenId: event.tokenId.toString(),
            payToken,
        };

        await this.houseRepo.upsert(req);

        this.logger.info('HouseSubscriber processed Sold', {
            tokenId: event.tokenId.toString(),
            seller: event.seller,
            buyer: event.buyer,
            price: event.price.toString(),
        });

        // Send notification (fire and forget)
        this.sendSoldNotification(event).catch(err => {
            this.logger.warn('HouseSubscriber failed to send sold notification', {
                error: this.getErrorMessage(err),
            });
        });
    }

    /**
     * Handle CancelOrder event - delete listing
     */
    private async handleCancelOrder(event: CancelOrderEvent): Promise<void> {
        await this.houseRepo.deleteAllCreateOrders(event.tokenId.toString());

        this.logger.info('HouseSubscriber processed CancelOrder', {
            tokenId: event.tokenId.toString(),
        });
    }

    /**
     * Get payment token name for a token
     */
    private async getPayToken(tokenId: bigint): Promise<string> {
        try {
            const payTokenAddresses = await this.houseMarket.getTokenPayList([tokenId]);
            if (payTokenAddresses.length > 0) {
                return this.getPayTokenName(payTokenAddresses[0]);
            }
        } catch (err) {
            this.logger.warn('HouseSubscriber failed to get pay token', {
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
 * Factory function to create HouseSubscriber
 */
export function createHouseSubscriber(
    client: BlockChainCenterApi,
    blockRepo: IBlockTrackingRepository,
    houseRepo: IHouseTransactionRepository,
    houseMarket: BHouseMarketService,
    logger: Logger,
    config: HouseSubscriberConfig
): HouseSubscriber {
    return new HouseSubscriber(
        client,
        blockRepo,
        houseRepo,
        houseMarket,
        logger,
        config
    );
}
