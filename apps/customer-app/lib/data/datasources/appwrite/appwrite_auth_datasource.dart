import 'dart:convert';
import 'package:appwrite/appwrite.dart';
import 'package:appwrite/models.dart' as models;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../models/auth_response_model.dart';
import '../../models/user_model.dart';
import '../../../core/appwrite/appwrite_client.dart';
import '../../../core/appwrite/appwrite_config.dart';
import '../../../core/error/exceptions.dart';
import '../remote/auth_remote_datasource.dart';

/// Appwrite-based authentication data source.
///
/// Sends OTPs via the custom `email_otp` Appwrite Function which delivers
/// emails through the Resend SDK. Gives full control over email templates,
/// rate limiting, and branding.
class AppwriteAuthDataSource implements AuthRemoteDataSource {
  final Account _account;
  final TablesDB _tablesDB;
  final Functions _functions;
  final FlutterSecureStorage _secureStorage;

  /// Keys for persisting pending OTP state across app restarts
  static const String _pendingOtpIdKey = 'appwrite_pending_otp_id';

  AppwriteAuthDataSource({
    Account? account,
    TablesDB? tablesDB,
    Functions? functions,
    FlutterSecureStorage? secureStorage,
  }) : _account = account ?? AppwriteClient.account,
       _tablesDB = tablesDB ?? AppwriteClient.tablesDB,
       _functions = functions ?? AppwriteClient.functions,
       _secureStorage =
           secureStorage ??
           const FlutterSecureStorage(
             aOptions: AndroidOptions(encryptedSharedPreferences: true),
           );

  /// Safely parse a function execution response body into a Map.
  /// Returns an error map if parsing fails or response is not a Map.
  Map<String, dynamic> _parseFunctionResponse(String responseBody) {
    try {
      final decoded = jsonDecode(responseBody);
      if (decoded is Map<String, dynamic>) return decoded;
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
      return {
        'success': false,
        'error': 'Unexpected response format: $decoded',
      };
    } on FormatException {
      return {
        'success': false,
        'error': 'Invalid response from server: $responseBody',
      };
    }
  }

  // ============================================================
  // EMAIL OTP FLOW
  // ============================================================

  @override
  Future<OTPSendResponse> sendOTP({
    required String email,
    required String purpose,
  }) async {
    try {
      final normalizedEmail = email.trim().toLowerCase();

      final execution = await _functions.createExecution(
        functionId: AppwriteConfig.emailOtpFunction,
        body: jsonEncode({
          'action': 'send_otp',
          'email': normalizedEmail,
          'purpose': purpose,
        }),
      );

      final response = _parseFunctionResponse(execution.responseBody);

      if (response['success'] != true) {
        throw AuthException(
          message: response['error'] as String? ?? 'Failed to send OTP',
        );
      }

      final otpId = response['otpId'] as String? ?? '';
      await _secureStorage.write(key: _pendingOtpIdKey, value: otpId);

      return OTPSendResponse(
        success: true,
        message: response['message'] as String? ?? 'OTP sent successfully',
        otpId: otpId,
      );
    } on AppwriteException catch (e) {
      throw _handleAppwriteError(e);
    }
  }

  @override
  Future<OTPVerificationResult> verifyOTP({
    required String email,
    required String code,
    required String purpose,
  }) async {
    try {
      final normalizedEmail = email.trim().toLowerCase();

      // Verify via the email_otp function
      final execution = await _functions.createExecution(
        functionId: AppwriteConfig.emailOtpFunction,
        body: jsonEncode({
          'action': 'verify_otp',
          'email': normalizedEmail,
          'code': code,
          'purpose': purpose,
        }),
      );

      final response = _parseFunctionResponse(execution.responseBody);

      if (response['success'] != true) {
        throw AuthException(
          message: response['error'] as String? ?? 'OTP verification failed',
        );
      }

      final userId = response['userId'] as String? ?? '';
      final isNewUser = response['isNewUser'] as bool? ?? true;
      final sessionToken = response['sessionToken'] as String?;

      // Create a client session using the token from the function
      if (sessionToken != null && sessionToken.isNotEmpty) {
        try {
          await _account.createSession(userId: userId, secret: sessionToken);
        } on AppwriteException catch (e) {
          debugPrint('Session creation from token failed: ${e.message}');
          // If there's already an active session, try to continue
          try {
            await _account.get();
            debugPrint('Found existing active session, continuing...');
          } catch (_) {
            // No session at all — must fail so the UI shows an error
            throw AuthException(
              message: 'Failed to create session. Please try again.',
            );
          }
        }
      } else {
        // No session token returned — check if we already have a session
        try {
          await _account.get();
        } catch (_) {
          throw const AuthException(
            message: 'Authentication failed. Please try again.',
          );
        }
      }

      // Clean up stored OTP ID
      await _secureStorage.delete(key: _pendingOtpIdKey);

      return OTPVerificationResult(
        isNewUser: isNewUser,
        tempToken: sessionToken ?? userId,
      );
    } on AppwriteException catch (e) {
      throw _handleAppwriteError(e);
    }
  }

  // ============================================================
  // REGISTRATION
  // ============================================================

  @override
  Future<AuthResponse> register({
    required String tempToken,
    required String firstName,
    required String lastName,
    String? phone,
    required String password,
  }) async {
    try {
      // Get the current user (set during OTP verification)
      final user = await _account.get();

      // Update the user's name
      try {
        await _account.updateName(name: '$firstName $lastName');
      } catch (_) {
        // May fail if name is already set; safe to ignore
      }

      // Set password for future email/password login
      try {
        await _account.updatePassword(password: password);
      } catch (_) {
        // May fail if password already set without providing old password
      }

      // Create customer profile in database
      final customerDoc = await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customersCollection,
        rowId: ID.unique(),
        data: {
          'userId': user.$id,
          'firstName': firstName,
          'lastName': lastName,
          'phone': phone ?? '',
          'email': user.email,
          'preferredLanguage': 'en',
          'totalBookings': 0,
        },
      );

      // Re-fetch user to get updated name/email
      final updatedUser = await _account.get();

      return AuthResponse(
        user: _buildUserModel(updatedUser, customerDoc),
        accessToken: 'appwrite_session_active',
        refreshToken: 'appwrite_session_active',
      );
    } on AppwriteException catch (e) {
      throw _handleAppwriteError(e);
    }
  }

  // ============================================================
  // EMAIL/PASSWORD LOGIN
  // ============================================================

  @override
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      // Try to delete any stale session first
      try {
        await _account.deleteSession(sessionId: 'current');
      } catch (_) {}

      final normalizedEmail = email.trim().toLowerCase();

      await _account.createEmailPasswordSession(
        email: normalizedEmail,
        password: password,
      );

      final user = await _account.get();

      // Fetch customer profile
      final customerDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customersCollection,
        queries: [Query.equal('userId', user.$id)],
      );

      models.Row? customerDoc;
      if (customerDocs.rows.isNotEmpty) {
        customerDoc = customerDocs.rows.first;
      }

      return AuthResponse(
        user: _buildUserModel(user, customerDoc),
        accessToken: 'appwrite_session_active',
        refreshToken: 'appwrite_session_active',
      );
    } on AppwriteException catch (e) {
      throw _handleAppwriteError(e);
    }
  }

  // ============================================================
  // TOKEN REFRESH (Appwrite handles this automatically)
  // ============================================================

  @override
  Future<AuthResponse> refreshToken({required String refreshToken}) async {
    try {
      final user = await _account.get();

      final customerDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customersCollection,
        queries: [Query.equal('userId', user.$id)],
      );

      models.Row? customerDoc;
      if (customerDocs.rows.isNotEmpty) {
        customerDoc = customerDocs.rows.first;
      }

      return AuthResponse(
        user: _buildUserModel(user, customerDoc),
        accessToken: 'appwrite_session_active',
        refreshToken: 'appwrite_session_active',
      );
    } on AppwriteException catch (e) {
      throw _handleAppwriteError(e);
    }
  }

  // ============================================================
  // PASSWORD RESET
  // ============================================================

  @override
  Future<OTPSendResponse> forgotPassword({required String email}) async {
    try {
      return sendOTP(email: email, purpose: 'PASSWORD_RESET');
    } on AppwriteException catch (e) {
      throw _handleAppwriteError(e);
    }
  }

  @override
  Future<void> resetPassword({
    required String tempToken,
    required String newPassword,
  }) async {
    try {
      // Get the current user's ID from the active session
      final user = await _account.get();
      final userId = user.$id;

      // Use server-side function to reset password (bypasses old password requirement)
      final execution = await _functions.createExecution(
        functionId: AppwriteConfig.emailOtpFunction,
        body: jsonEncode({
          'action': 'reset_password',
          'userId': userId,
          'newPassword': newPassword,
        }),
      );

      final response = _parseFunctionResponse(execution.responseBody);
      if (response['success'] != true) {
        throw AuthException(
          message: response['error'] as String? ?? 'Failed to reset password',
        );
      }
    } on AppwriteException catch (e) {
      throw _handleAppwriteError(e);
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  Future<void> logout() async {
    try {
      await _account.deleteSession(sessionId: 'current');
    } on AppwriteException catch (e) {
      throw _handleAppwriteError(e);
    }
  }

  Future<void> logoutAll() async {
    try {
      await _account.deleteSessions();
    } on AppwriteException catch (e) {
      throw _handleAppwriteError(e);
    }
  }

  Future<bool> isLoggedIn() async {
    try {
      await _account.get();
      return true;
    } catch (_) {
      return false;
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  UserModel _buildUserModel(models.User user, models.Row? customerDoc) {
    CustomerModel? customer;
    if (customerDoc != null) {
      customer = CustomerModel(
        id: customerDoc.$id,
        firstName: customerDoc.data['firstName'] ?? '',
        lastName: customerDoc.data['lastName'] ?? '',
        profileImage: customerDoc.data['profileImage'],
        preferredLanguage: customerDoc.data['preferredLanguage'] ?? 'en',
        totalBookings: customerDoc.data['totalBookings'] ?? 0,
      );
    }

    return UserModel(
      id: user.$id,
      role: UserRole.customer,
      email: user.email,
      phone: user.phone.isNotEmpty ? user.phone : null,
      isVerified: user.emailVerification,
      isActive: user.status,
      customer: customer,
      createdAt: DateTime.tryParse(user.registration),
    );
  }

  Exception _handleAppwriteError(AppwriteException e) {
    final code = e.code;
    final message = e.message ?? 'An error occurred';
    final type = e.type ?? '';

    // Detect blocked/disabled user
    if (message.toLowerCase().contains('blocked') ||
        message.toLowerCase().contains('disabled') ||
        type == 'user_blocked') {
      return const AuthException(
        message:
            'This account has been deactivated. '
            'Please contact support or register with a different email.',
      );
    }

    if (code == 401) {
      return AuthException(message: message);
    } else if (code == 400) {
      return ValidationException(message: message);
    } else if (code == 404) {
      return NotFoundException(message: message);
    } else if (code == 429) {
      return const RateLimitException(
        message: 'Too many requests. Please wait.',
      );
    } else if (code != null && code >= 500) {
      return ServerException(message: message);
    }

    return ServerException(message: message);
  }
}
