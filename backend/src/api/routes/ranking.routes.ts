import {Router} from 'express';
import {createRankingHandlers, RankingHandlerDeps} from '../handlers/ranking.handler';

/**
 * Create stake ranking routes
 * - GET /stake/heroes - Heroes with the biggest stake (per rarity/token)
 * - GET /stake/wallets - Top staking wallets
 */
export function createRankingRoutes(deps: RankingHandlerDeps): Router {
    const router = Router();
    const handlers = createRankingHandlers(deps);

    router.get('/stake/heroes', handlers.stakeHeroes);
    router.get('/stake/wallets', handlers.stakeWallets);

    return router;
}
