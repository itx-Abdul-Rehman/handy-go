import { unauthorizedResponse, forbiddenResponse, } from '@handy-go/shared';
import { verifyAccessToken, verifyTempToken } from '../services/token.service.js';
/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            unauthorizedResponse(res, 'No token provided');
            return;
        }
        const token = authHeader.substring(7);
        // Verify token
        const decoded = verifyAccessToken(token);
        // Attach user to request
        req.user = {
            id: decoded.userId,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            unauthorizedResponse(res, 'Token has expired');
            return;
        }
        unauthorizedResponse(res, 'Invalid token');
    }
};
/**
 * Authorization Middleware
 * Checks if user has required role
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            unauthorizedResponse(res, 'Not authenticated');
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            forbiddenResponse(res, 'You do not have permission to access this resource');
            return;
        }
        next();
    };
};
/**
 * Verify Temp Token Middleware
 * For use in registration/password reset flows
 */
export const verifyTempTokenMiddleware = (req, res, next) => {
    try {
        const { tempToken } = req.body;
        if (!tempToken) {
            unauthorizedResponse(res, 'Verification token is required');
            return;
        }
        const decoded = verifyTempToken(tempToken);
        req.tempToken = {
            phone: decoded.phone,
            purpose: decoded.purpose,
        };
        next();
    }
    catch (error) {
        unauthorizedResponse(res, 'Invalid or expired verification token');
    }
};
//# sourceMappingURL=auth.middleware.js.map