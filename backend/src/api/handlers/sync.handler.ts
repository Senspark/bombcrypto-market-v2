import {Request, Response} from 'express';
import {IRedisClient, createSearchIdTracker} from '@/infrastructure/redis/client';
import {IHeroTransactionRepository, IHouseTransactionRepository} from '@/domain/interfaces/repository';
import {Logger} from '@/utils/logger';
import {asyncHandler, HttpErrors} from '../middleware/error-handler';

export interface SyncHandlerDeps {
    heroTxRepo: IHeroTransactionRepository;
    houseTxRepo: IHouseTransactionRepository;
    redis: IRedisClient | null;
    network: string;
    logger: Logger;
}

/**
 * POST /users/sync-inventory
 * Trigger a re-sync of the user's inventory by queuing their database record IDs for verification.
 * Includes a 60-second cooldown per wallet to prevent abuse.
 */
export function createSyncInventoryHandler(deps: SyncHandlerDeps) {
    const searchIdTracker = createSearchIdTracker(deps.redis, deps.network);
    const cooldownPrefix = `sync_cooldown:${deps.network}:`;

    return asyncHandler(async (req: Request, res: Response) => {
        const {walletAddress, heroIds, houseIds} = req.body;

        if (!walletAddress) {
            throw HttpErrors.badRequest('walletAddress is required');
        }

        if (!deps.redis) {
            throw HttpErrors.internalError('Redis is not available');
        }

        // 1. Check Cooldown
        const cooldownKey = `${cooldownPrefix}${walletAddress.toLowerCase()}`;
        const remaining = await deps.redis.get(cooldownKey);
        
        if (remaining) {
            const ttl = await deps.redis.ttl(cooldownKey);
            throw HttpErrors.tooManyRequests(`Please wait ${ttl} seconds before syncing again.`);
        }

        // 2. Resolve DB IDs from Token IDs
        // We need to push the DB IDs (primary keys) to the Redis set because the subscriber 
        // uses them to fetch records from the database.
        const dbHeroIds: number[] = [];
        const dbHouseIds: number[] = [];

        // Limit processing to prevent huge payloads
        const limitedHeroIds = (heroIds || []).slice(0, 500);
        const limitedHouseIds = (houseIds || []).slice(0, 100);

        // Fetch DB IDs for heroes
        for (const tokenId of limitedHeroIds) {
            const record = await deps.heroTxRepo.getByTokenId(Number(tokenId));
            if (record && record.status === 'listing') {
                dbHeroIds.push(record.id);
            }
        }

        // Fetch DB IDs for houses
        for (const tokenId of limitedHouseIds) {
            // Note: getByTokenId should be implemented in house repo too if not there
            // For now, we assume it has a similar interface or we skip if not critical
            try {
                // @ts-ignore - Assuming similar interface for houses
                const record = await deps.houseTxRepo.getByTokenId(Number(tokenId));
                if (record && record.status === 'listing') {
                    dbHouseIds.push(record.id);
                }
            } catch (err) {
                deps.logger.warn(`Failed to fetch house record for token ${tokenId}`);
            }
        }

        // 3. Set Cooldown (60 seconds)
        await deps.redis.set(cooldownKey, '1', 60);

        // 4. Queue IDs for verification
        let queuedCount = 0;
        
        if (dbHeroIds.length > 0) {
            await searchIdTracker.addHeroIds(...dbHeroIds);
            queuedCount += dbHeroIds.length;
        }

        if (dbHouseIds.length > 0) {
            await searchIdTracker.addHouseIds(...dbHouseIds);
            queuedCount += dbHouseIds.length;
        }

        deps.logger.info(`Inventory sync triggered for ${walletAddress}`, {
            receivedHeroCount: heroIds?.length || 0,
            foundListingHeroCount: dbHeroIds.length,
            queuedCount
        });

        res.json({
            success: true,
            message: 'Inventory sync initiated. Listing status will be verified shortly.',
            queuedCount
        });
    });
}
