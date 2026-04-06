import { JwtPayload } from 'jsonwebtoken';
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
export interface DecodedToken extends JwtPayload, TokenPayload {
}
export interface DecodedTempToken extends JwtPayload, TempTokenPayload {
}
/**
 * Generate access token
 */
export declare const generateAccessToken: (userId: string, role: UserRole) => string;
/**
 * Generate refresh token
 */
export declare const generateRefreshToken: (userId: string) => string;
/**
 * Verify access token
 */
export declare const verifyAccessToken: (token: string) => DecodedToken;
/**
 * Verify refresh token
 */
export declare const verifyRefreshToken: (token: string) => DecodedToken;
/**
 * Generate temporary token (for OTP verification flow)
 */
export declare const generateTempToken: (phone: string, purpose: string) => string;
/**
 * Verify temporary token
 */
export declare const verifyTempToken: (token: string) => DecodedTempToken;
/**
 * Generate token pair (access + refresh)
 */
export declare const generateTokenPair: (userId: string, role: UserRole) => {
    accessToken: string;
    refreshToken: string;
};
//# sourceMappingURL=token.service.d.ts.map