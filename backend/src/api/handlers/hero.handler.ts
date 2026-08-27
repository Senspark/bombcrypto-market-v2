import {Request, Response} from 'express';
import {IHeroTransactionRepository} from '@/domain/interfaces/repository';
import {createEmptyHeroTxFilterContext, HeroTxFilterContext, HeroTxReq, parseCompactShieldData, TX_STATUS} from '@/domain/models/hero';
import {resolveSuspiciousFlag} from '@/domain/models/suspicious';
import {ISuspiciousRegistry} from '@/usecases/suspicious-registry';
import {generateCacheKeyFromData, ICache} from '@/infrastructure/cache/memory-cache';
import {IRedisClient, SearchIdTracker} from '@/infrastructure/redis/client';
import {shieldDataKey, shieldFetchKey} from '@/infrastructure/redis/redis-keys';
import {BlockChainCenterApi, isRevertError} from '@/infrastructure/blockchain/blockchain-center-api';
import {createBHeroMarketService} from '@/infrastructure/blockchain/contracts/bhero-market';
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

// Hero handler dependencies
export interface HeroHandlerDeps {
    heroTxRepo: IHeroTransactionRepository;
    suspiciousRegistry: ISuspiciousRegistry;
    cache: ICache;
    searchIdTracker: SearchIdTracker;
    blockchainApi: BlockChainCenterApi | null;
    contractAddress: string;
    marketContractAddress: string;
    bcoinContractAddress: string;
    senContractAddress: string;
    redis: IRedisClient | null;
    network: string;
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
function parseHeroFilterContext(query: Request['query']): HeroTxFilterContext {
    const ctx = createEmptyHeroTxFilterContext();

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
    ctx.abilities = parseNumberArrayParam(query.ability);
    ctx.abilitiesHeroS = parseNumberArrayParam(query.s_ability);

    // RHS format filters (e.g., level=gte:20)
    ctx.level = parseArrayParam(query.level);
    ctx.amount = parseArrayParam(query.amount);

    // Numeric filters
    ctx.stamina = parseNumberParam(query.stamina, 0);
    ctx.speed = parseNumberParam(query.speed, 0);
    ctx.bombPower = parseNumberParam(query.bomb_power, 0);
    ctx.bombCount = parseNumberParam(query.bomb_count, 0);
    ctx.bombRange = parseNumberParam(query.bomb_range, 0);

    return ctx;
}

/**
 * GET /transactions/heroes/search
 * Search hero transactions
 */
export function createSearchHandler(deps: HeroHandlerDeps) {
    const shieldHashKey = shieldDataKey(deps.network);
    const shieldFetchSetKey = shieldFetchKey(deps.network);

    return asyncHandler(async (req: Request, res: Response) => {
        const filterContext = parseHeroFilterContext(req.query);

        // Generate cache key and use cache
        const cacheKey = generateCacheKeyFromData('hero_search', filterContext);
        const result = await deps.cache.get(cacheKey, async () => {
            return deps.heroTxRepo.filter(filterContext);
        });

        // Flagged after the cache so a freshly marked hero shows up right away
        if (result.transactions.length > 0) {
            try {
                const registry = await deps.suspiciousRegistry.get();
                for (const tx of result.transactions) {
                    tx.suspicious = resolveSuspiciousFlag(registry, tx.tokenId, tx.sellerWalletAddress);
                }
            } catch (err) {
                deps.logger.warn('Failed to enrich suspicious flags:', err);
            }
        }

        // Enrich with shield data from Redis (after cache, so every response gets fresh data)
        if (deps.redis && result.transactions.length > 0) {
            try {
                const tokenIds = result.transactions.map((tx) => tx.tokenId.toString());
                const shieldValues = await deps.redis.hmget(shieldHashKey, ...tokenIds);

                for (let i = 0; i < result.transactions.length; i++) {
                    const compact = shieldValues[i];
                    result.transactions[i].shieldData = compact ? parseCompactShieldData(compact) : null;
                }

                const uncachedTokenIds = tokenIds.filter((_, i) => shieldValues[i] === null);
                if (uncachedTokenIds.length > 0) {
                    deps.redis.addToSet(shieldFetchSetKey, ...uncachedTokenIds).catch((err) => {
                        deps.logger.warn('Failed to queue shield fetch:', err);
                    });
                }
            } catch (err) {
                deps.logger.warn('Failed to enrich shield data:', err);
            }
        }

        // Track search IDs in background (non-blocking)
        if (result.transactions.length > 0) {
            const ids = result.transactions.map((tx) => tx.id);
            deps.searchIdTracker.trackHeroSearchIds(ids).catch((err) => {
                deps.logger.error('Failed to track hero search IDs:', err);
            });
        }

        res.json(result);
    });
}

/**
 * GET /transactions/heroes/stats
 * Get hero transaction stats
 */
export function createStatsHandler(deps: HeroHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const cacheKey = 'hero_stats';
        const stats = await deps.cache.get(cacheKey, async () => {
            return deps.heroTxRepo.getStats();
        });

        res.json(stats);
    });
}

/**
 * POST /transactions/heroes/burn/:tokenId
 * Burn hero listing (mark as deleted if token is burned on-chain)
 */
export function createBurnHandler(deps: HeroHandlerDeps) {
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
            // ownerOf reverts only for a nonexistent token, so a revert means burned.
            // Transport failures carry no revert reason and still raise.
            const errorMsg = err instanceof Error ? err.message : String(err);
            if (isRevertError(errorMsg)) {
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
        await deps.heroTxRepo.deleteAllCreateOrders(Number(tokenId));

        res.status(200).send();
    });
}

/**
 * GET /transactions/heroes/version
 * Get hero API version
 */
export function createVersionHandler() {
    return (_req: Request, res: Response) => {
        res.send('v1.0.0');
    };
}

/**
 * POST /transactions/heroes/sync/:tokenId
 * Backfill a missing listing row from the on-chain order (self-heals when the
 * indexer missed a CreateOrder event). Only writes when an order exists on-chain.
 */
export function createSyncHandler(deps: HeroHandlerDeps) {
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

        const market = createBHeroMarketService(deps.marketContractAddress, deps.blockchainApi);

        // Read the on-chain order. getOrderV2 reverts ("order not existed") when
        // there is no active listing — a revert (or any read failure) means we must
        // NOT create a row, so the seller falls through to a normal createOrder.
        let order;
        try {
            order = await market.getOrderV2(tokenId);
        } catch {
            deps.logger.info('Hero sync: no on-chain order to backfill', {tokenId: tokenIdStr});
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

        const txReq: HeroTxReq = {
            txHash: `sync:hero:${tokenId.toString()}`,
            blockNumber,
            blockTimestamp: new Date(Number(order.startedAt) * 1000),
            status: TX_STATUS.LISTING,
            sellerWalletAddress: order.seller,
            buyerWalletAddress: '',
            heroDetails: order.tokenDetail,
            amount: order.price,
            tokenId: Number(tokenId),
            payToken,
        };

        await deps.heroTxRepo.upsert(txReq);
        deps.cache.clear();

        deps.logger.info('Hero sync: backfilled listing', {
            tokenId: tokenIdStr,
            seller: order.seller,
        });

        res.json({synced: true, tokenId: Number(tokenId)});
    });
}

// Create all hero handlers
export function createHeroHandlers(deps: HeroHandlerDeps) {
    return {
        search: createSearchHandler(deps),
        stats: createStatsHandler(deps),
        burn: createBurnHandler(deps),
        version: createVersionHandler(),
        sync: createSyncHandler(deps),
    };
}
