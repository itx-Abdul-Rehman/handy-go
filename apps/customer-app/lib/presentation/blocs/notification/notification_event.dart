import 'package:equatable/equatable.dart';

/// Base class for notification events
abstract class NotificationEvent extends Equatable {
  const NotificationEvent();

  @override
  List<Object?> get props => [];
}

/// Event to load notifications
class LoadNotificationsRequested extends NotificationEvent {
  final int page;
  final int limit;
  final bool unreadOnly;
  final bool refresh;

  const LoadNotificationsRequested({
    this.page = 1,
    this.limit = 20,
    this.unreadOnly = false,
    this.refresh = false,
  });

  @override
  List<Object?> get props => [page, limit, unreadOnly, refresh];
}

/// Event to refresh notifications
class RefreshNotificationsRequested extends NotificationEvent {
  const RefreshNotificationsRequested();
}

/// Event to load more notifications (pagination)
class LoadMoreNotificationsRequested extends NotificationEvent {
  const LoadMoreNotificationsRequested();
}

/// Event to get unread count
class LoadUnreadCountRequested extends NotificationEvent {
  const LoadUnreadCountRequested();
}

/// Event to mark single notification as read
class MarkNotificationAsReadRequested extends NotificationEvent {
  final String notificationId;

  const MarkNotificationAsReadRequested(this.notificationId);

  @override
  List<Object?> get props => [notificationId];
}

/// Event to mark all notifications as read
class MarkAllNotificationsAsReadRequested extends NotificationEvent {
  const MarkAllNotificationsAsReadRequested();
}

/// Event to register device for push notifications
class RegisterDeviceRequested extends NotificationEvent {
  final String deviceToken;
  final String platform;

  const RegisterDeviceRequested({
    required this.deviceToken,
    required this.platform,
  });

  @override
  List<Object?> get props => [deviceToken, platform];
}

/// Event to unregister device from push notifications
class UnregisterDeviceRequested extends NotificationEvent {
  final String deviceToken;

  const UnregisterDeviceRequested(this.deviceToken);

  @override
  List<Object?> get props => [deviceToken];
}

/// Event to clear notification state
class ClearNotificationStateRequested extends NotificationEvent {
  const ClearNotificationStateRequested();
}
