import {Router} from 'express';
import {AdminHandlerDeps, createAdminHandlers} from '../handlers/admin.handler';
import {createAdminAuth} from '../middleware/auth';

/**
 * Create admin routes with authentication
 * - GET /control/cache/clear - Clear cache
 * - GET /control/processing-numbers - Get processing block numbers
 * - GET|POST|DELETE /control/suspicious/heroes - Manage the suspicious hero list
 * - GET|POST|DELETE /control/suspicious/wallets - Manage the suspicious wallet list
 */
export function createAdminRoutes(deps: AdminHandlerDeps, apiKey: string): Router {
    const router = Router();
    const handlers = createAdminHandlers(deps);

    // Apply admin auth middleware to all routes
    router.use(createAdminAuth(apiKey));

    router.get('/control/cache/clear', handlers.clearCache);
    router.get('/control/processing-numbers', handlers.getProcessingBlockNumbers);

    router.get('/control/suspicious/heroes', handlers.listSuspiciousHeroes);
    router.post('/control/suspicious/heroes', handlers.markSuspiciousHeroes);
    router.delete('/control/suspicious/heroes', handlers.unmarkSuspiciousHeroes);

    router.get('/control/suspicious/wallets', handlers.listSuspiciousWallets);
    router.post('/control/suspicious/wallets', handlers.markSuspiciousWallets);
    router.delete('/control/suspicious/wallets', handlers.unmarkSuspiciousWallets);

    return router;
}
