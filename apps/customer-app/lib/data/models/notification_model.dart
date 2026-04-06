import 'dart:convert';

import 'package:equatable/equatable.dart';

/// Notification type enum
enum NotificationType { booking, payment, sos, system, promotion }

/// Notification model for API responses
class NotificationModel extends Equatable {
  final String id;
  final NotificationType type;
  final String title;
  final String body;
  final Map<String, dynamic>? data;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;

  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.data,
    required this.isRead,
    this.readAt,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] ?? json['id'] ?? '',
      type: _parseType(json['type']),
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      data: _parseData(json['data']),
      isRead: json['isRead'] ?? false,
      readAt: json['readAt'] != null ? DateTime.parse(json['readAt']) : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name.toUpperCase(),
      'title': title,
      'body': body,
      'data': data,
      'isRead': isRead,
      'readAt': readAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }

  NotificationModel copyWith({
    String? id,
    NotificationType? type,
    String? title,
    String? body,
    Map<String, dynamic>? data,
    bool? isRead,
    DateTime? readAt,
    DateTime? createdAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      body: body ?? this.body,
      data: data ?? this.data,
      isRead: isRead ?? this.isRead,
      readAt: readAt ?? this.readAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  static NotificationType _parseType(String? type) {
    switch (type?.toUpperCase()) {
      case 'BOOKING':
        return NotificationType.booking;
      case 'PAYMENT':
        return NotificationType.payment;
      case 'SOS':
        return NotificationType.sos;
      case 'PROMOTION':
        return NotificationType.promotion;
      case 'SYSTEM':
      default:
        return NotificationType.system;
    }
  }

  /// Parse the data field which may arrive as a JSON string or a Map.
  static Map<String, dynamic>? _parseData(dynamic raw) {
    if (raw == null) return null;
    if (raw is Map<String, dynamic>) return raw;
    if (raw is Map) return Map<String, dynamic>.from(raw);
    if (raw is String && raw.isNotEmpty) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is Map) return Map<String, dynamic>.from(decoded);
      } catch (_) {}
    }
    return null;
  }

  @override
  List<Object?> get props => [
    id,
    type,
    title,
    body,
    data,
    isRead,
    readAt,
    createdAt,
  ];
}

/// Response for paginated notifications
class NotificationsResponse {
  final List<NotificationModel> notifications;
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  NotificationsResponse({
    required this.notifications,
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory NotificationsResponse.fromJson(Map<String, dynamic> json) {
    final meta = json['meta'] as Map<String, dynamic>? ?? {};
    final dynamic rawData = json['data'];

    // Handle multiple response formats:
    // 1. { data: [...] }  — data is a direct list of notifications
    // 2. { data: { notifications: [...], pagination: {...} } }  — nested Map
    // 3. { data: [...], meta: {...} }  — list + separate meta
    List<dynamic> notificationsList;
    Map<String, dynamic> paginationMeta = meta;

    if (rawData is List) {
      notificationsList = rawData;
    } else if (rawData is Map) {
      notificationsList = (rawData['notifications'] as List?) ?? [];
      // Extract pagination from nested structure if meta is empty
      if (paginationMeta.isEmpty && rawData['pagination'] is Map) {
        paginationMeta = Map<String, dynamic>.from(
          rawData['pagination'] as Map,
        );
      }
    } else {
      notificationsList = [];
    }

    return NotificationsResponse(
      notifications: notificationsList
          .map(
            (e) => NotificationModel.fromJson(
              e is Map<String, dynamic>
                  ? e
                  : Map<String, dynamic>.from(e as Map),
            ),
          )
          .toList(),
      page: paginationMeta['page'] ?? json['page'] ?? 1,
      limit: paginationMeta['limit'] ?? json['limit'] ?? 20,
      total: paginationMeta['total'] ?? json['total'] ?? 0,
      totalPages: paginationMeta['totalPages'] ?? json['totalPages'] ?? 1,
    );
  }
}

/// Unread count response
class UnreadCountResponse {
  final int count;

  UnreadCountResponse({required this.count});

  factory UnreadCountResponse.fromJson(Map<String, dynamic> json) {
    return UnreadCountResponse(
      count: json['count'] ?? json['data']?['count'] ?? 0,
    );
  }
}
