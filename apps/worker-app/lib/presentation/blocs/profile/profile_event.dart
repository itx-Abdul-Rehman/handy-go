import 'package:equatable/equatable.dart';

import '../../../data/models/worker_model.dart';

/// Events for [ProfileBloc].
abstract class ProfileEvent extends Equatable {
  const ProfileEvent();
  @override
  List<Object?> get props => [];
}

/// Load the worker profile.
class ProfileLoadRequested extends ProfileEvent {
  const ProfileLoadRequested();
}

/// Update profile fields.
class ProfileUpdateRequested extends ProfileEvent {
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? profileImage;
  final List<SkillModel>? skills;
  final double? serviceRadius;
  final WorkerAvailability? availability;
  final BankDetails? bankDetails;

  const ProfileUpdateRequested({
    this.firstName,
    this.lastName,
    this.email,
    this.profileImage,
    this.skills,
    this.serviceRadius,
    this.availability,
    this.bankDetails,
  });

  @override
  List<Object?> get props => [
    firstName,
    lastName,
    email,
    profileImage,
    skills,
    serviceRadius,
    availability,
    bankDetails,
  ];
}

/// Upload a profile image from a local file path.
class ProfileImageUploadRequested extends ProfileEvent {
  final String filePath;
  const ProfileImageUploadRequested(this.filePath);
  @override
  List<Object?> get props => [filePath];
}

/// Upload a verification document (CNIC front/back, certificate, etc.).
class DocumentUploadRequested extends ProfileEvent {
  final String type;
  final String filePath;
  const DocumentUploadRequested({required this.type, required this.filePath});
  @override
  List<Object?> get props => [type, filePath];
}
