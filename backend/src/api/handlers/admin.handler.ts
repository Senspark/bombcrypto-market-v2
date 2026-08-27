import {Request, Response} from 'express';
import {IAdminRepository, ISuspiciousRepository} from '@/domain/interfaces/repository';
import {DEFAULT_SUSPICIOUS_REASON} from '@/domain/models/suspicious';
import {ICache} from '@/infrastructure/cache/memory-cache';
import {ISuspiciousRegistry} from '@/usecases/suspicious-registry';
import {Logger} from '@/utils/logger';
import {asyncHandler, HttpErrors} from '../middleware/error-handler';

// Admin handler dependencies
export interface AdminHandlerDeps {
    adminRepo: IAdminRepository;
    suspiciousRepo: ISuspiciousRepository;
    suspiciousRegistry: ISuspiciousRegistry;
    cache: ICache;
    logger: Logger;
}

// Parse a list of token ids from the request body
function parseTokenIds(body: unknown): number[] {
    const raw = (body as { tokenIds?: unknown })?.tokenIds;
    if (!Array.isArray(raw) || raw.length === 0) {
        throw HttpErrors.badRequest('tokenIds must be a non-empty array');
    }

    const tokenIds = raw
        .map((value) => (typeof value === 'string' ? parseInt(value, 10) : Number(value)))
        .filter((value) => Number.isInteger(value) && value >= 0);

    if (tokenIds.length === 0) {
        throw HttpErrors.badRequest('tokenIds contains no valid token id');
    }

    return Array.from(new Set(tokenIds));
}

// Parse a list of wallet addresses from the request body
function parseAddresses(body: unknown): string[] {
    const raw = (body as { addresses?: unknown })?.addresses;
    if (!Array.isArray(raw) || raw.length === 0) {
        throw HttpErrors.badRequest('addresses must be a non-empty array');
    }

    const addresses = raw
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim().toLowerCase())
        .filter((value) => /^0x[0-9a-f]{40}$/.test(value));

    if (addresses.length === 0) {
        throw HttpErrors.badRequest('addresses contains no valid wallet address');
    }

    return Array.from(new Set(addresses));
}

// Parse the optional reason / note attached to a mark request
function parseMarkDetails(body: unknown): { reason: string; note: string | null } {
    const reasonRaw = (body as { reason?: unknown })?.reason;
    const noteRaw = (body as { note?: unknown })?.note;

    const reason = typeof reasonRaw === 'string' && reasonRaw.trim()
        ? reasonRaw.trim().slice(0, 64)
        : DEFAULT_SUSPICIOUS_REASON;
    const note = typeof noteRaw === 'string' && noteRaw.trim() ? noteRaw.trim() : null;

    return {reason, note};
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

/**
 * GET /admin/control/suspicious/heroes
 * List every hero marked as suspicious
 */
export function createListSuspiciousHeroesHandler(deps: AdminHandlerDeps) {
    return asyncHandler(async (_req: Request, res: Response) => {
        const heroes = await deps.suspiciousRepo.listHeroes();
        res.json({total: heroes.length, heroes});
    });
}

/**
 * POST /admin/control/suspicious/heroes
 * Mark heroes as suspicious. Body: {tokenIds: number[], reason?, note?}
 */
export function createMarkSuspiciousHeroesHandler(deps: AdminHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const tokenIds = parseTokenIds(req.body);
        const {reason, note} = parseMarkDetails(req.body);

        const affected = await deps.suspiciousRepo.addHeroes(tokenIds, reason, note);
        deps.suspiciousRegistry.invalidate();

        res.json({marked: affected, tokenIds});
    });
}

/**
 * DELETE /admin/control/suspicious/heroes
 * Unmark heroes. Body: {tokenIds: number[]}
 */
export function createUnmarkSuspiciousHeroesHandler(deps: AdminHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const tokenIds = parseTokenIds(req.body);

        const affected = await deps.suspiciousRepo.removeHeroes(tokenIds);
        deps.suspiciousRegistry.invalidate();

        res.json({unmarked: affected, tokenIds});
    });
}

/**
 * GET /admin/control/suspicious/wallets
 * List every wallet marked as suspicious
 */
export function createListSuspiciousWalletsHandler(deps: AdminHandlerDeps) {
    return asyncHandler(async (_req: Request, res: Response) => {
        const wallets = await deps.suspiciousRepo.listWallets();
        res.json({total: wallets.length, wallets});
    });
}

/**
 * POST /admin/control/suspicious/wallets
 * Mark wallets as suspicious. Body: {addresses: string[], reason?, note?}
 */
export function createMarkSuspiciousWalletsHandler(deps: AdminHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const addresses = parseAddresses(req.body);
        const {reason, note} = parseMarkDetails(req.body);

        const affected = await deps.suspiciousRepo.addWallets(addresses, reason, note);
        deps.suspiciousRegistry.invalidate();

        res.json({marked: affected, addresses});
    });
}

/**
 * DELETE /admin/control/suspicious/wallets
 * Unmark wallets. Body: {addresses: string[]}
 */
export function createUnmarkSuspiciousWalletsHandler(deps: AdminHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const addresses = parseAddresses(req.body);

        const affected = await deps.suspiciousRepo.removeWallets(addresses);
        deps.suspiciousRegistry.invalidate();

        res.json({unmarked: affected, addresses});
    });
}

// Create all admin handlers
export function createAdminHandlers(deps: AdminHandlerDeps) {
    return {
        clearCache: createClearCacheHandler(deps),
        getProcessingBlockNumbers: createGetProcessingBlockNumbersHandler(deps),
        listSuspiciousHeroes: createListSuspiciousHeroesHandler(deps),
        markSuspiciousHeroes: createMarkSuspiciousHeroesHandler(deps),
        unmarkSuspiciousHeroes: createUnmarkSuspiciousHeroesHandler(deps),
        listSuspiciousWallets: createListSuspiciousWalletsHandler(deps),
        markSuspiciousWallets: createMarkSuspiciousWalletsHandler(deps),
        unmarkSuspiciousWallets: createUnmarkSuspiciousWalletsHandler(deps),
    };
}
