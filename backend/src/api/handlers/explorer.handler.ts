import {Request, Response} from 'express';
import {IRankingRepository} from '@/repositories/ranking.repository';
import {NETWORK_BY_ALIAS} from '@/domain/models/ranking';
import {generateCacheKeyFromData, ICache} from '@/infrastructure/cache/memory-cache';
import {Logger} from '@/utils/logger';
import {asyncHandler, HttpErrors} from '../middleware/error-handler';

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;
/** Deep pages only cost OFFSET scans; nothing meaningful lives past this. */
const MAX_PAGE = 1000;

export interface ExplorerHandlerDeps {
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

/**
 * user_name is a wallet address for FI accounts, but plain logins also
 * exist - accept any short printable id and just normalize it.
 */
function parseWalletParam(raw: string | undefined): string {
    const wallet = (raw ?? '').trim();
    // Wallet address or plain login; anything else is refused up front so it
    // never reaches the database or the cache
    if (!/^(0x[0-9a-fA-F]{40}|[\w.@-]{1,64})$/.test(wallet)) {
        throw HttpErrors.badRequest('invalid wallet');
    }
    return wallet;
}

/**
 * ?network=bsc|polygon. The game database holds every network, so the API
 * answers for the one the user selected; undefined falls back to the
 * instance's own network in the repository.
 */
function parseNetwork(value: unknown): string | undefined {
    return NETWORK_BY_ALIAS[String(value ?? '').toLowerCase()];
}

/** ?all=1 answers for every network, like the consolidated rankings. */
function parseConsolidated(value: unknown): boolean {
    return value === '1' || value === 'true';
}

/** Digits only: "12abc" or 1e23 would reach Postgres and blow up as a 500. */
function parseIdParam(raw: string | undefined, label: string): number {
    if (!raw || !/^\d{1,15}$/.test(raw)) {
        throw HttpErrors.badRequest(`invalid ${label} id`);
    }
    return parseInt(raw, 10);
}

/**
 * GET /explorer/wallet/:address
 * Wallet profile: counters, stake totals + ranking positions and houses.
 */
export function createWalletHandler(deps: ExplorerHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const wallet = parseWalletParam(req.params.address);
        const network = parseNetwork(req.query.network);
        const consolidated = parseConsolidated(req.query.all);

        const cacheKey = generateCacheKeyFromData('explorer_wallet', {
            wallet: wallet.toLowerCase(),
            network: consolidated ? 'all' : network,
        });
        const profile = await deps.cache.get(cacheKey, async () => {
            return deps.rankingRepo.getWalletProfile(wallet, network, consolidated);
        });

        if (!profile) {
            throw HttpErrors.notFound('wallet not found');
        }
        res.json(profile);
    });
}

/**
 * GET /explorer/wallet/:address/heroes?staked=1&page=&size=
 * Paginated heroes of a wallet, biggest stake first.
 */
export function createWalletHeroesHandler(deps: ExplorerHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const wallet = parseWalletParam(req.params.address);
        const filter = {
            stakedOnly: req.query.staked === '1' || req.query.staked === 'true',
            network: parseNetwork(req.query.network),
            page: parsePage(req.query.page),
            size: parseSize(req.query.size),
        };

        const cacheKey = generateCacheKeyFromData('explorer_wallet_heroes', {
            wallet: wallet.toLowerCase(),
            ...filter,
        });
        const result = await deps.cache.get(cacheKey, async () => {
            return deps.rankingRepo.getWalletHeroes(wallet, filter);
        });

        if (!result) {
            throw HttpErrors.notFound('wallet not found');
        }
        res.json({
            page: filter.page,
            size: filter.size,
            total_count: result.total_count,
            total_pages: Math.max(1, Math.ceil(result.total_count / filter.size)),
            items: result.items,
        });
    });
}

/**
 * GET /explorer/hero/:id
 * Hero detail with owner wallet and stake ranking positions.
 */
export function createHeroHandler(deps: ExplorerHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const heroId = parseIdParam(req.params.id, 'hero');
        const network = parseNetwork(req.query.network);

        const cacheKey = generateCacheKeyFromData('explorer_hero', {heroId, network});
        const hero = await deps.cache.get(cacheKey, async () => {
            return deps.rankingRepo.getHeroById(heroId, network);
        });

        if (!hero) {
            throw HttpErrors.notFound('hero not found');
        }
        res.json(hero);
    });
}

/**
 * GET /explorer/house/:id
 * House detail with owner wallet.
 */
export function createHouseHandler(deps: ExplorerHandlerDeps) {
    return asyncHandler(async (req: Request, res: Response) => {
        const houseId = parseIdParam(req.params.id, 'house');
        const network = parseNetwork(req.query.network);

        const cacheKey = generateCacheKeyFromData('explorer_house', {houseId, network});
        const house = await deps.cache.get(cacheKey, async () => {
            return deps.rankingRepo.getHouseById(houseId, network);
        });

        if (!house) {
            throw HttpErrors.notFound('house not found');
        }
        res.json(house);
    });
}

export function createExplorerHandlers(deps: ExplorerHandlerDeps) {
    return {
        wallet: createWalletHandler(deps),
        walletHeroes: createWalletHeroesHandler(deps),
        hero: createHeroHandler(deps),
        house: createHouseHandler(deps),
    };
}
