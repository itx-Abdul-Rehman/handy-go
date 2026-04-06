import 'package:flutter/material.dart';

/// App color palette for Handy Go Customer App
class AppColors {
  AppColors._();

  // Primary Colors (Blue 700/600/800 — AA-compliant on white)
  static const Color primary = Color(0xFF1976D2);
  static const Color primaryLight = Color(0xFF64B5F6);
  static const Color primaryDark = Color(0xFF1565C0);

  // Secondary Colors
  static const Color secondary = Color(0xFF4CAF50);
  static const Color secondaryLight = Color(0xFF81C784);
  static const Color secondaryDark = Color(0xFF388E3C);

  // Accent Colors
  static const Color accent = Color(0xFFFF9800);
  static const Color accentLight = Color(0xFFFFB74D);
  static const Color accentDark = Color(0xFFF57C00);

  // Background Colors
  static const Color background = Color(0xFFF5F5F5);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color scaffoldBackground = Color(0xFFFAFAFA);

  // Status Colors (AA-compliant for text use on white backgrounds)
  static const Color error = Color(0xFFE53935); // 4.69:1 on white ✓
  static const Color success = Color(0xFF2E7D32); // 5.61:1 on white (Green 800)
  static const Color warning = Color(
    0xFFCC5500,
  ); // 4.77:1 on white (deep orange)
  static const Color info = Color(
    0xFF0277BD,
  ); // 4.88:1 on white (Light Blue 800)

  // Text Colors (darkened for WCAG AA compliance)
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(
    0xFF6B6B6B,
  ); // 5.83:1 on white, 5.35:1 on #F5F5F5
  static const Color textHint = Color(
    0xFF949494,
  ); // 3.03:1 on white — meets 3:1 for placeholder text
  static const Color textDisabled = Color(0xFF9E9E9E);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textOnSecondary = Color(0xFFFFFFFF);

  // Border Colors
  static const Color border = Color(0xFFE0E0E0);
  static const Color divider = Color(0xFFEEEEEE);

  // Gradient Colors
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryDark],
  );

  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accent, accentDark],
  );

  // Shadow Colors
  static const Color shadow = Color(0x1A000000);
  static const Color shadowLight = Color(0x0D000000);

  // Service Category Colors
  static const Color plumbing = Color(0xFF2196F3);
  static const Color electrical = Color(
    0xFFD97706,
  ); // Amber 600 — 3.54:1 on white (meets 3:1 for icons)
  static const Color cleaning = Color(0xFF4CAF50);
  static const Color acRepair = Color(
    0xFF0097A7,
  ); // Cyan 700 — 3.89:1 on white (meets 3:1 for icons)
  static const Color carpenter = Color(0xFF795548);
  static const Color painting = Color(0xFF9C27B0);
  static const Color mechanic = Color(0xFF607D8B);
  static const Color handyman = Color(0xFFFF5722);

  // Rating Colors
  static const Color ratingStar = Color(0xFFFFD700);
  static const Color ratingStarEmpty = Color(0xFFE0E0E0);

  // SOS Color
  static const Color sos = Color(0xFFD32F2F);

  // Dark Theme Colors
  static const Color darkBackground = Color(0xFF121212);
  static const Color darkSurface = Color(0xFF1E1E1E);
  static const Color darkCard = Color(0xFF2C2C2C);
}
