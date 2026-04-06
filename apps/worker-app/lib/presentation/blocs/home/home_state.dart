import 'package:equatable/equatable.dart';

import '../../../data/models/booking_model.dart';
import '../../../data/models/worker_model.dart';

/// States for [HomeBloc].
abstract class HomeState extends Equatable {
  const HomeState();
  @override
  List<Object?> get props => [];
}

class HomeInitial extends HomeState {
  const HomeInitial();
}

class HomeLoading extends HomeState {
  const HomeLoading();
}

class HomeLoaded extends HomeState {
  final WorkerModel worker;
  final bool isAvailable;
  final List<BookingModel> availableJobs;
  final List<BookingModel> activeJobs;
  final int unreadNotificationCount;

  const HomeLoaded({
    required this.worker,
    required this.isAvailable,
    required this.availableJobs,
    required this.activeJobs,
    this.unreadNotificationCount = 0,
  });

  HomeLoaded copyWith({
    WorkerModel? worker,
    bool? isAvailable,
    List<BookingModel>? availableJobs,
    List<BookingModel>? activeJobs,
    int? unreadNotificationCount,
  }) {
    return HomeLoaded(
      worker: worker ?? this.worker,
      isAvailable: isAvailable ?? this.isAvailable,
      availableJobs: availableJobs ?? this.availableJobs,
      activeJobs: activeJobs ?? this.activeJobs,
      unreadNotificationCount:
          unreadNotificationCount ?? this.unreadNotificationCount,
    );
  }

  @override
  List<Object?> get props => [
    worker,
    isAvailable,
    availableJobs,
    activeJobs,
    unreadNotificationCount,
  ];
}

class HomeError extends HomeState {
  final String message;
  const HomeError(this.message);
  @override
  List<Object?> get props => [message];
}
