import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
/**
 * Generate access token
 */
export const generateAccessToken = (userId, role) => {
    return jwt.sign({ userId, role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
};
/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, config.jwtRefreshSecret, {
        expiresIn: config.jwtRefreshExpiresIn,
    });
};
/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
    return jwt.verify(token, config.jwtSecret);
};
/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, config.jwtRefreshSecret);
};
/**
 * Generate temporary token (for OTP verification flow)
 */
export const generateTempToken = (phone, purpose) => {
    const options = { expiresIn: '15m' }; // Short-lived temp token
    return jwt.sign({ phone, purpose, verified: true }, config.jwtSecret, options);
};
/**
 * Verify temporary token
 */
export const verifyTempToken = (token) => {
    return jwt.verify(token, config.jwtSecret);
};
/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (userId, role) => {
    return {
        accessToken: generateAccessToken(userId, role),
        refreshToken: generateRefreshToken(userId),
    };
};
//# sourceMappingURL=token.service.js.map