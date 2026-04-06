/// Validation utilities for form fields
class Validators {
  Validators._();

  /// Validate phone number (Pakistan format)
  static String? phone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }

    // Remove any non-digit characters except +
    final cleaned = value.replaceAll(RegExp(r'[^\d+]'), '');

    // Check for Pakistan format
    // Valid formats: +923XXXXXXXXX, 03XXXXXXXXX, 3XXXXXXXXX
    final patterns = [
      RegExp(r'^\+923[0-9]{9}$'),    // +923XXXXXXXXX
      RegExp(r'^03[0-9]{9}$'),        // 03XXXXXXXXX
      RegExp(r'^3[0-9]{9}$'),         // 3XXXXXXXXX
    ];

    final isValid = patterns.any((pattern) => pattern.hasMatch(cleaned));

    if (!isValid) {
      return 'Please enter a valid Pakistan phone number';
    }

    return null;
  }

  /// Validate email
  static String? email(String? value, {bool required = false}) {
    if (value == null || value.isEmpty) {
      return required ? 'Email is required' : null;
    }

    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );

    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email address';
    }

    return null;
  }

  /// Validate password
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }

    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (!value.contains(RegExp(r'[A-Z]'))) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!value.contains(RegExp(r'[0-9]'))) {
      return 'Password must contain at least one number';
    }

    if (!value.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) {
      return 'Password must contain at least one special character';
    }

    return null;
  }

  /// Validate confirm password
  static String? confirmPassword(String? value, String? password) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }

    if (value != password) {
      return 'Passwords do not match';
    }

    return null;
  }

  /// Validate required field
  static String? required(String? value, {String? fieldName}) {
    if (value == null || value.trim().isEmpty) {
      return '${fieldName ?? 'This field'} is required';
    }
    return null;
  }

  /// Validate name (first name, last name)
  static String? name(String? value, {String fieldName = 'Name'}) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }

    if (value.trim().length < 2) {
      return '$fieldName must be at least 2 characters';
    }

    if (value.trim().length > 50) {
      return '$fieldName must not exceed 50 characters';
    }

    if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(value)) {
      return '$fieldName can only contain letters';
    }

    return null;
  }

  /// Validate CNIC (Pakistan National ID)
  static String? cnic(String? value) {
    if (value == null || value.isEmpty) {
      return 'CNIC is required';
    }

    // Remove dashes
    final cleaned = value.replaceAll('-', '');

    // CNIC should be 13 digits
    if (cleaned.length != 13 || !RegExp(r'^\d{13}$').hasMatch(cleaned)) {
      return 'Please enter a valid CNIC (XXXXX-XXXXXXX-X)';
    }

    return null;
  }

  /// Validate OTP
  static String? otp(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter the OTP';
    }

    if (value.length != 6 || !RegExp(r'^\d{6}$').hasMatch(value)) {
      return 'Please enter a valid 6-digit OTP';
    }

    return null;
  }

  /// Validate minimum length
  static String? minLength(String? value, int minLength, {String? fieldName}) {
    if (value == null || value.length < minLength) {
      return '${fieldName ?? 'This field'} must be at least $minLength characters';
    }
    return null;
  }

  /// Validate maximum length
  static String? maxLength(String? value, int maxLength, {String? fieldName}) {
    if (value != null && value.length > maxLength) {
      return '${fieldName ?? 'This field'} must not exceed $maxLength characters';
    }
    return null;
  }
}
