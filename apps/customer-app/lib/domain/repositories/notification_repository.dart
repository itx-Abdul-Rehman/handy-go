import '../../data/models/notification_model.dart';

/// Abstract repository for notification operations
abstract class NotificationRepository {
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
