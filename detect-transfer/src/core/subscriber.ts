import {getAddress} from 'ethers';
import {BlockChainCenterApi} from '@/infrastructure/blockchain/blockchain-center-api';
import {RedisClient} from '@/infrastructure/redis/client';
import {DatabasePool} from '@/infrastructure/database/postgres';
import {SubscriberConfig} from '@/config/types';
import {Logger} from '@/utils/logger';

const COOLDOWN_TTL_SECONDS = 900; // 15 minutes

const OWNER_OF_ABI = [{
    inputs: [{internalType: 'uint256', name: 'tokenId', type: 'uint256'}],
    name: 'ownerOf',
    outputs: [{internalType: 'address', name: '', type: 'address'}],
    stateMutability: 'view',
    type: 'function',
}];

const IS_APPROVED_FOR_ALL_ABI = [{
    inputs: [
        {internalType: 'address', name: 'owner', type: 'address'},
        {internalType: 'address', name: 'operator', type: 'address'},
    ],
    name: 'isApprovedForAll',
    outputs: [{internalType: 'bool', name: '', type: 'bool'}],
    stateMutability: 'view',
    type: 'function',
}];

const GET_ORDER_V2_ABI = [{
    inputs: [{internalType: 'uint256', name: '_tokenId', type: 'uint256'}],
    name: 'getOrderV2',
    outputs: [
        {internalType: 'uint256', name: 'tokenDetail', type: 'uint256'},
        {internalType: 'address', name: 'seller', type: 'address'},
        {internalType: 'uint256', name: 'price', type: 'uint256'},
        {internalType: 'uint256', name: 'startedAt', type: 'uint256'},
        {internalType: 'address', name: 'tokenAddress', type: 'address'},
    ],
    stateMutability: 'view',
    type: 'function',
}];

interface OrderRecord {
    id: number;
    txHash: string;
    tokenId: bigint;
    sellerWalletAddress: string;
    status: string;
    deleted: boolean;
    blockNumber: number;
}

export class Subscriber {
    private api: BlockChainCenterApi;
    private config: SubscriberConfig;
    private erc721Address: string;
    private marketAddress: string;
    private dbTable: string;
    private dbSearchPath: string;
    private typeStr: string;
    private redisNetworkSuffix: string;
    private redisKeyIds: string;
    private redisKeyCooldownPrefix: string;
    private redis: RedisClient;
    private db: DatabasePool;
    private logger: Logger;

    constructor(
        config: SubscriberConfig,
        api: BlockChainCenterApi,
        redis: RedisClient,
        db: DatabasePool,
        logger: Logger
    ) {
        this.config = config;
        this.api = api;
        this.redis = redis;
        this.db = db;
        this.logger = logger;

        this.erc721Address = getAddress(config.erc721Address);
        this.marketAddress = getAddress(config.marketAddress);
        this.dbTable = config.dbTable;
        this.dbSearchPath = config.dbSearchPath;

        if (this.dbTable.includes('hero')) {
            this.typeStr = 'HERO';
        } else if (this.dbTable.includes('house')) {
            this.typeStr = 'HOUSE';
        } else {
            throw new Error(`Unknown table type: ${this.dbTable}`);
        }

        this.redisNetworkSuffix = config.network === 'POLYGON' ? 'POL' : config.network;
        this.redisKeyIds = `MKP_${this.typeStr}_SEARCH_IDS_${this.redisNetworkSuffix}`;
        this.redisKeyCooldownPrefix = `MKP_${this.typeStr}_COOLDOWN_${this.redisNetworkSuffix}:`;

        this.logger.info(`Initialized Subscriber for ${this.redisKeyIds}`);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async verifyOrder(record: OrderRecord): Promise<void> {
        const {id: orderDbId, tokenId, sellerWalletAddress} = record;

        this.logger.info(`Processing DB ID: ${orderDbId} | Token: ${tokenId}`);

        try {
            // Check order existence
            let orderData: [string, string, string, string, string];
            try {
                this.logger.info(`Checking order for token ${tokenId}`);
                orderData = await this.api.callContract<[string, string, string, string, string]>(
                    this.marketAddress,
                    GET_ORDER_V2_ABI,
                    'getOrderV2',
                    [tokenId.toString()]
                );
            } catch (e) {
                if (String(e).includes('order not existed')) {
                    await this.markDeleted(orderDbId, tokenId, 'order not existed');
                }
                return;
            }

            // Check owner
            let ownerData: string;
            try {
                this.logger.info(`Checking owner for token ${tokenId}`);
                ownerData = await this.api.callContract<string>(
                    this.erc721Address,
                    OWNER_OF_ABI,
                    'ownerOf',
                    [tokenId.toString()]
                );
            } catch (e) {
                if (String(e).includes('invalid token ID')) {
                    await this.markDeleted(orderDbId, tokenId, 'Token not found or burned');
                }
                return;
            }

            // Verify Seller == Owner
            const seller = orderData[1];
            if (seller.toLowerCase() !== ownerData.toLowerCase()) {
                await this.markDeleted(
                    orderDbId,
                    tokenId,
                    `Owner (${ownerData}) and Seller (${seller}) mismatch`
                );
                return;
            }

            // Check approval
            try {
                this.logger.info(`Checking approval for token ${tokenId}`);
                const approved = await this.api.callContract<boolean>(
                    this.erc721Address,
                    IS_APPROVED_FOR_ALL_ABI,
                    'isApprovedForAll',
                    [getAddress(seller), this.marketAddress]
                );

                if (!approved) {
                    await this.markDeleted(orderDbId, tokenId, 'Not approved For All');
                }
            } catch (e) {
                this.logger.error(`error when checking approved: ${e} token_id: ${tokenId}`);
            }
        } catch (e) {
            this.logger.error(`Unexpected error verifying order ${orderDbId}: ${e}`);
        }
    }

    private async markDeleted(orderDbId: number, tokenId: bigint, reason: string): Promise<void> {
        await this.db.query(
            `UPDATE ${this.dbSearchPath}.${this.dbTable} SET deleted = true WHERE id = $1`,
            [orderDbId]
        );
        this.logger.info(`deleted: ${tokenId} (DB ID: ${orderDbId}) reason: ${reason}`);
    }

    async processBatch(batchSize: number = 50): Promise<number> {
        let processedCount = 0;

        while (processedCount < batchSize) {
            try {
                // 1. Pop an ID from the Set
                const searchIdStr = await this.redis.popFromSet(this.redisKeyIds);

                if (!searchIdStr) {
                    return processedCount;
                }

                const searchId = parseInt(searchIdStr, 10);
                processedCount++;

                // 2. Check Cooldown
                const cooldownKey = `${this.redisKeyCooldownPrefix}${searchId}`;
                const inCooldown = await this.redis.exists(cooldownKey);

                if (inCooldown) {
                    this.logger.info(`Skipping ${searchId}, in cooldown.`);
                    continue;
                }

                // 3. Fetch record from DB
                const result = await this.db.query<{
                    id: number;
                    tx_hash: string;
                    token_id: string;
                    seller_wallet_address: string;
                    status: string;
                    deleted: boolean;
                    block_number: number;
                }>(
                    `SELECT id, tx_hash, token_id, seller_wallet_address, status, deleted, block_number
                     FROM ${this.dbSearchPath}.${this.dbTable}
                     WHERE id = $1`,
                    [searchId]
                );

                const row = result.rows[0];
                if (row) {
                    const record: OrderRecord = {
                        id: row.id,
                        txHash: row.tx_hash,
                        tokenId: BigInt(row.token_id),
                        sellerWalletAddress: row.seller_wallet_address,
                        status: row.status,
                        deleted: row.deleted,
                        blockNumber: row.block_number,
                    };

                    if (record.status === 'listing' && !record.deleted) {
                        await this.verifyOrder(record);
                    } else {
                        this.logger.info(`Skipping ${searchId}: Status ${record.status}, Deleted ${record.deleted}`);
                    }
                } else {
                    this.logger.warn(`Record ${searchId} not found in DB`);
                }

                // 4. Set Cooldown
                await this.redis.set(cooldownKey, 1, COOLDOWN_TTL_SECONDS);
            } catch (e) {
                this.logger.error(`Error in processBatch: ${e}`);
                await this.sleep(1000);
                return processedCount;
            }
        }

        return processedCount;
    }
}
