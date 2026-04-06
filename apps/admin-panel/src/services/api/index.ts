/**
 * Barrel re-export for all Appwrite API domain modules.
 *
 * Import from here instead of individual files for convenience:
 *   import { authApi, bookingsApi, usersApi } from '../services/api';
 */
export { authApi } from './auth.api';
export { usersApi } from './users.api';
export { bookingsApi } from './bookings.api';
export { sosApi } from './sos.api';
export { appwriteRealtime } from './realtime.api';
export { settingsApi } from './settings.api';
export { paymentsApi } from './payments.api';
export { mapWorkerDoc, mapBookingDoc } from './mappers';
