import 'package:equatable/equatable.dart';
import '../../../data/models/worker_model.dart';

abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class OTPSent extends AuthState {
  final String email;
  final String purpose;

  const OTPSent({required this.email, required this.purpose});

  @override
  List<Object?> get props => [email, purpose];
}

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

class Authenticated extends AuthState {
  final WorkerModel worker;

  const Authenticated({required this.worker});

  @override
  List<Object?> get props => [worker];
}

class Unauthenticated extends AuthState {}

class PasswordResetSuccess extends AuthState {
  const PasswordResetSuccess();
}

class AuthError extends AuthState {
  final String message;

  const AuthError({required this.message});

  @override
  List<Object?> get props => [message];
}
