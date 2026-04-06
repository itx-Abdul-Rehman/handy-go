import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { logger } from '@handy-go/shared';
import { config } from '../config/index.js';
import { isPublicRoute } from '../config/routes.js';

// Extend Request to include user
interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

interface TokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware for the API Gateway
 * Validates JWT tokens and attaches user info to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Skip auth for public routes
  if (isPublicRoute(req.path)) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = config.jwt?.secret;

    if (!jwtSecret) {
      logger.error('JWT secret not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    try {
      const decoded = jwt.verify(token!, jwtSecret) as unknown as TokenPayload;

      // Attach user to request
      req.user = {
        id: decoded.userId,
        role: decoded.role,
      };

      // Add user info to headers for downstream services
      req.headers['x-user-id'] = decoded.userId;
      req.headers['x-user-role'] = decoded.role;

      next();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Just extracts user info if token is present
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const jwtSecret = config.jwt?.secret;

    if (authHeader && authHeader.startsWith('Bearer ') && jwtSecret) {
      const token = authHeader.split(' ')[1];

      try {
        const decoded = jwt.verify(token!, jwtSecret) as unknown as TokenPayload;

        req.user = {
          id: decoded.userId,
          role: decoded.role,
        };

        req.headers['x-user-id'] = decoded.userId;
        req.headers['x-user-role'] = decoded.role;
      } catch {
        // Token invalid but not required - continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
};
