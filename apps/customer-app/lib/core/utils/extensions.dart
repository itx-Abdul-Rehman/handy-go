import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';

/// Extension methods for String
extension StringExtension on String {
  /// Capitalize the first letter
  String get capitalize {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }

  /// Capitalize each word
  String get titleCase {
    if (isEmpty) return this;
    return split(' ').map((word) => word.capitalize).join(' ');
  }

  /// Check if string is a valid email
  bool get isValidEmail {
    return RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    ).hasMatch(this);
  }

  /// Check if string is a valid phone number
  bool get isValidPhone {
    final cleaned = replaceAll(RegExp(r'[^\d+]'), '');
    return RegExp(r'^(\+92|0)?3[0-9]{9}$').hasMatch(cleaned);
  }

  /// Format phone number for display
  String get formattedPhone {
    final cleaned = replaceAll(RegExp(r'[^\d]'), '');
    if (cleaned.length == 10) {
      return '${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}';
    } else if (cleaned.length == 11 && cleaned.startsWith('0')) {
      return '${cleaned.substring(0, 4)}-${cleaned.substring(4, 7)}-${cleaned.substring(7)}';
    }
    return this;
  }

  /// Truncate string with ellipsis
  String truncate(int maxLength, {String ellipsis = '...'}) {
    if (length <= maxLength) return this;
    return '${substring(0, maxLength - ellipsis.length)}$ellipsis';
  }
}

/// Extension methods for DateTime
extension DateTimeExtension on DateTime {
  /// Format as 'Jan 1, 2024'
  String get formattedDate {
    return DateFormat('MMM d, yyyy').format(this);
  }

  /// Format as '1:30 PM'
  String get formattedTime {
    return DateFormat('h:mm a').format(this);
  }

  /// Format as 'Jan 1, 2024 at 1:30 PM'
  String get formattedDateTime {
    return DateFormat('MMM d, yyyy \'at\' h:mm a').format(this);
  }

  /// Format as 'Today', 'Yesterday', or date
  String get relativeDate {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final date = DateTime(year, month, day);

    final difference = today.difference(date).inDays;

    if (difference == 0) return 'Today';
    if (difference == 1) return 'Yesterday';
    if (difference < 7) return DateFormat('EEEE').format(this);
    return formattedDate;
  }

  /// Format as relative time (e.g., '5 minutes ago')
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(this);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      final minutes = difference.inMinutes;
      return '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays < 7) {
      final days = difference.inDays;
      return '$days ${days == 1 ? 'day' : 'days'} ago';
    } else {
      return formattedDate;
    }
  }

  /// Check if same day
  bool isSameDay(DateTime other) {
    return year == other.year && month == other.month && day == other.day;
  }
}

/// Extension methods for num (int, double)
extension NumExtension on num {
  /// Format as currency (PKR)
  String get toCurrency {
    final formatter = NumberFormat.currency(
      locale: 'en_PK',
      symbol: 'Rs. ',
      decimalDigits: 0,
    );
    return formatter.format(this);
  }

  /// Format with commas
  String get formatted {
    final formatter = NumberFormat('#,###');
    return formatter.format(this);
  }

  /// Format as compact (e.g., 1.2K, 3.5M)
  String get compact {
    final formatter = NumberFormat.compact();
    return formatter.format(this);
  }
}

/// Extension methods for Duration
extension DurationExtension on Duration {
  /// Format as 'Xh Ym'
  String get formatted {
    final hours = inHours;
    final minutes = inMinutes.remainder(60);

    if (hours > 0 && minutes > 0) {
      return '${hours}h ${minutes}m';
    } else if (hours > 0) {
      return '${hours}h';
    } else {
      return '${minutes}m';
    }
  }

  /// Format as 'X hours Y minutes'
  String get formattedLong {
    final hours = inHours;
    final minutes = inMinutes.remainder(60);

    final parts = <String>[];
    if (hours > 0) {
      parts.add('$hours ${hours == 1 ? 'hour' : 'hours'}');
    }
    if (minutes > 0) {
      parts.add('$minutes ${minutes == 1 ? 'minute' : 'minutes'}');
    }

    return parts.isEmpty ? '0 minutes' : parts.join(' ');
  }
}

/// Extension methods for BuildContext
extension ContextExtension on BuildContext {
  /// Get screen width
  double get screenWidth => MediaQuery.of(this).size.width;

  /// Get screen height
  double get screenHeight => MediaQuery.of(this).size.height;

  /// Get safe area padding
  EdgeInsets get safeAreaPadding => MediaQuery.of(this).padding;

  /// Get theme
  ThemeData get theme => Theme.of(this);

  /// Get text theme
  TextTheme get textTheme => Theme.of(this).textTheme;

  /// Get color scheme
  ColorScheme get colorScheme => Theme.of(this).colorScheme;

  /// Check if keyboard is visible
  bool get isKeyboardVisible => MediaQuery.of(this).viewInsets.bottom > 0;

  /// Show snackbar with configurable duration
  /// Default duration is 3 seconds for short messages, 5 seconds for longer ones
  void showSnackBar(
    String message, {
    bool isError = false,
    bool isSuccess = false,
    Duration? duration,
  }) {
    // Auto-calculate duration based on message length if not specified
    final effectiveDuration =
        duration ??
        Duration(milliseconds: (message.length * 50).clamp(2000, 5000));

    ScaffoldMessenger.of(
      this,
    ).clearSnackBars(); // Clear existing snackbars first
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError
            ? theme.colorScheme.error
            : isSuccess
            ? AppColors.secondary
            : null,
        duration: effectiveDuration,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  /// Navigate to a route
  Future<T?> push<T>(Widget page) {
    return Navigator.of(this).push<T>(MaterialPageRoute(builder: (_) => page));
  }

  /// Navigate and replace current route
  Future<T?> pushReplacement<T>(Widget page) {
    return Navigator.of(
      this,
    ).pushReplacement(MaterialPageRoute(builder: (_) => page));
  }

  /// Navigate and remove all previous routes
  Future<T?> pushAndRemoveAll<T>(Widget page) {
    return Navigator.of(
      this,
    ).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => page), (_) => false);
  }

  /// Pop current route
  void pop<T>([T? result]) {
    Navigator.of(this).pop(result);
  }
}

/// Extension methods for List
extension ListExtension<T> on List<T> {
  /// Get first element or null
  T? get firstOrNull => isEmpty ? null : first;

  /// Get last element or null
  T? get lastOrNull => isEmpty ? null : last;

  /// Get element at index or null
  T? elementAtOrNull(int index) {
    if (index < 0 || index >= length) return null;
    return this[index];
  }
}
