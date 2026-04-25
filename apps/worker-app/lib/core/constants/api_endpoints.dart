class ApiEndpoints {
  // Base URL - Render Production
  static const String baseUrl = 'https://handy-go-1y91.onrender.com/api';

  // Auth Endpoints
  static const String sendOtp = '/auth/send-otp';
  static const String verifyOtp = '/auth/verify-otp';
  static const String registerWorker = '/auth/register/worker';
  static const String login = '/auth/login';
  static const String refreshToken = '/auth/refresh-token';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
 
  // Worker Profile Endpoints
  static const String workerProfile = '/users/worker/profile';
  static const String updateLocation = '/users/worker/location';
  static const String updateAvailability = '/users/worker/availability';
  static const String uploadDocuments = '/users/worker/documents';
  static const String workerEarnings = '/users/worker/earnings';

  // Booking Endpoints
  static const String availableBookings = '/bookings/worker/available';
  static const String workerBookings = '/bookings/worker';
  static String acceptBooking(String id) => '/bookings/$id/accept';
  static String rejectBooking(String id) => '/bookings/$id/reject';
  static String startBooking(String id) => '/bookings/$id/start';
  static String completeBooking(String id) => '/bookings/$id/complete';
  static String bookingLocation(String id) => '/bookings/$id/location';
  static String bookingDetails(String id) => '/bookings/$id';

  // Notification Endpoints
  static const String notifications = '/notifications';
  static const String unreadCount = '/notifications/unread-count';
  static const String registerDevice = '/notifications/register-device';
  static String markAsRead(String id) => '/notifications/$id/read';
  static const String markAllAsRead = '/notifications/read-all';

  // SOS Endpoints
  static const String triggerSos = '/sos/trigger';
  static String sosDetails(String id) => '/sos/$id';
}
