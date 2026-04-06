import { RequestHandler } from 'express';
import { UserRole } from '@handy-go/shared';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: UserRole;
            };
            tempToken?: {
                phone: string;
                purpose: string;
            };
        }
    }
}
/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export declare const authenticate: RequestHandler;
/**
 * Authorization Middleware
 * Checks if user has required role
 */
export declare const authorize: (...allowedRoles: UserRole[]) => RequestHandler;
/**
 * Verify Temp Token Middleware
 * For use in registration/password reset flows
 */
export declare const verifyTempTokenMiddleware: RequestHandler;
//# sourceMappingURL=auth.middleware.d.ts.map