import {Router} from 'express';
import {createExplorerHandlers, ExplorerHandlerDeps} from '../handlers/explorer.handler';

/**
 * Create explorer routes (wallet / hero / house lookup)
 * - GET /wallet/:address - Wallet profile (counters, stake, ranks, houses)
 * - GET /wallet/:address/heroes - Paginated heroes of a wallet
 * - GET /hero/:id - Hero detail with owner and ranking positions
 * - GET /house/:id - House detail with owner
 */
export function createExplorerRoutes(deps: ExplorerHandlerDeps): Router {
    const router = Router();
    const handlers = createExplorerHandlers(deps);

    router.get('/wallet/:address', handlers.wallet);
    router.get('/wallet/:address/heroes', handlers.walletHeroes);
    router.get('/hero/:id', handlers.hero);
    router.get('/house/:id', handlers.house);

    return router;
}
