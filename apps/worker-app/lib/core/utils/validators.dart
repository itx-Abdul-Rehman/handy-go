class Validators {
  // Pakistan Phone Number: +92 3XX-XXXXXXX
  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }

    // Remove any formatting
    final cleaned = value.replaceAll(RegExp(r'[\s\-\(\)]'), '');

    // Check for Pakistan number formats
    final pakRegex = RegExp(r'^(\+92|0)?3[0-9]{9}$');

    if (!pakRegex.hasMatch(cleaned)) {
      return 'Enter a valid Pakistan phone number';
    }

    return null;
  }

  // CNIC: XXXXX-XXXXXXX-X
  static String? validateCNIC(String? value) {
    if (value == null || value.isEmpty) {
      return 'CNIC is required';
    }

    final cleaned = value.replaceAll('-', '');

    if (cleaned.length != 13 || !RegExp(r'^[0-9]+$').hasMatch(cleaned)) {
      return 'Enter a valid 13-digit CNIC';
    }

    return null;
  }

  // Email
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Email is optional
    }

    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );

    if (!emailRegex.hasMatch(value)) {
      return 'Enter a valid email address';
    }

    return null;
  }

  // Password: min 8 chars, 1 uppercase, 1 number, 1 special char
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }

    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!RegExp(r'[0-9]').hasMatch(value)) {
      return 'Password must contain at least one number';
    }

    if (!RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(value)) {
      return 'Password must contain at least one special character';
    }

    return null;
  }

  // Confirm Password
  static String? validateConfirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }

    if (value != password) {
      return 'Passwords do not match';
    }

    return null;
  }

  // Required Field
  static String? validateRequired(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  // OTP
  static String? validateOTP(String? value) {
    if (value == null || value.isEmpty) {
      return 'OTP is required';
    }

    if (value.length != 6 || !RegExp(r'^[0-9]+$').hasMatch(value)) {
      return 'Enter a valid 6-digit OTP';
    }

    return null;
  }

  // Hourly Rate
  static String? validateHourlyRate(String? value) {
    if (value == null || value.isEmpty) {
      return 'Hourly rate is required';
    }

    final rate = double.tryParse(value);
    if (rate == null || rate <= 0) {
      return 'Enter a valid hourly rate';
    }

    if (rate < 100) {
      return 'Minimum hourly rate is Rs. 100';
    }

    return null;
  }

  // Years of Experience
  static String? validateExperience(String? value) {
    if (value == null || value.isEmpty) {
      return 'Experience is required';
    }

    final years = int.tryParse(value);
    if (years == null || years < 0) {
      return 'Enter valid years of experience';
    }

    if (years > 50) {
      return 'Experience seems too high';
    }

    return null;
  }
}
