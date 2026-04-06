/**
 * Realtime subscriptions — Appwrite WebSocket for live admin dashboard updates.
 */
import { client } from '../appwrite-client';
import { appwriteConfig } from '../appwrite-config';

const { databaseId, collections } = appwriteConfig;

export const appwriteRealtime = {
  /** Subscribe to new/updated SOS alerts (replaces polling) */
  subscribeToSOS: (callback: (payload: Record<string, unknown>) => void) => {
    return client.subscribe(
      [`databases.${databaseId}.collections.${collections.sosAlerts}.documents`],
      (response) => callback(response.payload as Record<string, unknown>),
    );
  },

  /** Subscribe to booking updates */
  subscribeToBookings: (callback: (payload: Record<string, unknown>) => void) => {
    return client.subscribe(
      [`databases.${databaseId}.collections.${collections.bookings}.documents`],
      (response) => callback(response.payload as Record<string, unknown>),
    );
  },
};
