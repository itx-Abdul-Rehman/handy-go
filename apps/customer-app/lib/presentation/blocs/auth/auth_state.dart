import 'package:equatable/equatable.dart';
import '../../../data/models/user_model.dart';

/// Base auth state
abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

/// Initial state before checking auth status
class AuthInitial extends AuthState {
  const AuthInitial();
}

/// Loading state during auth operations
class AuthLoading extends AuthState {
  final String? message;

  const AuthLoading({this.message});

  @override
  List<Object?> get props => [message];
}

/// OTP sent successfully
class OTPSent extends AuthState {
  final String email;
  final String purpose;

  const OTPSent({required this.email, required this.purpose});

  @override
  List<Object?> get props => [email, purpose];
}

/// OTP verified successfully
class OTPVerified extends AuthState {
  final bool isNewUser;
  final String tempToken;
  final String email;

  const OTPVerified({
    required this.isNewUser,
    required this.tempToken,
    required this.email,
  });

  @override
  List<Object?> get props => [isNewUser, tempToken, email];
}

/// User is authenticated
class Authenticated extends AuthState {
  final UserModel user;

  const Authenticated({required this.user});

  @override
  List<Object?> get props => [user];
}

/// User is not authenticated
class Unauthenticated extends AuthState {
  final bool isFirstTime;

  const Unauthenticated({this.isFirstTime = false});

  @override
  List<Object?> get props => [isFirstTime];
}

/// Password reset successful
class PasswordResetSuccess extends AuthState {
  const PasswordResetSuccess();
}

/// Auth error state
class AuthError extends AuthState {
  final String message;
  final String? errorCode;

  const AuthError({required this.message, this.errorCode});

  @override
  List<Object?> get props => [message, errorCode];
}
