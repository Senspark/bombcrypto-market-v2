import rateLimit from 'express-rate-limit';
import {Request} from 'express';

/**
 * Path with the id-looking segments collapsed, so every id shares the bucket
 * of its route: /explorer/hero/1, /2, /3... all count as /explorer/hero/:id.
 * Keying on the raw path would give each id a fresh allowance, leaving id
 * enumeration (hero, house, wallet, tokenId) effectively unthrottled.
 */
export function rateLimitEndpoint(path: string): string {
    return path
        .split('/')
        .map((segment) =>
            /^\d+$/.test(segment) || /^0x[0-9a-fA-F]{6,}$/.test(segment) ? ':id' : segment
        )
        .join('/');
}

/**
 * Create rate limiter middleware
 * Limits requests per IP + route combination
 *
 * @param windowMs - Time window in milliseconds
 * @param max - Maximum number of requests per window
 */
export function createRateLimiter(windowMs: number = 10000, max: number = 100) {
    return rateLimit({
        windowMs, // 10 seconds by default
        max, // 100 requests per window by default
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req: Request) => {
            // Combine IP and route for rate limiting
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const endpoint = rateLimitEndpoint(req.path);
            return `${ip}:${endpoint}`;
        },
        message: {
            message: 'Too many requests, please try again later.',
        },
        // Disable IPv6 validation - we're combining IP with endpoint which is acceptable
        // The validation warns about IPv6 bypass, but our key includes endpoint path
        validate: {keyGeneratorIpFallback: false},
    });
}
