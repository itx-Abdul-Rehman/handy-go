import '../../domain/repositories/notification_repository.dart';
import '../../data/datasources/remote/notification_remote_datasource.dart';
import '../../data/models/notification_model.dart';

/// Implementation of NotificationRepository
class NotificationRepositoryImpl implements NotificationRepository {
  final NotificationRemoteDataSource remoteDataSource;

  NotificationRepositoryImpl({required this.remoteDataSource});

  @override
  Future<NotificationsResponse> getNotifications({
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
  }) async {
    return await remoteDataSource.getNotifications(
      page: page,
      limit: limit,
      unreadOnly: unreadOnly,
    );
  }

  @override
  Future<int> getUnreadCount() async {
    return await remoteDataSource.getUnreadCount();
  }

  @override
  Future<void> markAsRead(String notificationId) async {
    await remoteDataSource.markAsRead(notificationId);
  }

  @override
  Future<void> markAllAsRead() async {
    await remoteDataSource.markAllAsRead();
  }

  @override
  Future<void> registerDevice({
    required String deviceToken,
    required String platform,
  }) async {
    await remoteDataSource.registerDevice(
      deviceToken: deviceToken,
      platform: platform,
    );
  }

  @override
  Future<void> unregisterDevice(String deviceToken) async {
    await remoteDataSource.unregisterDevice(deviceToken);
  }
}
