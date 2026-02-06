import {Router} from 'express';
import {createHeroHandlers, HeroHandlerDeps} from '../handlers/hero.handler';

/**
 * Create hero transaction routes
 * - GET /search - Search hero transactions
 * - GET /stats - Get hero transaction stats
 * - POST /burn/:tokenId - Burn hero listing
 * - GET /version - Get API version
 */
export function createHeroRoutes(deps: HeroHandlerDeps): Router {
    const router = Router();
    const handlers = createHeroHandlers(deps);

    router.get('/search', handlers.search);
    router.get('/stats', handlers.stats);
    router.post('/burn/:tokenId', handlers.burn);
    router.get('/version', handlers.version);

    return router;
}
