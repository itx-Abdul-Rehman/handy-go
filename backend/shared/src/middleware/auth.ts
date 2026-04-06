import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { HTTP_STATUS, ERROR_CODES, UserRole } from '../constants/index.js';
import { User } from '../models/User.js';
import { TokenBlacklist } from '../models/TokenBlacklist.js';
import logger from '../utils/logger.js';

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────

export interface AuthTokenPayload extends JwtPayload {
  userId: string;
  role: UserRole;
}

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

// ──────────────────────────────────────────────────────
// authenticate — verifies JWT, checks blacklist & user status
// ──────────────────────────────────────────────────────

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. No token provided.',
        errorCode: ERROR_CODES.TOKEN_INVALID,
      });
      return;
    }

    const token = authHeader.split(' ')[1]!;
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET is not configured');
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
        errorCode: ERROR_CODES.INTERNAL_ERROR,
      });
      return;
    }

    // Decode
    const decoded = jwt.verify(token, jwtSecret) as unknown as AuthTokenPayload;

    // Check blacklist (token revocation)
    const revoked = await TokenBlacklist.isRevoked(token);
    if (revoked) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token has been revoked',
        errorCode: ERROR_CODES.TOKEN_INVALID,
      });
      return;
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('isActive role').lean();
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User no longer exists',
        errorCode: ERROR_CODES.USER_NOT_FOUND,
      });
      return;
    }
    if (!user.isActive) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User account is deactivated',
        errorCode: ERROR_CODES.USER_INACTIVE,
      });
      return;
    }

    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token has expired',
        errorCode: ERROR_CODES.TOKEN_EXPIRED,
      });
      return;
    }
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token',
      errorCode: ERROR_CODES.TOKEN_INVALID,
    });
  }
};

// ──────────────────────────────────────────────────────
// authorize — checks that req.user.role is in the allow-list
// ──────────────────────────────────────────────────────

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
        errorCode: ERROR_CODES.TOKEN_INVALID,
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to access this resource',
        errorCode: 'FORBIDDEN',
      });
      return;
    }
    next();
  };
};

// ──────────────────────────────────────────────────────
// authenticateService — checks X-Service-Key for internal calls
// ──────────────────────────────────────────────────────

export const authenticateService = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const serviceKey = req.headers['x-service-key'] as string | undefined;
  const expectedKey = process.env.INTERNAL_SERVICE_KEY;

  if (!expectedKey) {
    logger.error('INTERNAL_SERVICE_KEY is not configured');
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      errorCode: ERROR_CODES.INTERNAL_ERROR,
    });
    return;
  }

  if (!serviceKey || serviceKey !== expectedKey) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid service key',
      errorCode: ERROR_CODES.TOKEN_INVALID,
    });
    return;
  }

  next();
};
