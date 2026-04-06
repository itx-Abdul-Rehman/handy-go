/// Base exception class
class AppException implements Exception {
  final String message;
  final String? code;

  const AppException({required this.message, this.code});

  @override
  String toString() => message;
}

/// Server exception for API errors
class ServerException extends AppException {
  final int? statusCode;
  final dynamic data;

  const ServerException({
    required super.message,
    super.code,
    this.statusCode,
    this.data,
  });
}

/// Cache exception for local storage errors
class CacheException extends AppException {
  const CacheException({required super.message, super.code});
}

/// Network exception for connectivity issues
class NetworkException extends AppException {
  const NetworkException({
    super.message = 'No internet connection',
    super.code = 'NETWORK_ERROR',
  });
}

/// Authentication exception
class AuthException extends AppException {
  const AuthException({
    super.message = 'Authentication failed',
    super.code = 'AUTH_ERROR',
  });
}

/// Validation exception
class ValidationException extends AppException {
  final Map<String, String>? fieldErrors;

  const ValidationException({
    required super.message,
    super.code = 'VALIDATION_ERROR',
    this.fieldErrors,
  });
}

/// Not found exception
class NotFoundException extends AppException {
  const NotFoundException({
    super.message = 'Resource not found',
    super.code = 'NOT_FOUND',
  });
}

/// Rate limit exception
class RateLimitException extends AppException {
  const RateLimitException({
    super.message = 'Too many requests',
    super.code = 'RATE_LIMIT',
  });
}

/// Permission exception
class PermissionException extends AppException {
  const PermissionException({
    super.message = 'Permission denied',
    super.code = 'PERMISSION_DENIED',
  });
}
