import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { logger } from '@handy-go/shared';
/**
 * General rate limiter for unauthenticated requests
 */
export const generalRateLimiter = rateLimit({
    windowMs: config.rateLimiting.general.windowMs,
    max: config.rateLimiting.general.max,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(config.rateLimiting.general.windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            userAgent: req.get('user-agent'),
        });
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil(config.rateLimiting.general.windowMs / 1000),
        });
    },
});
/**
 * Stricter rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
    windowMs: config.rateLimiting.auth.windowMs,
    max: config.rateLimiting.auth.max,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil(config.rateLimiting.auth.windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use phone number from body if available, otherwise IP
        return req.body?.phone || req.ip;
    },
    handler: (req, res) => {
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            phone: req.body?.phone,
        });
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts. Please try again later.',
            retryAfter: Math.ceil(config.rateLimiting.auth.windowMs / 1000),
        });
    },
});
/**
 * More generous rate limiter for authenticated users
 */
export const authenticatedRateLimiter = rateLimit({
    windowMs: config.rateLimiting.authenticated.windowMs,
    max: config.rateLimiting.authenticated.max,
    message: {
        success: false,
        message: 'Rate limit exceeded. Please slow down.',
        retryAfter: Math.ceil(config.rateLimiting.authenticated.windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.id || req.ip;
    },
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
    },
});
/**
 * Special rate limiter for SOS endpoints (less restrictive for emergencies)
 */
export const sosRateLimiter = rateLimit({
    windowMs: config.rateLimiting.sos.windowMs,
    max: config.rateLimiting.sos.max,
    message: {
        success: false,
        message: 'Too many SOS requests. If this is a genuine emergency, please call emergency services directly.',
        emergencyContacts: {
            police: '15',
            ambulance: '115',
            helpline: '1166',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.id || req.ip;
    },
});
/**
 * Get appropriate rate limiter based on route type
 */
export const getRateLimiter = (type) => {
    switch (type) {
        case 'auth':
            return authRateLimiter;
        case 'authenticated':
            return authenticatedRateLimiter;
        case 'sos':
            return sosRateLimiter;
        default:
            return generalRateLimiter;
    }
};
//# sourceMappingURL=rateLimiter.js.map