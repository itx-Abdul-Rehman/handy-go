import 'package:equatable/equatable.dart';

/// Events for [HomeBloc].
abstract class HomeEvent extends Equatable {
  const HomeEvent();
  @override
  List<Object?> get props => [];
}

/// Triggered on first load and pull-to-refresh.
class HomeLoadRequested extends HomeEvent {
  const HomeLoadRequested();
}

/// Lightweight reload — only refreshes booking lists, not the profile.
class HomeRefreshBookings extends HomeEvent {
  const HomeRefreshBookings();
}

/// Worker toggled their online/offline switch.
class HomeToggleAvailability extends HomeEvent {
  final bool isAvailable;
  const HomeToggleAvailability(this.isAvailable);
  @override
  List<Object?> get props => [isAvailable];
}

/// Notification count should be refreshed.
class HomeRefreshNotificationCount extends HomeEvent {
  const HomeRefreshNotificationCount();
}
