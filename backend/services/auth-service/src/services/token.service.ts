import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UserRole } from '@handy-go/shared';

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

export interface TempTokenPayload {
  phone: string;
  purpose: string;
  verified: boolean;
}

export interface DecodedToken extends JwtPayload, TokenPayload {}
export interface DecodedTempToken extends JwtPayload, TempTokenPayload {}

/**
 * Generate access token
 */
export const generateAccessToken = (userId: string, role: UserRole): string => {
  return jwt.sign({ userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as SignOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  } as SignOptions);
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  return jwt.verify(token, config.jwtSecret) as DecodedToken;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
  return jwt.verify(token, config.jwtRefreshSecret) as DecodedToken;
};

/**
 * Generate temporary token (for OTP verification flow)
 */
export const generateTempToken = (phone: string, purpose: string): string => {
  const options: SignOptions = { expiresIn: '15m' }; // Short-lived temp token
  return jwt.sign(
    { phone, purpose, verified: true },
    config.jwtSecret,
    options
  );
};

/**
 * Verify temporary token
 */
export const verifyTempToken = (token: string): DecodedTempToken => {
  return jwt.verify(token, config.jwtSecret) as DecodedTempToken;
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (
  userId: string,
  role: UserRole
): { accessToken: string; refreshToken: string } => {
  return {
    accessToken: generateAccessToken(userId, role),
    refreshToken: generateRefreshToken(userId),
  };
};
