import {Router} from 'express';
import {createHouseHandlers, HouseHandlerDeps} from '../handlers/house.handler';

/**
 * Create house transaction routes
 * - GET /search - Search house transactions
 * - GET /stats - Get house transaction stats
 * - POST /burn/:tokenId - Burn house listing
 */
export function createHouseRoutes(deps: HouseHandlerDeps): Router {
    const router = Router();
    const handlers = createHouseHandlers(deps);

    router.get('/search', handlers.search);
    router.get('/stats', handlers.stats);
    router.post('/burn/:tokenId', handlers.burn);

    return router;
}
