import 'package:equatable/equatable.dart';

/// Events for [BookingsBloc].
abstract class BookingsEvent extends Equatable {
  const BookingsEvent();
  @override
  List<Object?> get props => [];
}

/// Load all bookings for the worker, optionally by [status].
class BookingsLoadRequested extends BookingsEvent {
  final String? status;
  final int page;
  const BookingsLoadRequested({this.status, this.page = 1});
  @override
  List<Object?> get props => [status, page];
}

/// Accept an available booking.
class BookingAccepted extends BookingsEvent {
  final String bookingId;
  const BookingAccepted(this.bookingId);
  @override
  List<Object?> get props => [bookingId];
}

/// Reject an available booking.
class BookingRejected extends BookingsEvent {
  final String bookingId;
  final String reason;
  const BookingRejected(this.bookingId, this.reason);
  @override
  List<Object?> get props => [bookingId, reason];
}

/// Start working on an accepted booking.
class BookingStarted extends BookingsEvent {
  final String bookingId;
  final List<String>? beforeImages;
  const BookingStarted(this.bookingId, {this.beforeImages});
  @override
  List<Object?> get props => [bookingId, beforeImages];
}

/// Complete a booking.
class BookingCompleted extends BookingsEvent {
  final String bookingId;
  final List<String>? afterImages;
  final double? finalPrice;
  final double? materialsCost;
  const BookingCompleted(
    this.bookingId, {
    this.afterImages,
    this.finalPrice,
    this.materialsCost,
  });
  @override
  List<Object?> get props => [
    bookingId,
    afterImages,
    finalPrice,
    materialsCost,
  ];
}

/// Push live GPS for an active booking.
class BookingLocationUpdated extends BookingsEvent {
  final String bookingId;
  final double lat;
  final double lng;
  const BookingLocationUpdated(this.bookingId, this.lat, this.lng);
  @override
  List<Object?> get props => [bookingId, lat, lng];
}
