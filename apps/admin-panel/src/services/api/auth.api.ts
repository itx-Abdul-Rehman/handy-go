/**
 * Auth API — Appwrite session-based authentication for admin panel.
 *
 * Uses phone→synthetic-email mapping (`{phone}@handygo.app`) because
 * Appwrite auth is email-based while the platform uses phone numbers.
 */
import { account } from '../appwrite-client';
import { useAuthStore } from '../../store/authStore';

export const authApi = {
  /**
   * Login with phone + password.
   * Maps phone to a synthetic email for Appwrite email-password auth.
   */
  login: async (phone: string, password: string) => {
    await account.createEmailPasswordSession(
      `${phone}@handygo.app`,
      password,
    );
    const user = await account.get();

    // Verify admin role via Appwrite user labels
    if (!user.labels?.includes('admin')) {
      await account.deleteSession('current');
      throw new Error('This account does not have admin privileges');
    }

    const userData = {
      _id: user.$id,
      phone: user.phone || phone,
      email: user.email,
      role: 'ADMIN',
      isVerified: user.emailVerification,
      isActive: true,
    };

    return {
      success: true,
      user: userData,
      // Appwrite manages sessions — tokens kept for store compatibility
      accessToken: 'appwrite-session',
      refreshToken: 'appwrite-session',
    };
  },

  logout: async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // Session may already be expired
    }
    useAuthStore.getState().logout();
  },
};
