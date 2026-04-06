import 'dart:convert';
import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:appwrite/appwrite.dart';
import '../appwrite/appwrite_client.dart';
import '../appwrite/appwrite_config.dart';

/// Top-level background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('[FCM] Background message: ${message.messageId}');
}

/// Manages FCM push notifications end-to-end for the Worker App:
/// - Firebase initialization
/// - Permission request
/// - Token retrieval & registration with Appwrite
/// - Foreground/background/terminated message handling
/// - Local notification display
class PushNotificationService {
  static final PushNotificationService _instance =
      PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  /// Callback when user taps a notification
  void Function(Map<String, dynamic> data)? onNotificationTapped;

  // ============================================================
  // INITIALIZATION
  // ============================================================

  /// Initialize Firebase and push notifications.
  /// Call this in main() after WidgetsFlutterBinding.ensureInitialized().
  Future<void> initialize() async {
    try {
      // 1. Initialize Firebase
      await Firebase.initializeApp();
      debugPrint('[FCM] Firebase initialized');
    } catch (e) {
      debugPrint('[FCM] Firebase init failed: $e');
      return; // Can't proceed without Firebase
    }

    try {
      // 2. Set up background message handler
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // 3. Initialize local notifications (for foreground display)
      await _initLocalNotifications();

      // 4. Set up foreground message handler
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // 5. Handle notification tap when app is in background/terminated
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // 6. Check if app was opened from a terminated state notification
      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }

      // 7. Set foreground notification presentation options (iOS)
      await _messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      debugPrint('[FCM] Push notification service initialized (Worker)');
    } catch (e) {
      debugPrint('[FCM] Push notification setup error: $e');
    }
  }

  // ============================================================
  // PERMISSIONS
  // ============================================================

  /// Request notification permission. Returns true if granted.
  Future<bool> requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    final granted =
        settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;

    debugPrint('[FCM] Permission ${granted ? "granted" : "denied"}');
    return granted;
  }

  // ============================================================
  // TOKEN MANAGEMENT
  // ============================================================

  /// Get FCM token and register it with Appwrite user prefs.
  /// Call this after the user is authenticated.
  Future<String?> getAndRegisterToken() async {
    try {
      _fcmToken = await _messaging.getToken();

      if (_fcmToken != null) {
        debugPrint('[FCM] Token: ${_fcmToken!.substring(0, 20)}...');
        await _registerTokenWithAppwrite(_fcmToken!);
      }

      // Listen for token refresh
      _messaging.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        _registerTokenWithAppwrite(newToken);
        debugPrint('[FCM] Token refreshed');
      });

      return _fcmToken;
    } catch (e) {
      debugPrint('[FCM] Error getting token: $e');
      return null;
    }
  }

  /// Store FCM token in Appwrite user prefs and create a push target
  /// so Appwrite Messaging can deliver push notifications to this device.
  Future<void> _registerTokenWithAppwrite(String token) async {
    try {
      final account = AppwriteClient.account;
      final prefs = await SharedPreferences.getInstance();

      // 1. Create/update Appwrite push target for Messaging
      try {
        // Delete old target if it exists
        final oldTargetId = prefs.getString('fcm_target_id');
        if (oldTargetId != null) {
          try {
            await account.deletePushTarget(targetId: oldTargetId);
          } catch (_) {}
        }

        // Create new push target
        final target = await account.createPushTarget(
          targetId: ID.unique(),
          identifier: token,
          providerId: AppwriteConfig.fcmProviderId,
        );
        await prefs.setString('fcm_target_id', target.$id);
        debugPrint('[FCM] Push target created: ${target.$id}');
      } catch (e) {
        debugPrint('[FCM] Push target error: $e');
      }

      // 2. Also store token in user preferences as backup reference
      await account.updatePrefs(
        prefs: {
          'fcmToken': token,
          'platform': Platform.isAndroid ? 'android' : 'ios',
          'tokenUpdatedAt': DateTime.now().toIso8601String(),
        },
      );

      debugPrint('[FCM] Token registered with Appwrite');
    } catch (e) {
      debugPrint('[FCM] Error registering token: $e');
    }
  }

  /// Unregister token (call on logout)
  Future<void> unregisterToken() async {
    try {
      await _messaging.deleteToken();
      _fcmToken = null;

      // Delete push target from Appwrite
      final prefs = await SharedPreferences.getInstance();
      final targetId = prefs.getString('fcm_target_id');
      if (targetId != null) {
        try {
          await AppwriteClient.account.deletePushTarget(targetId: targetId);
        } catch (_) {}
        await prefs.remove('fcm_target_id');
      }

      // Clear from Appwrite user prefs
      try {
        await AppwriteClient.account.updatePrefs(
          prefs: {'fcmToken': '', 'platform': ''},
        );
      } catch (_) {}

      debugPrint('[FCM] Token unregistered');
    } catch (e) {
      debugPrint('[FCM] Error unregistering token: $e');
    }
  }

  // ============================================================
  // LOCAL NOTIFICATIONS
  // ============================================================

  Future<void> _initLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Handle notification tap from local notification
        if (response.payload != null) {
          try {
            final data = jsonDecode(response.payload!) as Map<String, dynamic>;
            onNotificationTapped?.call(data);
          } catch (_) {}
        }
      },
    );

    // Create the notification channel for Android
    const androidChannel = AndroidNotificationChannel(
      'handy_go_notifications',
      'Handy Go Worker Notifications',
      description: 'Notifications for bookings, updates, and alerts',
      importance: Importance.high,
      enableVibration: true,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(androidChannel);
  }

  /// Show a local notification (used for foreground messages)
  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    const androidDetails = AndroidNotificationDetails(
      'handy_go_notifications',
      'Handy Go Worker Notifications',
      channelDescription: 'Notifications for bookings, updates, and alerts',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      enableVibration: true,
      playSound: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      details,
      payload: jsonEncode(message.data),
    );
  }

  // ============================================================
  // MESSAGE HANDLERS
  // ============================================================

  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('[FCM] Foreground message: ${message.notification?.title}');
    _showLocalNotification(message);
  }

  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('[FCM] Notification tapped: ${message.data}');
    onNotificationTapped?.call(message.data);
  }
}
