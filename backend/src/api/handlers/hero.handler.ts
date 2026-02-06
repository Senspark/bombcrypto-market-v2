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

/**
 * Hero handler dependencies
 * @interface HeroHandlerDeps
 */
export interface HeroHandlerDeps {
    heroTxRepo: IHeroTransactionRepository;
    cache: ICache;
    searchIdTracker: SearchIdTracker;
    blockchainApi: BlockChainCenterApi | null;
    contractAddress: string;
    logger: Logger;
}

/**
 * Parses a value into a string array.
 * @param {unknown} value - The value to parse (string or array of strings).
 * @returns {string[]} An array of strings.
 */
function parseArrayParam(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') return [value];
    return [];
}

/**
 * Parses a value into a number array.
 * @param {unknown} value - The value to parse.
 * @returns {number[]} An array of valid numbers.
 */
function parseNumberArrayParam(value: unknown): number[] {
    const strings = parseArrayParam(value);
    return strings
        .map((s) => parseInt(s, 10))
        .filter((n) => !isNaN(n));
}

/**
 * Parses a single number parameter with a default fallback.
 * @param {unknown} value - The value to parse.
 * @param {number} defaultVal - The fallback value.
 * @returns {number} The parsed number or default.
 */
function parseNumberParam(value: unknown, defaultVal: number = 0): number {
    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultVal : parsed;
    }
    return defaultVal;
}

/**
 * Parses the request query into a structured HeroTxFilterContext.
 * @param {Request['query']} query - The express request query object.
 * @returns {HeroTxFilterContext} The constructed filter context.
 *
 * Complexity Note: Maps various loose query parameters to a strict typed object.
 * Handles pagination, sorting, and specific hero attribute filtering.
 */
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
    ctx.rarity = parseNumberArrayParam(query.rarity);
    ctx.abilities = parseNumberArrayParam(query.ability);

    // String array filters
    ctx.tokenId = parseArrayParam(query.token_id);
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
 * Creates the search handler for Hero Transactions.
 * Endpoint: GET /transactions/heroes/search
 *
 * Logic:
 * 1. Parse query params into filter context.
 * 2. Check cache for existing results.
 * 3. If cache miss, query repository.
 * 4. Background: Track search IDs for analytics.
 *
 * @param {HeroHandlerDeps} deps - Dependencies.
 * @returns {Function} Express handler.
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
 * Creates the stats handler for Hero Transactions.
 * Endpoint: GET /transactions/heroes/stats
 *
 * Logic:
 * 1. Check cache for 'hero_stats'.
 * 2. If cache miss, calculate stats via repository.
 *
 * @param {HeroHandlerDeps} deps - Dependencies.
 * @returns {Function} Express handler.
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
 * Creates the burn handler for Hero Listings.
 * Endpoint: POST /transactions/heroes/burn/:tokenId
 *
 * Logic:
 * 1. Validate tokenId.
 * 2. Verify blockchain API is configured.
 * 3. Query contract for current owner of token.
 * 4. IF owner is ZERO_ADDRESS (burned), delete listing from DB.
 * 5. ELSE throw error (cannot burn listing if token exists).
 *
 * @param {HeroHandlerDeps} deps - Dependencies.
 * @returns {Function} Express handler.
 * @throws {HttpErrors.badRequest} If tokenId is missing or invalid.
 * @throws {HttpErrors.internalError} If blockchain API is missing.
 * @throws {HttpErrors.tokenOwnerExists} If token is not burned.
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
        await deps.heroTxRepo.deleteAllCreateOrders(tokenId.toString());

        res.status(200).send();
    });
}

/**
 * Creates the version handler.
 * Endpoint: GET /transactions/heroes/version
 * @returns {Function} Express handler returning version string.
 */
export function createVersionHandler() {
    return (_req: Request, res: Response) => {
        res.send('v1.0.0');
    };
}

/**
 * Aggregates all hero handlers into a single object.
 * @param {HeroHandlerDeps} deps - Dependencies.
 * @returns {Object} Object containing all hero handlers.
 */
export function createHeroHandlers(deps: HeroHandlerDeps) {
    return {
        search: createSearchHandler(deps),
        stats: createStatsHandler(deps),
        burn: createBurnHandler(deps),
        version: createVersionHandler(),
    };
}
