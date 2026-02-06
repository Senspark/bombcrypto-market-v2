import {NextFunction, Request, Response} from 'express';
import crypto from 'crypto';

/**
 * Admin authentication middleware
 * Validates X-API-Key header against configured API key
 */
export function createAdminAuth(apiKey: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const providedKey = req.header('X-API-Key');

        if (!providedKey) {
            res.status(403).json({message: 'go away!!!'});
            return;
        }

        const providedBuffer = Buffer.from(providedKey);
        const expectedBuffer = Buffer.from(apiKey);

        // Prevent timing attacks by using timingSafeEqual
        // Also ensure lengths match first, as timingSafeEqual throws on length mismatch
        if (providedBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
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
