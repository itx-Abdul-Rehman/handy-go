import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse, User } from '@handy-go/shared';
import { config } from '../config/index.js';

// Extend Request to include user
interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

interface JwtPayloadWithUser {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 'Access token required', 401);
      return;
    }

    const tokenParts = authHeader.split(' ');
    const token = tokenParts[1];
    const secret = config.jwt.secret;
    if (!secret || !token) {
      errorResponse(res, 'Server configuration error', 500);
      return;
    }

    const decoded = jwt.verify(token, secret) as unknown as JwtPayloadWithUser;

    // Check if user exists
    const user = await User.findById(decoded.userId).select('_id role isActive');
    if (!user) {
      errorResponse(res, 'User not found', 401);
      return;
    }

    if (!user.isActive) {
      errorResponse(res, 'Account is deactivated', 403);
      return;
    }

    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    errorResponse(res, 'Invalid or expired token', 401);
    return;
  }
};

/**
 * Check if user has required role(s)
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(res, 'Not authorized to access this resource', 403);
      return;
    }

    next();
  };
};

/**
 * Internal service authentication (for service-to-service calls)
 * Validates X-Service-Key header for internal endpoints like
 * calculate-trust-score and auto-replace-worker.
 */
export const authenticateService = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const serviceKey = req.headers['x-service-key'];

  if (!serviceKey || serviceKey !== config.serviceKey) {
    errorResponse(res, 'Invalid service key', 401);
    return;
  }

  next();
};
