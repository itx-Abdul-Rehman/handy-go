import 'package:equatable/equatable.dart';

import '../../../data/models/booking_model.dart';

/// States for [BookingsBloc].
abstract class BookingsState extends Equatable {
  const BookingsState();
  @override
  List<Object?> get props => [];
}

class BookingsInitial extends BookingsState {
  const BookingsInitial();
}

class BookingsLoading extends BookingsState {
  const BookingsLoading();
}

class BookingsLoaded extends BookingsState {
  final List<BookingModel> bookings;
  final String? activeFilter;

  const BookingsLoaded({required this.bookings, this.activeFilter});

  @override
  List<Object?> get props => [bookings, activeFilter];
}

/// Emitted while a single booking action (accept / reject / start / complete)
/// is in progress.
class BookingActionInProgress extends BookingsState {
  final String bookingId;
  const BookingActionInProgress(this.bookingId);
  @override
  List<Object?> get props => [bookingId];
}

/// Emitted once after a successful accept / start / complete.
class BookingActionSuccess extends BookingsState {
  final BookingModel booking;
  final String action; // 'accepted' | 'started' | 'completed'
  const BookingActionSuccess(this.booking, this.action);
  @override
  List<Object?> get props => [booking, action];
}

class BookingsError extends BookingsState {
  final String message;
  const BookingsError(this.message);
  @override
  List<Object?> get props => [message];
}
