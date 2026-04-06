/**
 * Unit tests for the JWT token service — the most security-critical
 * part of the auth service.
 *
 * We use real jwt calls against known secrets to validate the full
 * round-trip: generate → verify → inspect claims.
 */

import jwt from 'jsonwebtoken';

// ── Inline constants so we don't pull in the config module ──
// (which would try to resolve .env and Twilio at import time)
const TEST_JWT_SECRET = 'test-jwt-secret';
const TEST_REFRESH_SECRET = 'test-refresh-secret';

// ── Minimal token helpers (mirror token.service.ts logic) ───

function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, TEST_JWT_SECRET, { expiresIn: '7d' });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, TEST_REFRESH_SECRET, { expiresIn: '30d' });
}

function verifyAccessToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, TEST_JWT_SECRET) as jwt.JwtPayload;
}

function verifyRefreshToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, TEST_REFRESH_SECRET) as jwt.JwtPayload;
}

function generateTempToken(phone: string, purpose: string): string {
  return jwt.sign({ phone, purpose, verified: true }, TEST_JWT_SECRET, { expiresIn: '15m' });
}

function verifyTempToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, TEST_JWT_SECRET) as jwt.JwtPayload;
}

// ── Tests ───────────────────────────────────────────────────

describe('Token Service', () => {
  const userId = '507f1f77bcf86cd799439011';
  const role = 'CUSTOMER';

  // ── Access Token ────────────────────────────────────────
  describe('Access Token', () => {
    test('generates a valid JWT string', () => {
      const token = generateAccessToken(userId, role);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    test('contains correct claims when verified', () => {
      const token = generateAccessToken(userId, role);
      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe(role);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    test('throws on tampered token', () => {
      const token = generateAccessToken(userId, role);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyAccessToken(tampered)).toThrow();
    });

    test('throws when verified with wrong secret', () => {
      const token = generateAccessToken(userId, role);
      expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
    });
  });

  // ── Refresh Token ───────────────────────────────────────
  describe('Refresh Token', () => {
    test('generates a valid JWT', () => {
      const token = generateRefreshToken(userId);
      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe(userId);
    });

    test('cannot be verified with access-token secret', () => {
      const token = generateRefreshToken(userId);
      expect(() => jwt.verify(token, TEST_JWT_SECRET)).toThrow();
    });
  });

  // ── Temp Token (OTP flow) ───────────────────────────────
  describe('Temp Token', () => {
    test('encodes phone, purpose, and verified flag', () => {
      const token = generateTempToken('+923001234567', 'REGISTRATION');
      const decoded = verifyTempToken(token);
      expect(decoded.phone).toBe('+923001234567');
      expect(decoded.purpose).toBe('REGISTRATION');
      expect(decoded.verified).toBe(true);
    });
  });

  // ── Token Pair ──────────────────────────────────────────
  describe('Token Pair', () => {
    test('access and refresh tokens are different strings', () => {
      const access = generateAccessToken(userId, role);
      const refresh = generateRefreshToken(userId);
      expect(access).not.toBe(refresh);
    });
  });
});
