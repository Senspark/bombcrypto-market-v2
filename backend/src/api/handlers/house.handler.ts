import {Request, Response} from 'express';
import {IHouseTransactionRepository} from '@/domain/interfaces/repository';
import {createEmptyHouseTxFilterContext, HouseTxFilterContext, HouseTxReq} from '@/domain/models/house';
import {TX_STATUS} from '@/domain/models/hero';
import {generateCacheKeyFromData, ICache} from '@/infrastructure/cache/memory-cache';
import {SearchIdTracker} from '@/infrastructure/redis/client';
import {BlockChainCenterApi} from '@/infrastructure/blockchain/blockchain-center-api';
import {createBHouseMarketService} from '@/infrastructure/blockchain/contracts/bhouse-market';
import {resolvePayTokenName} from '@/utils/pay-token';
import {Logger} from '@/utils/logger';
import {asyncHandler, HttpErrors} from '../middleware/error-handler';

// Constants
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// ownerOf ABI for ERC721
const OWNER_OF_ABI = [
    {
        inputs: [{internalType: 'uint256', name: 'tokenId', type: 'uint256'}],
        name: 'ownerOf',
        outputs: [{internalType: 'address', name: 'owner', type: 'address'}],
        stateMutability: 'view',
        type: 'function',
    },
];

// House handler dependencies
export interface HouseHandlerDeps {
    houseTxRepo: IHouseTransactionRepository;
    cache: ICache;
    searchIdTracker: SearchIdTracker;
    blockchainApi: BlockChainCenterApi | null;
    contractAddress: string;
    marketContractAddress: string;
    bcoinContractAddress: string;
    senContractAddress: string;
    logger: Logger;
}

// Parse array query param
function parseArrayParam(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') return [value];
    return [];
}

// Parse number array query param
function parseNumberArrayParam(value: unknown): number[] {
    const strings = parseArrayParam(value);
    return strings
        .map((s) => parseInt(s, 10))
        .filter((n) => !isNaN(n));
}

// Parse single number query param
function parseNumberParam(value: unknown, defaultVal: number = 0): number {
    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultVal : parsed;
    }
    return defaultVal;
}

// Parse filter context from request query
function parseHouseFilterContext(query: Request['query']): HouseTxFilterContext {
    const ctx = createEmptyHouseTxFilterContext();

    // Pagination
    ctx.page = parseNumberParam(query.page, 1);
    ctx.size = parseNumberParam(query.size, 20);

    // Order by - format: direction:column (e.g., desc:block_timestamp)
    const orderBy = parseArrayParam(query.order_by);
    if (orderBy.length > 0) {
        const parts = orderBy[0].split(':');
        if (parts.length === 2) {
            const direction = parts[0].toLowerCase();
            if (direction === 'asc' || direction === 'desc') {
                ctx.orderDirection = direction;
                ctx.orderBy = parts[1];
            }
        }
    }

    // Array filters
    ctx.status = parseArrayParam(query.status);
    ctx.sellerWalletAddress = parseArrayParam(query.seller_wallet_address);
    ctx.buyerWalletAddress = parseArrayParam(query.buyer_wallet_address);
    ctx.txHash = parseArrayParam(query.tx_hash);
    ctx.payToken = parseArrayParam(query.pay_token);

    // Number array filters
    ctx.tokenId = parseNumberArrayParam(query.token_id);
    ctx.rarity = parseNumberArrayParam(query.rarity);

    // RHS format filters (e.g., amount=gte:1000000000000000000)
    ctx.amount = parseArrayParam(query.amount);

    return ctx;
}

/**
 * GET /transactions/houses/search
 * Search house transactions
 */
export function createSearchHandler(deps: HouseHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const filterContext = parseHouseFilterContext(req.query);

        // Generate cache key and use cache
        const cacheKey = generateCacheKeyFromData('house_search', filterContext);
        const result = await deps.cache.get(cacheKey, async () => {
            return deps.houseTxRepo.filter(filterContext);
        });

        // Track search IDs in background (non-blocking)
        if (result.transactions.length > 0) {
            const ids = result.transactions.map((tx) => tx.id);
            deps.searchIdTracker.trackHouseSearchIds(ids).catch((err) => {
                deps.logger.error('Failed to track house search IDs:', err);
            });
        }

        res.json(result);
    });
}

/**
 * GET /transactions/houses/stats
 * Get house transaction stats
 */
export function createStatsHandler(deps: HouseHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const cacheKey = 'house_stats';
        const stats = await deps.cache.get(cacheKey, async () => {
            return deps.houseTxRepo.getStats();
        });

        res.json(stats);
    });
}

/**
 * POST /transactions/houses/burn/:tokenId
 * Burn house listing (mark as deleted if token is burned on-chain)
 */
export function createBurnHandler(deps: HouseHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const tokenIdStr = req.params.tokenId;

        if (!tokenIdStr) {
            throw HttpErrors.badRequest('tokenId is required');
        }

        // Parse token ID
        let tokenId: bigint;
        try {
            tokenId = BigInt(tokenIdStr);
        } catch {
            throw HttpErrors.badRequest('invalid tokenId format');
        }

        // Check if blockchain API is available
        if (!deps.blockchainApi || !deps.contractAddress) {
            throw HttpErrors.internalError('Blockchain API not configured');
        }

        // Check token owner on-chain via BlockchainCenterApi
        let owner: string;
        try {
            owner = await deps.blockchainApi.callContract<string>(
                deps.contractAddress,
                OWNER_OF_ABI,
                'ownerOf',
                [tokenId.toString()]
            );
        } catch (err: unknown) {
            // If token doesn't exist, owner is effectively zero address
            const errorMsg = err instanceof Error ? err.message : String(err);
            if (
                errorMsg.includes('ERC721: owner query for nonexistent token') ||
                errorMsg.includes('ERC721: invalid token ID')
            ) {
                owner = ZERO_ADDRESS;
            } else {
                deps.logger.error('Error checking token owner:', err);
                throw HttpErrors.internalError();
            }
        }

        // If token has an owner, cannot burn listing
        if (owner !== ZERO_ADDRESS) {
            throw HttpErrors.tokenOwnerExists(tokenIdStr, owner);
        }

        // Delete all create orders for this token
        await deps.houseTxRepo.deleteAllCreateOrders(Number(tokenId));

        res.status(200).send();
    });
}

/**
 * POST /transactions/houses/sync/:tokenId
 * Backfill a missing listing row from the on-chain order (self-heals when the
 * indexer missed a CreateOrder event). Only writes when an order exists on-chain.
 */
export function createSyncHandler(deps: HouseHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const tokenIdStr = req.params.tokenId;

        if (!tokenIdStr) {
            throw HttpErrors.badRequest('tokenId is required');
        }

        let tokenId: bigint;
        try {
            tokenId = BigInt(tokenIdStr);
        } catch {
            throw HttpErrors.badRequest('invalid tokenId format');
        }

        if (!deps.blockchainApi || !deps.marketContractAddress) {
            throw HttpErrors.internalError('Blockchain API not configured');
        }

        const market = createBHouseMarketService(deps.marketContractAddress, deps.blockchainApi);

        // Read the on-chain order. getOrderV2 reverts ("order not existed") when
        // there is no active listing — a revert (or any read failure) means we must
        // NOT create a row, so the seller falls through to a normal createOrder.
        let order;
        try {
            order = await market.getOrderV2(tokenId);
        } catch {
            deps.logger.info('House sync: no on-chain order to backfill', {tokenId: tokenIdStr});
            res.json({synced: false, tokenId: Number(tokenId)});
            return;
        }

        if (!order.seller || order.seller === ZERO_ADDRESS || order.startedAt === '0') {
            res.json({synced: false, tokenId: Number(tokenId)});
            return;
        }

        const payToken = resolvePayTokenName(
            order.tokenAddress,
            deps.bcoinContractAddress,
            deps.senContractAddress
        );

        // The shared upsert prunes any listing row below the max block_number for
        // this token, and that max counts even soft-deleted historical rows. A
        // relisted token usually has old (deleted) listing rows with real block
        // numbers, so a synthetic 0 would be pruned the instant it is inserted.
        // The current chain head is >= every real listing block, keeping this row.
        const blockNumber = await deps.blockchainApi.getBlockNumber();

        const txReq: HouseTxReq = {
            txHash: `sync:house:${tokenId.toString()}`,
            blockNumber,
            blockTimestamp: new Date(Number(order.startedAt) * 1000),
            status: TX_STATUS.LISTING,
            sellerWalletAddress: order.seller,
            buyerWalletAddress: '',
            houseDetails: order.tokenDetail,
            amount: order.price,
            tokenId: Number(tokenId),
            payToken,
        };

        await deps.houseTxRepo.upsert(txReq);
        deps.cache.clear();

        deps.logger.info('House sync: backfilled listing', {
            tokenId: tokenIdStr,
            seller: order.seller,
        });

        res.json({synced: true, tokenId: Number(tokenId)});
    });
}

// Create all house handlers
export function createHouseHandlers(deps: HouseHandlerDeps) {
    return {
        search: createSearchHandler(deps),
        stats: createStatsHandler(deps),
        burn: createBurnHandler(deps),
        sync: createSyncHandler(deps),
    };
}
