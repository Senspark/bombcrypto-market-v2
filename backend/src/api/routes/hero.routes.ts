import {Router} from 'express';
import {createHeroHandlers, HeroHandlerDeps} from '../handlers/hero.handler';

/**
 * Create hero transaction routes
 * - GET /search - Search hero transactions
 * - GET /stats - Get hero transaction stats
 * - POST /burn/:tokenId - Burn hero listing
 * - GET /version - Get API version
 * - POST /sync/:tokenId - Backfill a missing listing row from the on-chain order
 */
export function createHeroRoutes(deps: HeroHandlerDeps): Router {
    const router = Router();
    const handlers = createHeroHandlers(deps);

    router.get('/search', handlers.search);
    router.get('/stats', handlers.stats);
    router.post('/burn/:tokenId', handlers.burn);
    router.get('/version', handlers.version);
    router.post('/sync/:tokenId', handlers.sync);

    return router;
}
