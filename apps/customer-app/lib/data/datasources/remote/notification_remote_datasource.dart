import '../../models/notification_model.dart';

/// Remote data source for notification operations
abstract class NotificationRemoteDataSource {
  /// Get all notifications for the current user
  Future<NotificationsResponse> getNotifications({
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
  });

  /// Get unread notification count
  Future<int> getUnreadCount();

  /// Mark a notification as read
  Future<void> markAsRead(String notificationId);

  /// Mark all notifications as read
  Future<void> markAllAsRead();

  /// Register device for push notifications
  Future<void> registerDevice({
    required String deviceToken,
    required String platform,
  });

  /// Unregister device from push notifications
  Future<void> unregisterDevice(String deviceToken);
}
