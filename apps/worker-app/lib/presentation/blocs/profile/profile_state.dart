import 'package:equatable/equatable.dart';

import '../../../data/models/worker_model.dart';

/// States for [ProfileBloc].
abstract class ProfileState extends Equatable {
  const ProfileState();
  @override
  List<Object?> get props => [];
}

class ProfileInitial extends ProfileState {
  const ProfileInitial();
}

class ProfileLoading extends ProfileState {
  const ProfileLoading();
}

class ProfileLoaded extends ProfileState {
  final WorkerModel worker;
  const ProfileLoaded(this.worker);
  @override
  List<Object?> get props => [worker];
}

/// A transient state while a profile-update / upload is in progress.
/// The [worker] stays at the last-known value so the UI isn't blank.
class ProfileUpdating extends ProfileState {
  final WorkerModel worker;
  const ProfileUpdating(this.worker);
  @override
  List<Object?> get props => [worker];
}

class ProfileUpdateSuccess extends ProfileState {
  final WorkerModel worker;
  final String message;
  const ProfileUpdateSuccess(this.worker, this.message);
  @override
  List<Object?> get props => [worker, message];
}

class ProfileError extends ProfileState {
  final String message;
  const ProfileError(this.message);
  @override
  List<Object?> get props => [message];
}
