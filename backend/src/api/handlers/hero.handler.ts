import {Request, Response} from 'express';
import {IHeroTransactionRepository} from '@/domain/interfaces/repository';
import {createEmptyHeroTxFilterContext, HeroTxFilterContext} from '@/domain/models/hero';
import {generateCacheKeyFromData, ICache} from '@/infrastructure/cache/memory-cache';
import {SearchIdTracker} from '@/infrastructure/redis/client';
import {BlockChainCenterApi} from '@/infrastructure/blockchain/blockchain-center-api';
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
    cache: ICache;
    searchIdTracker: SearchIdTracker;
    blockchainApi: BlockChainCenterApi | null;
    contractAddress: string;
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
    return asyncHandler(async (req: Request, res: Response) => {
        const filterContext = parseHeroFilterContext(req.query);

        // Generate cache key and use cache
        const cacheKey = generateCacheKeyFromData('hero_search', filterContext);
        const result = await deps.cache.get(cacheKey, async () => {
            return deps.heroTxRepo.filter(filterContext);
        });

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

// Create all hero handlers
export function createHeroHandlers(deps: HeroHandlerDeps) {
    return {
        search: createSearchHandler(deps),
        stats: createStatsHandler(deps),
        burn: createBurnHandler(deps),
        version: createVersionHandler(),
    };
}
