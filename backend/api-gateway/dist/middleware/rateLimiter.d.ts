/**
 * General rate limiter for unauthenticated requests
 */
export declare const generalRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Stricter rate limiter for authentication endpoints
 */
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * More generous rate limiter for authenticated users
 */
export declare const authenticatedRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Special rate limiter for SOS endpoints (less restrictive for emergencies)
 */
export declare const sosRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Get appropriate rate limiter based on route type
 */
export declare const getRateLimiter: (type: string) => import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map