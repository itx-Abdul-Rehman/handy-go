import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/utils/error_mapper.dart';
import '../../../domain/repositories/worker_repository.dart';
import 'profile_event.dart';
import 'profile_state.dart';

/// Manages the worker's own profile: viewing, editing, uploading
/// documents and profile images.
class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {
  final WorkerRepository _workerRepo;

  ProfileBloc({required WorkerRepository workerRepository})
    : _workerRepo = workerRepository,
      super(const ProfileInitial()) {
    on<ProfileLoadRequested>(_onLoad);
    on<ProfileUpdateRequested>(_onUpdate);
    on<ProfileImageUploadRequested>(_onImageUpload);
    on<DocumentUploadRequested>(_onDocumentUpload);
  }

  Future<void> _onLoad(
    ProfileLoadRequested event,
    Emitter<ProfileState> emit,
  ) async {
    emit(const ProfileLoading());
    try {
      final worker = await _workerRepo.getProfile();
      emit(ProfileLoaded(worker));
    } catch (e) {
      emit(ProfileError(ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onUpdate(
    ProfileUpdateRequested event,
    Emitter<ProfileState> emit,
  ) async {
    final current = state;
    if (current is ProfileLoaded) {
      emit(ProfileUpdating(current.worker));
    }

    try {
      final updated = await _workerRepo.updateProfile(
        firstName: event.firstName,
        lastName: event.lastName,
        email: event.email,
        profileImage: event.profileImage,
        skills: event.skills,
        serviceRadius: event.serviceRadius,
        availability: event.availability,
        bankDetails: event.bankDetails,
      );
      emit(ProfileUpdateSuccess(updated, 'Profile updated'));
    } catch (e) {
      emit(ProfileError(ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onImageUpload(
    ProfileImageUploadRequested event,
    Emitter<ProfileState> emit,
  ) async {
    final current = state;
    if (current is ProfileLoaded) {
      emit(ProfileUpdating(current.worker));
    }

    try {
      final url = await _workerRepo.uploadProfileImage(event.filePath);
      final updated = await _workerRepo.updateProfile(profileImage: url);
      emit(ProfileUpdateSuccess(updated, 'Profile image updated'));
    } catch (e) {
      emit(ProfileError(ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onDocumentUpload(
    DocumentUploadRequested event,
    Emitter<ProfileState> emit,
  ) async {
    final current = state;
    if (current is ProfileLoaded) {
      emit(ProfileUpdating(current.worker));
    }

    try {
      await _workerRepo.uploadDocument(event.type, event.filePath);
      // Reload the full profile to get updated document statuses
      final worker = await _workerRepo.getProfile();
      emit(ProfileUpdateSuccess(worker, 'Document uploaded'));
    } catch (e) {
      emit(ProfileError(ErrorMapper.toUserMessage(e)));
    }
  }
}
