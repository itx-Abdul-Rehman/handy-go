import jwt from 'jsonwebtoken';
import { unauthorizedResponse, forbiddenResponse } from '@handy-go/shared';
import { config } from '../config/index.js';
export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            unauthorizedResponse(res, 'No token provided');
            return;
        }
        const token = authHeader.substring(7);
        const secret = config.jwtSecret;
        if (!secret) {
            throw new Error('JWT secret not configured');
        }
        const decoded = jwt.verify(token, secret);
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
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            unauthorizedResponse(res, 'Not authenticated');
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            forbiddenResponse(res, 'Access denied');
            return;
        }
        next();
    };
};
//# sourceMappingURL=auth.middleware.js.map