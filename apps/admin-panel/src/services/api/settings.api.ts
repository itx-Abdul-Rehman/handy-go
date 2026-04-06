/**
 * Settings API — persists to localStorage (+ Appwrite when collection exists).
 */
import { databases } from '../appwrite-client';
import { appwriteConfig } from '../appwrite-config';

const { databaseId, collections } = appwriteConfig;

const SETTINGS_STORAGE_KEY = 'handygo_platform_settings';

export const settingsApi = {
  /**
   * Load all settings sections. Returns the 4 sections or defaults.
   */
  getSettings: async (): Promise<{
    general: Record<string, unknown>;
    notifications: Record<string, unknown>;
    platform: Record<string, unknown>;
    security: Record<string, unknown>;
  }> => {
    // Try Appwrite first (if collection exists)
    try {
      const doc = await databases.getDocument(databaseId, collections.platformSettings, 'settings');
      const data = {
        general: JSON.parse(doc.general ?? '{}'),
        notifications: JSON.parse(doc.notifications ?? '{}'),
        platform: JSON.parse(doc.platform ?? '{}'),
        security: JSON.parse(doc.security ?? '{}'),
      };
      // Cache locally
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
      return data;
    } catch {
      // Fallback to localStorage
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch { /* corrupted */ }
      }
      // Return empty — page will use its defaults
      return { general: {}, notifications: {}, platform: {}, security: {} };
    }
  },

  /**
   * Save a specific section of settings.
   */
  saveSettings: async (
    section: 'general' | 'notifications' | 'platform' | 'security',
    data: Record<string, unknown>,
  ): Promise<void> => {
    // Always save to localStorage
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    let all: Record<string, unknown> = {};
    try { all = stored ? JSON.parse(stored) : {}; } catch { /* */ }
    all[section] = data;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(all));

    // Try persisting to Appwrite (best-effort)
    try {
      const payload: Record<string, string> = {
        [section]: JSON.stringify(data),
      };
      try {
        await databases.updateDocument(databaseId, collections.platformSettings, 'settings', payload);
      } catch {
        // Document doesn't exist yet — create it
        await databases.createDocument(databaseId, collections.platformSettings, 'settings', payload);
      }
    } catch {
      // Collection may not exist — localStorage is our store
      console.warn('[Settings] Appwrite collection not available, using localStorage only');
    }
  },
};
