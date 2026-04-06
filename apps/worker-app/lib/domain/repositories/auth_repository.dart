import '../../data/models/worker_model.dart';

/// Abstract contract for authentication operations.
///
/// Concrete implementations live in `data/repositories/`.
/// Depend on this interface (not the concrete class) so that
/// screens and BLoCs stay decoupled from the Appwrite SDK.
abstract class AuthRepository {
  /// Send a one-time password to [email] for the given [purpose].
  ///
  /// Purpose is typically `'REGISTRATION'`, `'LOGIN'`, or `'PASSWORD_RESET'`.
  Future<Map<String, dynamic>> sendOTP(String email, String purpose);

  /// Verify the OTP [code] sent to [email].
  ///
  /// Returns a map with at least `isNewUser` (bool) and `userId` (String).
  Future<Map<String, dynamic>> verifyOTP(
    String email,
    String code,
    String purpose,
  );

  /// Register a new worker account after OTP verification.
  ///
  /// Returns the created worker data including user + worker profile.
  Future<Map<String, dynamic>> registerWorker({
    required String tempToken,
    required String firstName,
    required String lastName,
    String? phone,
    required String password,
    required String cnic,
    required List<SkillModel> skills,
  });

  /// Log in with [email] and [password].
  ///
  /// Returns session info / tokens.
  Future<Map<String, dynamic>> login(String email, String password);

  /// Initiate the forgot-password flow for [email].
  Future<void> forgotPassword(String email);

  /// Reset the password using a [tempToken] obtained from OTP verification.
  Future<void> resetPassword(String tempToken, String newPassword);

  /// Returns `true` when a valid session / token exists locally.
  Future<bool> isAuthenticated();

  /// Destroy the current session and clear stored credentials.
  Future<void> logout();
}
