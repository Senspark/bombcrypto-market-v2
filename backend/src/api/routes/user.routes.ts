import {Router} from 'express';
import {createUserHandlers, UserHandlerDeps} from '../handlers/user.handler';

/**
 * Create user routes
 * - POST /decode - Decode wallet details
 * - GET /:walletAddress/history - Get wallet transaction history
 */
export function createUserRoutes(deps: UserHandlerDeps): Router {
    const router = Router();
    const handlers = createUserHandlers(deps);

    router.post('/decode', handlers.decode);
    router.get('/:walletAddress/history', handlers.getHistory);

    return router;
}
