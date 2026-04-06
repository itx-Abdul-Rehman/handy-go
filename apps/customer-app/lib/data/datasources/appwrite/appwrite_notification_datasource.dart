import 'package:appwrite/appwrite.dart';
import '../../models/notification_model.dart';
import '../../../core/appwrite/appwrite_client.dart';
import '../../../core/appwrite/appwrite_config.dart';
import '../remote/notification_remote_datasource.dart';

/// Appwrite-based notification data source
///
/// Replaces the Dio/REST-based NotificationRemoteDataSourceImpl.
/// Uses Appwrite Databases for in-app notifications and
/// Appwrite Realtime for live notification push.
class AppwriteNotificationDataSource implements NotificationRemoteDataSource {
  final TablesDB _tablesDB;
  final Account _account;
  String? _cachedUserId;

  AppwriteNotificationDataSource({TablesDB? tablesDB, Account? account})
    : _tablesDB = tablesDB ?? AppwriteClient.tablesDB,
      _account = account ?? AppwriteClient.account;

  /// Get user ID, caching after first successful fetch to avoid repeated
  /// network calls that may time out / fail on refresh.
  Future<String> _getUserId() async {
    if (_cachedUserId != null) return _cachedUserId!;
    final user = await _account.get();
    _cachedUserId = user.$id;
    return _cachedUserId!;
  }

  @override
  Future<NotificationsResponse> getNotifications({
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
  }) async {
    try {
      final userId = await _getUserId();

      final queries = <String>[
        Query.equal('recipientId', userId),
        Query.orderDesc('\$createdAt'),
        Query.limit(limit),
        Query.offset((page - 1) * limit),
      ];

      if (unreadOnly) {
        queries.add(Query.equal('isRead', false));
      }

      final docs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.notificationsCollection,
        queries: queries,
      );

      final notifications = docs.rows.map((doc) {
        return {
          '_id': doc.$id,
          'recipient': doc.data['recipientId'],
          'type': doc.data['type'],
          'title': doc.data['title'],
          'body': doc.data['body'],
          'data': doc.data['data'],
          'isRead': doc.data['isRead'] ?? false,
          'readAt': doc.data['readAt'],
          'createdAt': doc.$createdAt,
        };
      }).toList();

      return NotificationsResponse.fromJson({
        'success': true,
        'data': {
          'notifications': notifications,
          'pagination': {
            'total': docs.total,
            'page': page,
            'limit': limit,
            'totalPages': docs.total == 0 ? 1 : (docs.total / limit).ceil(),
          },
        },
      });
    } on AppwriteException catch (e) {
      // If user session issue, clear cache so next call retries
      if (e.code == 401) _cachedUserId = null;
      throw Exception(e.message ?? 'Failed to get notifications');
    } catch (e) {
      throw Exception('Failed to get notifications');
    }
  }

  @override
  Future<int> getUnreadCount() async {
    try {
      final userId = await _getUserId();

      final docs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.notificationsCollection,
        queries: [
          Query.equal('recipientId', userId),
          Query.equal('isRead', false),
          Query.limit(1), // We only need the total count
        ],
      );

      return docs.total;
    } on AppwriteException catch (e) {
      if (e.code == 401) _cachedUserId = null;
      throw Exception(e.message ?? 'Failed to get unread count');
    } catch (_) {
      return 0; // Gracefully return 0 on failure
    }
  }

  @override
  Future<void> markAsRead(String notificationId) async {
    try {
      await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.notificationsCollection,
        rowId: notificationId,
        data: {'isRead': true, 'readAt': DateTime.now().toIso8601String()},
      );
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to mark notification as read');
    }
  }

  @override
  Future<void> markAllAsRead() async {
    try {
      final user = await _account.get();

      final docs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.notificationsCollection,
        queries: [
          Query.equal('recipientId', user.$id),
          Query.equal('isRead', false),
          Query.limit(100),
        ],
      );

      // Update each notification
      final now = DateTime.now().toIso8601String();
      for (final doc in docs.rows) {
        await _tablesDB.updateRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.notificationsCollection,
          rowId: doc.$id,
          data: {'isRead': true, 'readAt': now},
        );
      }
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to mark all as read');
    }
  }

  @override
  Future<void> registerDevice({
    required String deviceToken,
    required String platform,
  }) async {
    // Appwrite Messaging handles push notification targets
    // This is configured via Appwrite Messaging service
    // The device token is registered when creating a push target
    try {
      // Appwrite Messaging will handle this via the Push provider
      // For now, we can store it as a user preference
      await _account.updatePrefs(
        prefs: {'deviceToken': deviceToken, 'platform': platform},
      );
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to register device');
    }
  }

  @override
  Future<void> unregisterDevice(String deviceToken) async {
    try {
      await _account.updatePrefs(prefs: {'deviceToken': '', 'platform': ''});
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to unregister device');
    }
  }

  // ============================================================
  // REALTIME NOTIFICATIONS (new - replaces polling)
  // ============================================================
  //
  // NOTE: Subscribes to the entire notifications collection because new
  // notification document IDs are unknown ahead of time. Client-side
  // filter by recipientId ensures only the current user's notifications
  // are processed.
  //
  // FUTURE OPTIMIZATION: Remove `read("users")` from notifications
  // collection permissions, and set per-document `$permissions` with
  // `read("user:<recipientId>")` in the notification-sender function.
  // This would make Appwrite only deliver events to the recipient.
  // ============================================================

  /// Subscribe to real-time notifications for the current user
  RealtimeSubscription subscribeToNotifications(
    String userId,
    void Function(Map<String, dynamic> notification) onNotification,
  ) {
    final subscription = AppwriteClient.realtime.subscribe([
      'tablesdb.${AppwriteConfig.databaseId}.tables.${AppwriteConfig.notificationsCollection}.rows',
    ]);

    subscription.stream.listen((event) {
      if (event.payload.isNotEmpty && event.payload['recipientId'] == userId) {
        onNotification(event.payload);
      }
    });

    return subscription;
  }
}
