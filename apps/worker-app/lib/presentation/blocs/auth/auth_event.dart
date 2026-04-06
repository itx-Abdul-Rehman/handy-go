import 'package:equatable/equatable.dart';
import '../../../data/models/worker_model.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class CheckAuthStatus extends AuthEvent {}

class SendOTPRequested extends AuthEvent {
  final String email;
  final String purpose;

  const SendOTPRequested({required this.email, required this.purpose});

  @override
  List<Object?> get props => [email, purpose];
}

class VerifyOTPRequested extends AuthEvent {
  final String email;
  final String code;
  final String purpose;

  const VerifyOTPRequested({
    required this.email,
    required this.code,
    required this.purpose,
  });

  @override
  List<Object?> get props => [email, code, purpose];
}

class RegisterRequested extends AuthEvent {
  final String tempToken;
  final String firstName;
  final String lastName;
  final String? phone;
  final String password;
  final String cnic;
  final List<SkillModel> skills;

  const RegisterRequested({
    required this.tempToken,
    required this.firstName,
    required this.lastName,
    this.phone,
    required this.password,
    required this.cnic,
    required this.skills,
  });

  @override
  List<Object?> get props => [
    tempToken,
    firstName,
    lastName,
    phone,
    password,
    cnic,
    skills,
  ];
}

class LoginRequested extends AuthEvent {
  final String email;
  final String password;

  const LoginRequested({required this.email, required this.password});

  @override
  List<Object?> get props => [email, password];
}

class LogoutRequested extends AuthEvent {}

/// Dispatched after profile/skills/documents edits to re-fetch
/// the worker profile and update all BlocBuilder consumers.
class RefreshProfile extends AuthEvent {}

class ForgotPasswordRequested extends AuthEvent {
  final String email;

  const ForgotPasswordRequested({required this.email});

  @override
  List<Object?> get props => [email];
}

class ResetPasswordRequested extends AuthEvent {
  final String tempToken;
  final String newPassword;

  const ResetPasswordRequested({
    required this.tempToken,
    required this.newPassword,
  });

  @override
  List<Object?> get props => [tempToken, newPassword];
}
