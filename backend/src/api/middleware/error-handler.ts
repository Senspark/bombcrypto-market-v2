import {NextFunction, Request, Response} from 'express';
import {Logger} from '@/utils/logger';

// HTTP Error class
export class HttpError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly errorCode?: number
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

// Common error factory functions
export const HttpErrors = {
    badRequest: (message: string = 'invalid request', errorCode?: number) =>
        new HttpError(400, message, errorCode),

    unauthorized: (message: string = 'unauthorized') =>
        new HttpError(401, message),

    forbidden: (message: string = 'go away!!!') =>
        new HttpError(403, message),

    notFound: (message: string = 'not found') =>
        new HttpError(404, message),

    internalError: (message: string = 'something went wrong') =>
        new HttpError(500, message),

    tokenOwnerExists: (tokenId: string, owner: string) =>
        new HttpError(400, `owner of token ${tokenId} exists: ${owner}`, 4001),
};

// Error code constants
export const ErrorCodes = {
    TOKEN_OWNER_EXISTS: 4001,
};

/**
 * Global error handler middleware
 */
export function createErrorHandler(logger: Logger) {
    return (err: Error, req: Request, res: Response, _next: NextFunction) => {
        // Log error
        logger.error(`Error handling ${req.method} ${req.url}:`, err);

        // Handle known HTTP errors
        if (err instanceof HttpError) {
            const response: { message: string; code?: number } = {
                message: err.message,
            };

            if (err.errorCode) {
                response.code = err.errorCode;
            }

            res.status(err.statusCode).json(response);
            return;
        }

        // Handle unexpected errors
        res.status(500).json({message: 'something went wrong'});
    };
}

/**
 * Not found handler middleware
 */
export function notFoundHandler(_req: Request, res: Response) {
    res.status(404).json({message: 'not found'});
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
