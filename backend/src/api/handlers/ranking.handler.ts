import {Request, Response} from 'express';
import {IRankingRepository} from '@/repositories/ranking.repository';
import {NETWORK_BY_ALIAS, parseStakeToken} from '@/domain/models/ranking';
import {generateCacheKeyFromData, ICache} from '@/infrastructure/cache/memory-cache';
import {Logger} from '@/utils/logger';
import {asyncHandler} from '../middleware/error-handler';

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;
/** Deep pages only cost OFFSET scans; nothing meaningful lives past this. */
const MAX_PAGE = 1000;

export interface RankingHandlerDeps {
    rankingRepo: IRankingRepository;
    cache: ICache;
    logger: Logger;
}

function parsePage(value: unknown): number {
    const page = parseInt(String(value ?? ''), 10);
    if (isNaN(page) || page < 1) return 1;
    return Math.min(page, MAX_PAGE);
}

function parseSize(value: unknown): number {
    const size = parseInt(String(value ?? ''), 10);
    if (isNaN(size) || size < 1) return DEFAULT_PAGE_SIZE;
    return Math.min(size, MAX_PAGE_SIZE);
}

function parseRarity(value: unknown): number | null {
    if (value === undefined || value === '') return null;
    const rarity = parseInt(String(value), 10);
    return isNaN(rarity) || rarity < 0 || rarity > 9 ? null : rarity;
}

/**
 * ?network=bsc|polygon. The game database holds every network, so the API
 * answers for the one the user selected; undefined falls back to the
 * instance's own network in the repository.
 */
function parseNetwork(value: unknown): string | undefined {
    return NETWORK_BY_ALIAS[String(value ?? '').toLowerCase()];
}

/** ?all=1 sums both networks (BSC + Polygon), like bombanalytics. */
function parseConsolidated(value: unknown): boolean {
    return value === '1' || value === 'true';
}

/**
 * GET /rankings/stake/heroes?token=bcoin|sen&rarity=0..9&page=&size=
 * Heroes with the biggest stake, ordered by the chosen token.
 */
export function createHeroStakeRankingHandler(deps: RankingHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const filter = {
            token: parseStakeToken(req.query.token),
            rarity: parseRarity(req.query.rarity),
            network: parseNetwork(req.query.network),
            consolidated: parseConsolidated(req.query.all),
            page: parsePage(req.query.page),
            size: parseSize(req.query.size),
        };

        // The network is irrelevant once consolidated: keep one entry per result
        const cacheKey = generateCacheKeyFromData('rankings_stake_heroes', {
            ...filter,
            network: filter.consolidated ? 'all' : filter.network,
        });
        const result = await deps.cache.get(cacheKey, async () => {
            return deps.rankingRepo.getHeroRanking(filter);
        });

        res.json({
            token: filter.token,
            rarity: filter.rarity,
            consolidated: filter.consolidated,
            page: filter.page,
            size: filter.size,
            total_count: result.total_count,
            total_pages: Math.max(1, Math.ceil(result.total_count / filter.size)),
            summary: result.summary,
            items: result.items,
        });
    });
}

/**
 * GET /rankings/stake/wallets?token=bcoin|sen&page=&size=
 * Top staking wallets, ordered by the chosen token.
 */
export function createWalletStakeRankingHandler(deps: RankingHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const filter = {
            token: parseStakeToken(req.query.token),
            network: parseNetwork(req.query.network),
            consolidated: parseConsolidated(req.query.all),
            page: parsePage(req.query.page),
            size: parseSize(req.query.size),
        };

        // The network is irrelevant once consolidated: keep one entry per result
        const cacheKey = generateCacheKeyFromData('rankings_stake_wallets', {
            ...filter,
            network: filter.consolidated ? 'all' : filter.network,
        });
        const result = await deps.cache.get(cacheKey, async () => {
            return deps.rankingRepo.getWalletRanking(filter);
        });

        res.json({
            token: filter.token,
            consolidated: filter.consolidated,
            page: filter.page,
            size: filter.size,
            total_count: result.total_count,
            total_pages: Math.max(1, Math.ceil(result.total_count / filter.size)),
            summary: result.summary,
            items: result.items,
        });
    });
}

export function createRankingHandlers(deps: RankingHandlerDeps) {
    return {
        stakeHeroes: createHeroStakeRankingHandler(deps),
        stakeWallets: createWalletStakeRankingHandler(deps),
    };
}
