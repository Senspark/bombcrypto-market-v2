import {Router} from 'express';
import {AdminHandlerDeps, createAdminHandlers} from '../handlers/admin.handler';
import {createAdminAuth} from '../middleware/auth';

/**
 * Create admin routes with authentication
 * - GET /control/cache/clear - Clear cache
 * - GET /control/processing-numbers - Get processing block numbers
 */
export function createAdminRoutes(deps: AdminHandlerDeps, apiKey: string): Router {
    const router = Router();
    const handlers = createAdminHandlers(deps);

    // Apply admin auth middleware to all routes
    router.use(createAdminAuth(apiKey));

    router.get('/control/cache/clear', handlers.clearCache);
    router.get('/control/processing-numbers', handlers.getProcessingBlockNumbers);

    return router;
}
