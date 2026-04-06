import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';

/// OTP verification screen
class OtpVerificationScreen extends StatefulWidget {
  final String email;
  final String purpose;

  const OtpVerificationScreen({
    super.key,
    this.email = '',
    this.purpose = 'REGISTRATION',
  });

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _otpController = TextEditingController();
  int _resendTimer = 60;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void dispose() {
    _otpController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _resendTimer = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendTimer > 0) {
        setState(() => _resendTimer--);
      } else {
        timer.cancel();
      }
    });
  }

  String get _maskedEmail {
    final email = widget.email;
    final atIndex = email.indexOf('@');
    if (atIndex > 2) {
      return '${email.substring(0, 2)}${'*' * (atIndex - 2)}${email.substring(atIndex)}';
    }
    return email;
  }

  void _verifyOtp() {
    if (_otpController.text.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 6-digit OTP')),
      );
      return;
    }

    context.read<AuthBloc>().add(
      VerifyOTPRequested(
        email: widget.email,
        code: _otpController.text,
        purpose: widget.purpose,
      ),
    );
  }

  void _resendOtp() {
    if (_resendTimer > 0) return;

    context.read<AuthBloc>().add(
      SendOTPRequested(email: widget.email, purpose: widget.purpose),
    );
    _startTimer();
  }

  void _handleAuthState(BuildContext context, AuthState state) {
    if (state is OTPVerified) {
      // Handle PASSWORD_RESET purpose
      if (widget.purpose == 'PASSWORD_RESET') {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (context.mounted) {
            Navigator.of(context).pushNamed(
              AppRoutes.resetPassword,
              arguments: {'email': state.email, 'tempToken': state.tempToken},
            );
          }
        });
      } else if (state.isNewUser) {
        // New user, go to registration
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (context.mounted) {
            Navigator.of(context).pushNamed(
              AppRoutes.registration,
              arguments: {'email': state.email, 'tempToken': state.tempToken},
            );
          }
        });
      } else {
        // Existing user — re-check auth status to load user data from
        // the active Appwrite session, then navigate to main
        context.read<AuthBloc>().add(const CheckAuthStatusRequested());
      }
    } else if (state is Authenticated) {
      // Navigated here after CheckAuthStatusRequested for existing user
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) {
          Navigator.of(
            context,
          ).pushNamedAndRemoveUntil(AppRoutes.main, (route) => false);
        }
      });
    } else if (state is OTPSent) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('OTP resent successfully'),
          backgroundColor: AppColors.success,
        ),
      );
    } else if (state is AuthError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.message),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: _handleAuthState,
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AppSpacing.lg),

                  // Header
                  Text(
                    AppStrings.verificationCode,
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),

                  const SizedBox(height: AppSpacing.sm),

                  // Subtext
                  Text(
                    '${AppStrings.otpSubtext} $_maskedEmail',
                    style: TextStyle(
                      fontSize: 16,
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xxl),

                  // OTP input fields
                  PinCodeTextField(
                    appContext: context,
                    length: 6,
                    controller: _otpController,
                    obscureText: false,
                    animationType: AnimationType.fade,
                    keyboardType: TextInputType.number,
                    autoFocus: true,
                    pinTheme: PinTheme(
                      shape: PinCodeFieldShape.box,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      fieldHeight: 56,
                      fieldWidth: 48,
                      activeFillColor: Theme.of(context).colorScheme.surface,
                      inactiveFillColor: Theme.of(
                        context,
                      ).colorScheme.surfaceContainerHighest,
                      selectedFillColor: Theme.of(context).colorScheme.surface,
                      activeColor: AppColors.primary,
                      inactiveColor: Theme.of(context).colorScheme.outline,
                      selectedColor: AppColors.primary,
                    ),
                    animationDuration: const Duration(milliseconds: 200),
                    enableActiveFill: true,
                    onCompleted: (value) {
                      _verifyOtp();
                    },
                    onChanged: (value) {},
                  ),

                  const SizedBox(height: AppSpacing.lg),

                  // Resend OTP
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      final isResending = state is AuthLoading;
                      return Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Didn\'t receive code? ',
                            style: TextStyle(
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurface.withValues(alpha: 0.7),
                            ),
                          ),
                          if (_resendTimer > 0)
                            Text(
                              'Resend in ${_resendTimer}s',
                              style: TextStyle(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurface.withValues(alpha: 0.7),
                              ),
                            )
                          else
                            GestureDetector(
                              onTap: isResending ? null : _resendOtp,
                              child: Text(
                                isResending
                                    ? 'Sending...'
                                    : AppStrings.resendOtp,
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                        ],
                      );
                    },
                  ),

                  const SizedBox(height: AppSpacing.xxl),

                  // Verify button
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      final isLoading = state is AuthLoading;
                      return SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: isLoading ? null : _verifyOtp,
                          child: isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.white,
                                    ),
                                  ),
                                )
                              : const Text('Verify'),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: AppSpacing.lg),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
