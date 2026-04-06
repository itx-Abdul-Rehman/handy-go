import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  phone: string;
  email?: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

/**
 * Decode a JWT token payload without external libraries.
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Check whether a JWT token is still valid (not expired).
 * Returns false if the token cannot be decoded or has expired.
 */
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  // Add 30-second buffer to avoid edge-case clock skew
  return payload.exp * 1000 > Date.now() + 30_000;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'handy-go-admin-auth',
      onRehydrateStorage: () => (state) => {
        // On app load, validate the persisted token is not expired.
        // If expired, clear auth state to force re-login.
        if (state && state.isAuthenticated) {
          if (!isTokenValid(state.accessToken)) {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
          }
        }
      },
    }
  )
);
