/**
 * Service barrel — toggle between REST (Axios) and Appwrite backends.
 *
 * All pages should import { authApi, usersApi, ... } from '../services'
 * so a single file swap here toggles the entire admin panel.
 */

// ── Appwrite backend (active) — split into domain modules ──
export { authApi, usersApi, bookingsApi, sosApi, appwriteRealtime, settingsApi, paymentsApi } from './api';

// ── Legacy monolith (deprecated — kept for reference) ──────
// export { authApi, usersApi, bookingsApi, sosApi, appwriteRealtime, settingsApi, paymentsApi } from './appwrite-api';
