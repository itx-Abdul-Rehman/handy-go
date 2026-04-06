import { v4 as uuidv4 } from 'uuid';
import { logger } from '@handy-go/shared';
/**
 * Middleware to add a unique request ID to each request
 * Useful for tracing requests across microservices
 */
export const requestId = (req, res, next) => {
    // Use existing request ID from header or generate new one
    const existingId = req.headers['x-request-id'];
    req.requestId = existingId || uuidv4();
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.requestId);
    // Pass to downstream services
    req.headers['x-request-id'] = req.requestId;
    next();
};
/**
 * Middleware to log requests with timing information
 */
export const requestLogger = (req, res, next) => {
    req.startTime = Date.now();
    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - (req.startTime || Date.now());
        const logData = {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            query: req.query,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            userId: req.user?.id,
        };
        if (res.statusCode >= 500) {
            logger.error('Request completed with error', logData);
        }
        else if (res.statusCode >= 400) {
            logger.warn('Request completed with client error', logData);
        }
        else {
            logger.info('Request completed', logData);
        }
    });
    next();
};
/**
 * Middleware to parse and validate content type
 */
export const contentTypeValidator = (req, res, next) => {
    // Skip for GET, DELETE, HEAD, OPTIONS
    if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    // Check content type for POST, PUT, PATCH
    const contentType = req.get('content-type');
    if (!contentType) {
        // Allow requests without body
        if (!req.body || Object.keys(req.body).length === 0) {
            return next();
        }
    }
    // Accept JSON and form data
    if (contentType && !contentType.includes('application/json') &&
        !contentType.includes('application/x-www-form-urlencoded') &&
        !contentType.includes('multipart/form-data')) {
        return res.status(415).json({
            success: false,
            message: 'Unsupported content type. Use application/json',
        });
    }
    next();
};
/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
    // Additional security headers not covered by helmet
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Remove server identification
    res.removeHeader('X-Powered-By');
    next();
};
/**
 * CORS preflight handler
 */
export const handlePreflight = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    next();
};
//# sourceMappingURL=common.js.map