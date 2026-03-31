import {Request, Response} from 'express';
import {IWalletHistoryRepository} from '@/domain/interfaces/repository';
import {createEmptyWalletTxFilterContext, UserDetailsReq, UserRepr} from '@/domain/models/user';
import {parseHeroDetails, parseHouseDetails} from '@/utils/details-parser';
import {generateCacheKeyFromData, ICache} from '@/infrastructure/cache/memory-cache';
import {IRedisClient} from '@/infrastructure/redis/client';
import {shieldDataKey, shieldFetchKey} from '@/infrastructure/redis/redis-keys';
import {parseCompactShieldData} from '@/domain/models/hero';
import {Logger} from '@/utils/logger';
import {asyncHandler, HttpErrors} from '../middleware/error-handler';

// User handler dependencies
export interface UserHandlerDeps {
    walletHistoryRepo: IWalletHistoryRepository;
    cache: ICache;
    redis: IRedisClient | null;
    network: string;
    logger: Logger;
}

/**
 * POST /users/decode
 * Decode wallet details (heroes and houses from tokenDetail strings)
 */
export function createDecodeHandler(deps: UserHandlerDeps) {
    const shieldHashKey = shieldDataKey(deps.network);
    const shieldFetchSetKey = shieldFetchKey(deps.network);

    return asyncHandler(async (req: Request, res: Response) => {
        const body = req.body as UserDetailsReq;

        // NOTE: wallet_address (snake_case) is deprecated.
        // Please use walletAddress (camelCase) in future requests.
        const walletAddress = body.walletAddress || body.wallet_address;
        if (!walletAddress) {
            throw HttpErrors.badRequest('wallet_address is required');
        }

        // Decode heroes
        const heroes = (body.heroes || []).map((heroDetail) => {
            try {
                return parseHeroDetails(heroDetail);
            } catch (err) {
                deps.logger.error('Failed to parse hero details:', err);
                return null;
            }
        }).filter((h): h is NonNullable<typeof h> => h !== null);

        // Enrich heroes with shield data from Redis
        if (deps.redis && heroes.length > 0) {
            try {
                const tokenIds = heroes.map((h) => h.id.toString());
                const shieldValues = await deps.redis.hmget(shieldHashKey, ...tokenIds);

                for (let i = 0; i < heroes.length; i++) {
                    const compact = shieldValues[i];
                    heroes[i].shieldData = compact ? parseCompactShieldData(compact) : null;
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

        // Decode houses
        const houses = (body.houses || []).map((houseDetail) => {
            try {
                return parseHouseDetails(houseDetail);
            } catch (err) {
                deps.logger.error('Failed to parse house details:', err);
                return null;
            }
        }).filter((h): h is NonNullable<typeof h> => h !== null);

        const response: UserRepr = {
            walletAddress,
            heroes,
            houses,
        };

        res.json(response);
    });
}

/**
 * GET /users/:walletAddress/history
 * Get wallet transaction history
 */
export function createGetHistoryHandler(deps: UserHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const walletAddress = req.params.walletAddress;

        if (!walletAddress) {
            throw HttpErrors.badRequest('wallet address is required');
        }

        // Parse query parameters
        const filterContext = createEmptyWalletTxFilterContext();
        filterContext.walletAddress = walletAddress;

        const page = req.query.page;
        if (page && typeof page === 'string') {
            const parsed = parseInt(page, 10);
            if (!isNaN(parsed) && parsed > 0) {
                filterContext.page = parsed;
            }
        }

        const size = req.query.size;
        if (size && typeof size === 'string') {
            const parsed = parseInt(size, 10);
            if (!isNaN(parsed) && parsed > 0) {
                filterContext.size = parsed;
            }
        }

        // Generate cache key and use cache
        const cacheKey = generateCacheKeyFromData('wallet_history', filterContext);
        const result = await deps.cache.get(cacheKey, async () => {
            return deps.walletHistoryRepo.getHistory(filterContext);
        });

        res.json(result);
    });
}

// Create all user handlers
export function createUserHandlers(deps: UserHandlerDeps) {
    return {
        decode: createDecodeHandler(deps),
        getHistory: createGetHistoryHandler(deps),
    };
}
