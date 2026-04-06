/**
 * Appwrite Cloud configuration for the Admin Panel.
 *
 * All values can be overridden via environment variables prefixed with VITE_.
 * See .env.example in this directory for the full list.
 */
export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || 'handygo',

  // Database
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'handy_go_db',

  // Collections
  collections: {
    customers: 'customers',
    customerAddresses: 'customer_addresses',
    workers: 'workers',
    workerSkills: 'worker_skills',
    workerSchedule: 'worker_schedule',
    bookings: 'bookings',
    bookingTimeline: 'booking_timeline',
    bookingImages: 'booking_images',
    reviews: 'reviews',
    sosAlerts: 'sos_alerts',
    notifications: 'notifications',
    platformSettings: 'platform_settings',
    workerLocationHistory: 'worker_location_history',
    wallets: 'wallets',
    transactions: 'transactions',
  },

  // Storage Buckets
  buckets: {
    profileImages: 'profile_images',
    cnicImages: 'cnic_images',
    bookingImages: 'booking_images',
    sosEvidence: 'sos_evidence',
  },

  // Function IDs
  functions: {
    matching: 'matching_service',
    bookingProcessor: 'booking_processor',
    paymentProcessor: 'payment_processor',
    sosAnalyzer: 'sos_analyzer',
    trustCalculator: 'trust_calculator',
    notificationSender: 'notification_sender',
  },
} as const;
