import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse, User, UserRole } from '@handy-go/shared';
import { config } from '../config/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

// Token payload interface
interface TokenPayload {
  userId: string;
  role: UserRole;
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(
        errorResponse(res, 'Access token required', 401)
      );
      return;
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = config.jwt.secret;
    const decoded = jwt.verify(token!, jwtSecret) as unknown as TokenPayload;

    // Check if user exists
    const user = await User.findById(decoded.userId).select('_id role isActive');
    if (!user) {
      res.status(401).json(
        errorResponse(res, 'User not found', 401)
      );
      return;
    }

    if (!user.isActive) {
      res.status(403).json(
        errorResponse(res, 'Account is deactivated', 403)
      );
      return;
    }

    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    res.status(401).json(
      errorResponse(res, 'Invalid or expired token', 401)
    );
    return;
  }
};

/**
 * Check if user has required role(s)
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(
        errorResponse(res, 'Authentication required', 401)
      );
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json(
        errorResponse(res, 'Not authorized to access this resource', 403)
      );
      return;
    }

    next();
  };
};

/**
 * Internal service authentication (for service-to-service calls)
 */
export const authenticateService = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const serviceKey = req.headers['x-service-key'];

  if (!serviceKey || serviceKey !== config.serviceKey) {
    res.status(401).json(
      errorResponse(res, 'Invalid service key', 401)
    );
    return;
  }

  next();
};
