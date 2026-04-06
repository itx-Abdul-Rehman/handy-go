import 'dart:convert';
import 'package:appwrite/appwrite.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../core/appwrite/appwrite_client.dart';
import '../../core/appwrite/appwrite_config.dart';
import '../../domain/repositories/auth_repository.dart';
import '../models/worker_model.dart';

/// Appwrite-based authentication repository for the Worker App.
///
/// Uses email OTP via the `email_otp` Appwrite Function (same as customer app).
/// Uses TablesDB API (new SDK 21.x).
class AppwriteAuthRepository implements AuthRepository {
  final Account _account = AppwriteClient.account;
  final TablesDB _tablesDB = AppwriteClient.tablesDB;
  final Functions _functions = AppwriteClient.functions;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
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

  static const String _pendingOtpIdKey = 'appwrite_pending_otp_id';

  // ============================================================
  // EMAIL OTP FLOW
  // ============================================================

  @override
  Future<Map<String, dynamic>> sendOTP(String email, String purpose) async {
    try {
      final normalizedEmail = email.trim().toLowerCase();

      // Send OTP via the email_otp Appwrite Function
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
        throw Exception(response['error'] as String? ?? 'Failed to send OTP');
      }

      final otpId = response['otpId'] as String? ?? '';
      await _secureStorage.write(key: _pendingOtpIdKey, value: otpId);

      return {
        'success': true,
        'message': response['message'] as String? ?? 'OTP sent successfully',
        'otpId': otpId,
      };
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to send OTP');
    }
  }

  @override
  Future<Map<String, dynamic>> verifyOTP(
    String email,
    String code,
    String purpose,
  ) async {
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
        throw Exception(
          response['error'] as String? ?? 'OTP verification failed',
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
            throw Exception('Failed to create session. Please try again.');
          }
        }
      } else {
        // No session token returned — check if we already have a session
        try {
          await _account.get();
        } catch (_) {
          throw Exception('Authentication failed. Please try again.');
        }
      }

      await _secureStorage.delete(key: _pendingOtpIdKey);

      return {
        'success': true,
        'isNewUser': isNewUser,
        'userId': userId,
        'tempToken': sessionToken ?? userId,
      };
    } on AppwriteException catch (e) {
      throw Exception(_friendlyError(e, 'OTP verification failed'));
    }
  }

  // ============================================================
  // REGISTRATION
  // ============================================================

  @override
  Future<Map<String, dynamic>> registerWorker({
    required String tempToken,
    required String firstName,
    required String lastName,
    String? phone,
    required String password,
    required String cnic,
    required List<SkillModel> skills,
  }) async {
    try {
      // Update name — log failure but don't block registration
      try {
        await _account.updateName(name: '$firstName $lastName');
      } catch (e) {
        debugPrint('Warning: Failed to update name: $e');
      }

      // Set password — CRITICAL: user can't login without this
      try {
        await _account.updatePassword(password: password);
      } on AppwriteException catch (e) {
        // If password update fails with a non-409 error, registration must fail
        if (e.code != 409) {
          throw Exception('Failed to set password. Please try again.');
        }
        // 409 = password already set (e.g., re-registration attempt), OK to continue
      }

      final user = await _account.get();

      // Create worker profile document
      await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workersCollection,
        rowId: user.$id,
        data: {
          'userId': user.$id,
          'firstName': firstName,
          'lastName': lastName,
          'phone': phone ?? '',
          'email': user.email,
          'profileImage': null,
          'cnic': cnic,
          'cnicVerified': false,
          'serviceRadius': 10.0,
          'isAvailable': false,
          'ratingAverage': 0.0,
          'ratingCount': 0,
          'trustScore': 50,
          'totalJobsCompleted': 0,
          'totalEarnings': 0.0,
          'currentLatitude': null,
          'currentLongitude': null,
          'bankAccountTitle': null,
          'bankAccountNumber': null,
          'bankName': null,
          'status': 'PENDING_VERIFICATION',
        },
      );

      // Create skill documents
      for (final skill in skills) {
        await _tablesDB.createRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.workerSkillsCollection,
          rowId: ID.unique(),
          data: {
            'workerId': user.$id,
            'category': skill.category,
            'experience': skill.experience,
            'hourlyRate': skill.hourlyRate,
            'isVerified': false,
          },
        );
      }

      return {
        'success': true,
        'user': {
          '_id': user.$id,
          'role': 'WORKER',
          'phone': phone ?? '',
          'email': user.email,
          'isVerified': user.emailVerification,
          'isActive': true,
        },
        'worker': {
          '_id': user.$id,
          'user': {
            '_id': user.$id,
            'role': 'WORKER',
            'phone': phone ?? '',
            'email': user.email,
            'isVerified': user.emailVerification,
            'isActive': true,
            'createdAt': DateTime.now().toIso8601String(),
            'updatedAt': DateTime.now().toIso8601String(),
          },
          'firstName': firstName,
          'lastName': lastName,
          'cnic': cnic,
          'cnicVerified': false,
          'skills': skills.map((s) => s.toJson()).toList(),
          'serviceRadius': 10.0,
          'availability': {'isAvailable': false, 'schedule': []},
          'rating': {'average': 0, 'count': 0},
          'trustScore': 50,
          'totalJobsCompleted': 0,
          'totalEarnings': 0,
          'status': 'PENDING_VERIFICATION',
          'createdAt': DateTime.now().toIso8601String(),
          'updatedAt': DateTime.now().toIso8601String(),
        },
        'accessToken': '',
        'refreshToken': '',
      };
    } on AppwriteException catch (e) {
      throw Exception(_friendlyError(e, 'Registration failed'));
    }
  }

  // ============================================================
  // EMAIL/PASSWORD LOGIN
  // ============================================================

  @override
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      // Delete stale session
      try {
        await _account.deleteSession(sessionId: 'current');
      } catch (_) {}

      final normalizedEmail = email.trim().toLowerCase();
      await _account.createEmailPasswordSession(
        email: normalizedEmail,
        password: password,
      );
      final user = await _account.get();

      final workerDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workersCollection,
        queries: [Query.equal('userId', user.$id)],
      );

      if (workerDocs.rows.isEmpty) {
        throw Exception('Worker profile not found');
      }

      final w = workerDocs.rows.first.data;

      final skillDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workerSkillsCollection,
        queries: [Query.equal('workerId', user.$id)],
      );

      final skills = skillDocs.rows.map((d) => d.data).toList();

      return {
        'success': true,
        'user': {
          '_id': user.$id,
          'role': 'WORKER',
          'phone': w['phone'] ?? user.phone,
          'email': user.email,
          'isVerified': user.emailVerification,
          'isActive': true,
          'createdAt': user.$createdAt,
          'updatedAt': user.$updatedAt,
        },
        'worker': {
          '_id': user.$id,
          'user': {
            '_id': user.$id,
            'role': 'WORKER',
            'phone': w['phone'] ?? user.phone,
            'email': user.email,
            'isVerified': user.emailVerification,
            'isActive': true,
            'createdAt': user.$createdAt,
            'updatedAt': user.$updatedAt,
          },
          'firstName': w['firstName'] ?? '',
          'lastName': w['lastName'] ?? '',
          'profileImage': w['profileImage'],
          'cnic': w['cnic'] ?? '',
          'cnicVerified': w['cnicVerified'] ?? false,
          'skills': skills,
          'currentLocation': w['currentLatitude'] != null
              ? {'lat': w['currentLatitude'], 'lng': w['currentLongitude']}
              : null,
          'serviceRadius': w['serviceRadius'] ?? 10,
          'availability': {
            'isAvailable': w['isAvailable'] ?? false,
            'schedule': [],
          },
          'rating': {
            'average': w['ratingAverage'] ?? 0,
            'count': w['ratingCount'] ?? 0,
          },
          'trustScore': w['trustScore'] ?? 50,
          'totalJobsCompleted': w['totalJobsCompleted'] ?? 0,
          'totalEarnings': w['totalEarnings'] ?? 0,
          'bankDetails': w['bankAccountTitle'] != null
              ? {
                  'accountTitle': w['bankAccountTitle'],
                  'accountNumber': w['bankAccountNumber'],
                  'bankName': w['bankName'],
                }
              : null,
          'status': w['status'] ?? 'PENDING_VERIFICATION',
          'createdAt': w['\$createdAt'] ?? DateTime.now().toIso8601String(),
          'updatedAt': w['\$updatedAt'] ?? DateTime.now().toIso8601String(),
        },
        'accessToken': '',
        'refreshToken': '',
      };
    } on AppwriteException catch (e) {
      throw Exception(_friendlyError(e, 'Login failed'));
    }
  }

  // ============================================================
  // PASSWORD RESET
  // ============================================================

  @override
  Future<void> forgotPassword(String email) async {
    await sendOTP(email, 'PASSWORD_RESET');
  }

  @override
  Future<void> resetPassword(String tempToken, String newPassword) async {
    try {
      // Use server-side function to reset password (bypasses old password requirement)
      final execution = await _functions.createExecution(
        functionId: AppwriteConfig.emailOtpFunction,
        body: jsonEncode({
          'action': 'reset_password',
          'userId': tempToken,
          'newPassword': newPassword,
        }),
      );

      final response = _parseFunctionResponse(execution.responseBody);
      if (response['success'] != true) {
        throw Exception(
          response['error'] as String? ?? 'Failed to reset password',
        );
      }
    } on AppwriteException catch (e) {
      throw Exception(_friendlyError(e, 'Password reset failed'));
    }
  }

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================

  @override
  Future<bool> isAuthenticated() async {
    try {
      await _account.get();
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _account.deleteSession(sessionId: 'current');
    } catch (_) {}
    await _secureStorage.deleteAll();
  }

  /// Detect blocked/disabled accounts and return a friendly message.
  String _friendlyError(AppwriteException e, String fallback) {
    final msg = (e.message ?? '').toLowerCase();
    if (msg.contains('blocked') ||
        msg.contains('disabled') ||
        e.type == 'user_blocked') {
      return 'This account has been deactivated. Please contact support or register with a different email.';
    }
    return e.message ?? fallback;
  }
}
