import 'package:equatable/equatable.dart';
import '../../../data/models/user_model.dart';

/// User profile states
abstract class UserState extends Equatable {
  const UserState();

  @override
  List<Object?> get props => [];
}

/// Initial state
class UserInitial extends UserState {
  const UserInitial();
}

/// Loading state
class UserLoading extends UserState {
  final String? message;

  const UserLoading({this.message});

  @override
  List<Object?> get props => [message];
}

/// Profile loaded state
class UserProfileLoaded extends UserState {
  final CustomerModel profile;
  final List<AddressModel> addresses;

  const UserProfileLoaded({required this.profile, this.addresses = const []});

  @override
  List<Object?> get props => [profile, addresses];

  UserProfileLoaded copyWith({
    CustomerModel? profile,
    List<AddressModel>? addresses,
  }) {
    return UserProfileLoaded(
      profile: profile ?? this.profile,
      addresses: addresses ?? this.addresses,
    );
  }
}

/// Profile update success
class UserProfileUpdated extends UserState {
  final CustomerModel profile;
  final String message;

  const UserProfileUpdated({
    required this.profile,
    this.message = 'Profile updated successfully',
  });

  @override
  List<Object?> get props => [profile, message];
}

/// Address action success
class AddressActionSuccess extends UserState {
  final List<AddressModel> addresses;
  final String message;

  const AddressActionSuccess({required this.addresses, required this.message});

  @override
  List<Object?> get props => [addresses, message];
}

/// Error state
class UserError extends UserState {
  final String message;

  const UserError({required this.message});

  @override
  List<Object?> get props => [message];
}

/// Account deleted state
class AccountDeleted extends UserState {
  const AccountDeleted();
}
