import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/utils/error_mapper.dart';
import '../../../core/services/location_service.dart';
import '../../../data/repositories/appwrite_auth_repository.dart';
import '../../../data/repositories/appwrite_worker_repository.dart';
import '../../../data/models/worker_model.dart';
import 'auth_event.dart';
import 'auth_state.dart';

/// AuthBloc for Appwrite backend.
///
/// Uses [AppwriteAuthRepository] and [AppwriteWorkerRepository]
/// to authenticate workers via email OTP.
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AppwriteAuthRepository _authRepository;
  final AppwriteWorkerRepository _workerRepository;

  AuthBloc({
    AppwriteAuthRepository? authRepository,
    AppwriteWorkerRepository? workerRepository,
  }) : _authRepository = authRepository ?? AppwriteAuthRepository(),
       _workerRepository = workerRepository ?? AppwriteWorkerRepository(),
       super(AuthInitial()) {
    on<CheckAuthStatus>(_onCheckAuthStatus);
    on<SendOTPRequested>(_onSendOTP);
    on<VerifyOTPRequested>(_onVerifyOTP);
    on<RegisterRequested>(_onRegister);
    on<LoginRequested>(_onLogin);
    on<LogoutRequested>(_onLogout);
    on<RefreshProfile>(_onRefreshProfile);
    on<ForgotPasswordRequested>(_onForgotPassword);
    on<ResetPasswordRequested>(_onResetPassword);
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final isAuthenticated = await _authRepository.isAuthenticated();
      if (isAuthenticated) {
        final worker = await _workerRepository.getProfile();
        emit(Authenticated(worker: worker));
      } else {
        emit(Unauthenticated());
      }
    } catch (e) {
      emit(Unauthenticated());
    }
  }

  Future<void> _onSendOTP(
    SendOTPRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await _authRepository.sendOTP(event.email, event.purpose);
      emit(OTPSent(email: event.email, purpose: event.purpose));
    } catch (e) {
      emit(AuthError(message: ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onVerifyOTP(
    VerifyOTPRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final response = await _authRepository.verifyOTP(
        event.email,
        event.code,
        event.purpose,
      );
      emit(
        OTPVerified(
          isNewUser: response['isNewUser'] ?? true,
          tempToken: response['userId'] ?? '',
          email: event.email,
        ),
      );
    } catch (e) {
      emit(AuthError(message: ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onRegister(
    RegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final response = await _authRepository.registerWorker(
        tempToken: event.tempToken,
        firstName: event.firstName,
        lastName: event.lastName,
        phone: event.phone,
        password: event.password,
        cnic: event.cnic,
        skills: event.skills,
      );

      final worker = WorkerModel.fromJson(response['worker'] ?? {});
      emit(Authenticated(worker: worker));
    } catch (e) {
      emit(AuthError(message: ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onLogin(LoginRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      await _authRepository.login(event.email, event.password);
      final worker = await _workerRepository.getProfile();
      emit(Authenticated(worker: worker));
    } catch (e) {
      emit(AuthError(message: ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onLogout(LogoutRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    LocationService().stopAll();
    await _authRepository.logout();
    emit(Unauthenticated());
  }

  /// Re-fetches the worker profile from Appwrite and emits a fresh
  /// [Authenticated] state so all BlocBuilder consumers rebuild with
  /// up-to-date data. Does NOT emit a loading state to avoid flickering.
  Future<void> _onRefreshProfile(
    RefreshProfile event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final worker = await _workerRepository.getProfile();
      emit(Authenticated(worker: worker));
    } catch (_) {
      // Silently ignore — profile will stay at last known state
    }
  }

  Future<void> _onForgotPassword(
    ForgotPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await _authRepository.forgotPassword(event.email);
      emit(OTPSent(email: event.email, purpose: 'PASSWORD_RESET'));
    } catch (e) {
      emit(AuthError(message: ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onResetPassword(
    ResetPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await _authRepository.resetPassword(event.tempToken, event.newPassword);
      emit(const PasswordResetSuccess());
    } catch (e) {
      emit(AuthError(message: ErrorMapper.toUserMessage(e)));
    }
  }
}
