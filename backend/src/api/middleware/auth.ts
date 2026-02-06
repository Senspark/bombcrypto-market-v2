import {NextFunction, Request, Response} from 'express';

/**
 * Admin authentication middleware
 * Validates X-API-Key header against configured API key
 */
export function createAdminAuth(apiKey: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const providedKey = req.header('X-API-Key');

        if (!providedKey || providedKey !== apiKey) {
            res.status(403).json({message: 'go away!!!'});
            return;
        }

        // Add admin identity to request for downstream handlers
        (req as Request & { isAdmin: boolean }).isAdmin = true;
        next();
    };
}

// Type augmentation for Express Request
declare global {
    namespace Express {
        interface Request {
            isAdmin?: boolean;
        }
    }
}
