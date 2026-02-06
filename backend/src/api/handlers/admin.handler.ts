import {Request, Response} from 'express';
import {IAdminRepository} from '@/domain/interfaces/repository';
import {ICache} from '@/infrastructure/cache/memory-cache';
import {Logger} from '@/utils/logger';
import {asyncHandler} from '../middleware/error-handler';

// Admin handler dependencies
export interface AdminHandlerDeps {
    adminRepo: IAdminRepository;
    cache: ICache;
    logger: Logger;
}

/**
 * GET /admin/control/cache/clear
 * Clear all cache entries
 */
export function createClearCacheHandler(deps: AdminHandlerDeps) {
    return asyncHandler(async (_req: Request, res: Response) => {
        deps.cache.clear();
        deps.logger.info('Cache cleared by admin request');

        res.json({message: 'somehow it works'});
    });
}

/**
 * GET /admin/control/processing-numbers
 * Get current processing block numbers for hero and house subscribers
 */
export function createGetProcessingBlockNumbersHandler(deps: AdminHandlerDeps) {
    return asyncHandler(async (_req: Request, res: Response) => {
        const blockNumbers = await deps.adminRepo.getProcessingBlockNumbers();

        res.json({
            hero_block_number: blockNumbers.heroBlockNumber,
            house_block_number: blockNumbers.houseBlockNumber,
        });
    });
}

// Create all admin handlers
export function createAdminHandlers(deps: AdminHandlerDeps) {
    return {
        clearCache: createClearCacheHandler(deps),
        getProcessingBlockNumbers: createGetProcessingBlockNumbersHandler(deps),
    };
}
