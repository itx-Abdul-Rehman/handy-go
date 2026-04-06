/// Maps raw exception messages to user-friendly error strings.
///
/// Use in BLoCs before emitting error states to prevent leaking
/// internal error details (Appwrite messages, stack traces, etc.) to the UI.
class ErrorMapper {
  ErrorMapper._();

  /// Convert any exception/error to a user-friendly message.
  static String toUserMessage(Object error) {
    final raw = _extractMessage(error);
    final lower = raw.toLowerCase();

    // Blocked / disabled account
    if (lower.contains('blocked') ||
        lower.contains('disabled') ||
        lower.contains('deactivated')) {
      return 'This account has been deactivated. Please contact support or register with a different email.';
    }

    // Network / connectivity
    if (lower.contains('socketexception') ||
        lower.contains('connection refused') ||
        lower.contains('network is unreachable') ||
        lower.contains('no internet') ||
        lower.contains('failed host lookup') ||
        lower.contains('timeout')) {
      return 'No internet connection. Please check your network and try again.';
    }

    // Authentication errors
    if (lower.contains('invalid credentials') ||
        lower.contains('unauthorized') ||
        lower.contains('wrong password') ||
        lower.contains('invalid password')) {
      return 'Invalid email or password. Please try again.';
    }

    if (lower.contains('user not found') || lower.contains('user_not_found')) {
      return 'No account found with this email. Please register first.';
    }

    if (lower.contains('already exists') ||
        lower.contains('already registered') ||
        lower.contains('user_already_exists')) {
      return 'An account with this email already exists. Please log in instead.';
    }

    if (lower.contains('invalid otp') ||
        lower.contains('otp expired') ||
        lower.contains('invalid code') ||
        lower.contains('verification failed')) {
      return 'Invalid or expired verification code. Please try again.';
    }

    if (lower.contains('too many') || lower.contains('rate limit')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }

    // Permission errors
    if (lower.contains('permission') ||
        lower.contains('forbidden') ||
        lower.contains('not allowed')) {
      return 'You don\'t have permission to perform this action.';
    }

    // Not found
    if (lower.contains('not found') || lower.contains('document_not_found')) {
      return 'The requested item was not found.';
    }

    // Server errors
    if (lower.contains('internal server') ||
        lower.contains('server error') ||
        lower.contains('500')) {
      return 'Server error. Please try again later.';
    }

    // If the message is already short and doesn't look like an internal error,
    // pass it through (e.g., "OTP sent successfully")
    if (raw.length < 80 &&
        !lower.contains('exception') &&
        !lower.contains('error:') &&
        !lower.contains('null') &&
        !lower.contains('type \'')) {
      return raw;
    }

    // Default fallback
    return 'Something went wrong. Please try again.';
  }

  static String _extractMessage(Object error) {
    final str = error.toString();
    // Remove "Exception: " prefix
    if (str.startsWith('Exception: ')) {
      return str.substring(11);
    }
    return str;
  }
}
