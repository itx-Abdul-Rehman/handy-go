import 'package:flutter/material.dart';

class AppColors {
  // Primary Colors - Worker theme (Green for trust/growth)
  static const Color primary = Color(0xFF4CAF50);
  static const Color primaryLight = Color(0xFF81C784);
  static const Color primaryDark = Color(0xFF388E3C);

  // Secondary Colors
  static const Color secondary = Color(0xFF2196F3);
  static const Color secondaryLight = Color(0xFF64B5F6);
  static const Color secondaryDark = Color(0xFF1976D2);

  // Accent Colors
  static const Color accent = Color(0xFFFF9800);
  static const Color accentLight = Color(0xFFFFB74D);
  static const Color accentDark = Color(0xFFF57C00);

  // Status Colors
  static const Color success = Color(0xFF43A047);
  static const Color warning = Color(0xFFFFA726);
  static const Color error = Color(0xFFE53935);
  static const Color info = Color(0xFF29B6F6);

  // Background Colors
  static const Color background = Color(0xFFF5F5F5);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF0F0F0);
  static const Color scaffoldBackground = Color(0xFFFAFAFA);

  // Text Colors (tuned for WCAG AA contrast on white/light backgrounds)
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF616161); // 5.91:1 on white ✓
  static const Color textHint = Color(
    0xFF949494,
  ); // 3.03:1 on white — meets placeholder 3:1
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // Border Colors
  static const Color border = Color(0xFFE0E0E0);
  static const Color divider = Color(0xFFEEEEEE);
  static const Color disabled = Color(0xFFBDBDBD);

  // Booking Status Colors
  static const Color statusPending = Color(0xFFFFA726);
  static const Color statusAccepted = Color(0xFF42A5F5);
  static const Color statusInProgress = Color(0xFF7E57C2);
  static const Color statusCompleted = Color(0xFF66BB6A);
  static const Color statusCancelled = Color(0xFFEF5350);

  // Rating Star Color
  static const Color starActive = Color(0xFFFFD700);
  static const Color starInactive = Color(0xFFE0E0E0);

  // Trust Score Colors
  static Color getTrustScoreColor(int score) {
    if (score >= 80) return const Color(0xFF43A047);
    if (score >= 60) return const Color(0xFF66BB6A);
    if (score >= 40) return const Color(0xFFFFA726);
    return const Color(0xFFE53935);
  }

  // Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryDark],
  );

  static const LinearGradient earningsGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF4CAF50), Color(0xFF2E7D32)],
  );

  // Shadows
  static const Color shadow = Color(0x1A000000);
  static const Color shadowLight = Color(0x0D000000);
}
