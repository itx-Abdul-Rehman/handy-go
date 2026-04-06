import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorizedResponse, forbiddenResponse, UserRole } from '@handy-go/shared';
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

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
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
    const decoded = jwt.verify(token, secret) as { userId: string; role: UserRole };

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      unauthorizedResponse(res, 'Token has expired');
      return;
    }
    unauthorizedResponse(res, 'Invalid token');
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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
