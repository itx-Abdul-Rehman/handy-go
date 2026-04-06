/// API endpoints for Handy Go backend services
class ApiEndpoints {
  ApiEndpoints._();

  // ========================================================
  // DEPLOYMENT CONFIGURATION
  // ========================================================
  // Choose ONE of these options:

  // Option 1: Local Development (Android Emulator)
  // static const String _host = '10.0.2.2';

  // Option 2: Physical Device (replace with your PC's IP)
  // Run: ipconfig | findstr IPv4
  // static const String _host = '192.168.1.100';

  // Option 3: ngrok tunnel (for remote testing)
  // static const String _host = 'your-subdomain.ngrok.io';
  // static const bool _useHttps = true;

  // Option 4: Production Server
  // static const String _host = 'api.handygo.com';
  // static const bool _useHttps = true;

  // ========================================================
  // CURRENT SETTING: Auto-detect for local development
  // ========================================================
  static const bool _useHttps = false;
  static const int _port = 3000;

  static String get baseUrl {
    // For physical device testing via USB (adb reverse tcp:3000 tcp:3000):
    const String physicalDeviceIP = '127.0.0.1'; // Via ADB reverse
    // const String physicalDeviceIP = '192.168.1.3'; // Your laptop WiFi IP

    final protocol = _useHttps ? 'https' : 'http';

    // Uncomment the appropriate line for your testing environment:
    // return '$protocol://$physicalDeviceIP:$_port/api'; // Physical device
    // return 'http://10.0.2.2:$_port/api'; // Android emulator
    // return 'http://localhost:$_port/api'; // iOS simulator or web

    // Default: Use physical device IP for testing
    return '$protocol://$physicalDeviceIP:$_port/api';
  }

  // Auth endpoints
  static const String sendOTP = '/auth/send-otp';
  static const String verifyOTP = '/auth/verify-otp';
  static const String registerCustomer = '/auth/register/customer';
  static const String login = '/auth/login';
  static const String refreshToken = '/auth/refresh-token';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // Customer profile endpoints
  static const String customerProfile = '/users/customer/profile';
  static const String customerAddresses = '/users/customer/addresses';
  static const String deleteAccount = '/users/customer/account';

  // Booking endpoints
  static const String bookings = '/bookings';
  static const String createBooking = '/bookings';
  static const String customerBookings = '/bookings/customer';
  static String bookingDetails(String id) => '/bookings/$id';
  static String selectWorker(String id) => '/bookings/$id/select-worker';
  static String cancelBooking(String id) => '/bookings/$id/cancel';
  static String rateBooking(String id) => '/bookings/$id/rate';

  // Matching endpoints
  static const String analyzeProblem = '/matching/analyze-problem';
  static const String findWorkers = '/matching/find-workers';
  static const String estimatePrice = '/matching/estimate-price';
  static const String estimateDuration = '/matching/estimate-duration';

  // Notification endpoints
  static const String notifications = '/notifications';
  static const String unreadCount = '/notifications/unread-count';
  static const String markAsRead = '/notifications/read-all';
  static const String registerDevice = '/notifications/register-device';
  static const String unregisterDevice = '/notifications/unregister-device';

  // SOS endpoints
  static const String triggerSOS = '/sos/trigger';
  static String sosDetails(String id) => '/sos/$id';
  static String updateSos(String id) => '/sos/$id/update';

  // Timeouts
  static const int connectionTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
}
