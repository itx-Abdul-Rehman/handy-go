/// Appwrite Cloud configuration for Handy Go Worker App
///
/// Shared configuration (identical to customer app).
/// Fill in your project details from:
/// https://cloud.appwrite.io/console/organization-699899ae48dce39056dc
class AppwriteConfig {
  AppwriteConfig._();

  // ============================================================
  // APPWRITE CLOUD CONNECTION
  // ============================================================
  static const String endpoint = 'https://fra.cloud.appwrite.io/v1';

  /// Create a project in your Appwrite organization and paste the ID here
  static const String projectId = 'handygo';

  // ============================================================
  // DATABASE
  // ============================================================
  static const String databaseId = 'handy_go_db';

  // Collection IDs
  static const String customersCollection = 'customers';
  static const String customerAddressesCollection = 'customer_addresses';
  static const String workersCollection = 'workers';
  static const String workerSkillsCollection = 'worker_skills';
  static const String workerScheduleCollection = 'worker_schedule';
  static const String bookingsCollection = 'bookings';
  static const String bookingTimelineCollection = 'booking_timeline';
  static const String bookingImagesCollection = 'booking_images';
  static const String reviewsCollection = 'reviews';
  static const String sosCollection = 'sos_alerts';
  static const String notificationsCollection = 'notifications';
  static const String workerLocationHistoryCollection =
      'worker_location_history';
  static const String emailOtpsCollection = 'email_otps';
  static const String chatMessagesCollection = 'chat_messages';
  static const String walletsCollection = 'wallets';
  static const String transactionsCollection = 'transactions';

  // ============================================================
  // STORAGE BUCKETS
  // ============================================================
  static const String profileImagesBucket = 'profile_images';
  static const String cnicImagesBucket = 'cnic_images';
  static const String bookingImagesBucket = 'booking_images';
  static const String sosEvidenceBucket = 'sos_evidence';

  // ============================================================
  // FUNCTION IDs
  // ============================================================
  static const String matchingFunction = 'matching_service';
  static const String bookingProcessorFunction = 'booking_processor';
  static const String sosAnalyzerFunction = 'sos_analyzer';
  static const String trustCalculatorFunction = 'trust_calculator';
  static const String notificationSenderFunction = 'notification_sender';
  static const String emailOtpFunction = 'email_otp';
  static const String paymentProcessorFunction = 'payment_processor';

  // ============================================================
  // MESSAGING
  // ============================================================
  /// FCM provider ID configured in Appwrite Console → Messaging → Providers
  /// Create a provider first, then paste its ID here.
  static const String fcmProviderId = 'fcm_provider';

  // ============================================================
  // HELPERS
  // ============================================================

  /// Get file preview/view URL for a storage bucket file
  static String getFileUrl(String bucketId, String fileId) {
    return '$endpoint/storage/buckets/$bucketId/files/$fileId/view?project=$projectId';
  }

  /// Get file preview URL with dimensions
  static String getFilePreview(
    String bucketId,
    String fileId, {
    int? width,
    int? height,
  }) {
    var url =
        '$endpoint/storage/buckets/$bucketId/files/$fileId/preview?project=$projectId';
    if (width != null) url += '&width=$width';
    if (height != null) url += '&height=$height';
    return url;
  }
}
