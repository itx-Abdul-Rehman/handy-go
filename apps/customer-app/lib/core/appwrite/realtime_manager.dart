import 'dart:async';
import 'package:appwrite/appwrite.dart';
import 'package:flutter/foundation.dart';
import 'appwrite_client.dart';

/// Manages Appwrite Realtime subscriptions with automatic reconnection
/// and exponential backoff.
///
/// Usage:
/// ```dart
/// final manager = RealtimeManager();
/// final sub = manager.subscribe(
///   channels: ['tablesdb.xxx.tables.yyy.rows'],
///   onData: (event) { /* handle event */ },
/// );
/// // Later:
/// sub.cancel();
/// // Or cancel all:
/// manager.disposeAll();
/// ```
class RealtimeManager {
  static final RealtimeManager _instance = RealtimeManager._internal();
  factory RealtimeManager() => _instance;
  RealtimeManager._internal();

  final List<_ManagedSubscription> _subscriptions = [];

  /// Subscribe to Appwrite Realtime channels with auto-reconnect.
  ///
  /// Returns a [RealtimeSubscriptionHandle] that should be cancelled
  /// when the widget/screen disposes.
  RealtimeSubscriptionHandle subscribe({
    required List<String> channels,
    required void Function(RealtimeMessage event) onData,
    void Function(Object error)? onError,
    int maxRetries = 10,
  }) {
    final managed = _ManagedSubscription(
      channels: channels,
      onData: onData,
      onError: onError,
      maxRetries: maxRetries,
    );
    _subscriptions.add(managed);
    managed.connect();
    return RealtimeSubscriptionHandle._(managed, this);
  }

  void _remove(_ManagedSubscription sub) {
    sub.dispose();
    _subscriptions.remove(sub);
  }

  /// Cancel all active subscriptions. Call on logout or app dispose.
  void disposeAll() {
    for (final sub in _subscriptions) {
      sub.dispose();
    }
    _subscriptions.clear();
  }
}

/// Handle returned to callers for cancelling a specific subscription.
class RealtimeSubscriptionHandle {
  final _ManagedSubscription _managed;
  final RealtimeManager _manager;

  RealtimeSubscriptionHandle._(this._managed, this._manager);

  /// Cancel this subscription and stop reconnection attempts.
  void cancel() {
    _manager._remove(_managed);
  }

  /// Whether the subscription is currently connected.
  bool get isConnected => _managed._isConnected;
}

class _ManagedSubscription {
  final List<String> channels;
  final void Function(RealtimeMessage event) onData;
  final void Function(Object error)? onError;
  final int maxRetries;

  RealtimeSubscription? _subscription;
  StreamSubscription? _streamSub;
  Timer? _reconnectTimer;
  int _retryCount = 0;
  bool _disposed = false;
  bool _isConnected = false;

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
  static const int _baseDelayMs = 1000;
  static const int _maxDelayMs = 30000;

  _ManagedSubscription({
    required this.channels,
    required this.onData,
    this.onError,
    this.maxRetries = 10,
  });

  void connect() {
    if (_disposed) return;

    try {
      _subscription = AppwriteClient.realtime.subscribe(channels);
      _isConnected = true;
      _retryCount = 0; // Reset on successful connection

      _streamSub = _subscription!.stream.listen(
        (event) {
          if (!_disposed) onData(event);
        },
        onError: (error) {
          _isConnected = false;
          debugPrint('[RealtimeManager] Stream error on $channels: $error');
          if (onError != null && !_disposed) onError!(error);
          _scheduleReconnect();
        },
        onDone: () {
          _isConnected = false;
          debugPrint('[RealtimeManager] Stream closed for $channels');
          _scheduleReconnect();
        },
        cancelOnError: false,
      );
    } catch (e) {
      _isConnected = false;
      debugPrint('[RealtimeManager] Subscribe failed for $channels: $e');
      if (onError != null && !_disposed) onError!(e);
      _scheduleReconnect();
    }
  }

  void _scheduleReconnect() {
    if (_disposed || _retryCount >= maxRetries) {
      if (_retryCount >= maxRetries) {
        debugPrint(
          '[RealtimeManager] Max retries ($maxRetries) reached for $channels. Giving up.',
        );
      }
      return;
    }

    final delayMs = (_baseDelayMs * (1 << _retryCount)).clamp(0, _maxDelayMs);
    _retryCount++;

    debugPrint(
      '[RealtimeManager] Reconnecting $channels in ${delayMs}ms (attempt $_retryCount/$maxRetries)',
    );

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(Duration(milliseconds: delayMs), () {
      _cleanupCurrentSubscription();
      connect();
    });
  }

  void _cleanupCurrentSubscription() {
    _streamSub?.cancel();
    _streamSub = null;
    try {
      _subscription?.close();
    } catch (_) {
      // Subscription may already be closed
    }
    _subscription = null;
  }

  void dispose() {
    _disposed = true;
    _isConnected = false;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _cleanupCurrentSubscription();
  }
}
