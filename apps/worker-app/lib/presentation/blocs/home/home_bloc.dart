import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../domain/repositories/booking_repository.dart';
import '../../../domain/repositories/worker_repository.dart';
import 'home_event.dart';
import 'home_state.dart';

/// Manages the home-screen data: worker profile, availability toggle,
/// available jobs, and active jobs.
///
/// Replaces the raw `setState` calls that were scattered across the 1200+
/// line `_HomeScreenState`.
class HomeBloc extends Bloc<HomeEvent, HomeState> {
  final WorkerRepository _workerRepo;
  final BookingRepository _bookingRepo;

  HomeBloc({
    required WorkerRepository workerRepository,
    required BookingRepository bookingRepository,
  }) : _workerRepo = workerRepository,
       _bookingRepo = bookingRepository,
       super(const HomeInitial()) {
    on<HomeLoadRequested>(_onLoad);
    on<HomeRefreshBookings>(_onRefreshBookings);
    on<HomeToggleAvailability>(_onToggleAvailability);
    on<HomeRefreshNotificationCount>(_onRefreshNotificationCount);
  }

  Future<void> _onLoad(HomeLoadRequested event, Emitter<HomeState> emit) async {
    emit(const HomeLoading());
    try {
      final worker = await _workerRepo.getProfile();
      final available = await _bookingRepo.getAvailableBookings();
      final active = await _bookingRepo.getWorkerBookings(
        status: 'IN_PROGRESS',
      );

      emit(
        HomeLoaded(
          worker: worker,
          isAvailable: worker.availability.isAvailable,
          availableJobs: available,
          activeJobs: active,
        ),
      );
    } catch (e) {
      emit(HomeError(e.toString()));
    }
  }

  Future<void> _onRefreshBookings(
    HomeRefreshBookings event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;

    try {
      final available = await _bookingRepo.getAvailableBookings();
      final active = await _bookingRepo.getWorkerBookings(
        status: 'IN_PROGRESS',
      );
      emit(current.copyWith(availableJobs: available, activeJobs: active));
    } catch (_) {
      // Silently ignore — keep the last known state
    }
  }

  Future<void> _onToggleAvailability(
    HomeToggleAvailability event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;

    // Optimistic update
    emit(current.copyWith(isAvailable: event.isAvailable));

    try {
      final actual = await _workerRepo.updateAvailability(event.isAvailable);
      emit(current.copyWith(isAvailable: actual));
    } catch (_) {
      // Revert on failure
      emit(current.copyWith(isAvailable: !event.isAvailable));
    }
  }

  Future<void> _onRefreshNotificationCount(
    HomeRefreshNotificationCount event,
    Emitter<HomeState> emit,
  ) async {
    // TODO: Implement notification count query via NotificationRepository
    // For now this is a no-op; the count stays at whatever was last set.
  }
}
