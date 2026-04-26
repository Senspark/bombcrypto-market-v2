import {Router} from 'express';
import {createUserHandlers, UserHandlerDeps} from '../handlers/user.handler';
import {createSyncInventoryHandler} from '../handlers/sync.handler';

/**
 * Create user routes
 * - POST /decode - Decode wallet details
 * - GET /:walletAddress/history - Get wallet transaction history
 * - POST /sync-inventory - Sync wallet inventory
 */
export function createUserRoutes(deps: UserHandlerDeps): Router {
    const router = Router();
    const handlers = createUserHandlers(deps);
    const syncHandler = createSyncInventoryHandler(deps);

    router.post('/decode', handlers.decode);
    router.get('/:walletAddress/history', handlers.getHistory);
    router.post('/sync-inventory', syncHandler);

    return router;
}
