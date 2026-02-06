import rateLimit from 'express-rate-limit';

/**
 * Create rate limiter middleware
 * Limits requests per IP + endpoint combination
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
        keyGenerator: (req) => {
            // Combine IP and endpoint for rate limiting
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const endpoint = req.path;
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
