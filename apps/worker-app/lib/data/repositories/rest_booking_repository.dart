import 'package:dio/dio.dart';
import '../../domain/repositories/booking_repository.dart';
import '../../core/constants/api_endpoints.dart';
import '../../data/models/booking_model.dart';
import 'dart:async';

/// REST implementation of BookingRepository for the Worker app
class RestBookingRepository implements BookingRepository {
  final Dio _dio;

  RestBookingRepository({required Dio dio}) : _dio = dio;

  @override
  Future<List<BookingModel>> getAvailableBookings() async {
    try {
      final response = await _dio.get(ApiEndpoints.availableBookings);
      final list = response.data as List;
      return list.map((e) => BookingModel.fromJson(e)).toList();
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<List<BookingModel>> getWorkerBookings({
    String? status,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.workerBookings,
        queryParameters: {
          if (status != null) 'status': status,
          'page': page,
          'limit': limit,
        },
      );
      final list = response.data['bookings'] as List;
      return list.map((e) => BookingModel.fromJson(e)).toList();
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<BookingModel> getBookingDetails(String bookingId) async {
    final response = await _dio.get('/bookings/$bookingId');
    return BookingModel.fromJson(response.data);
  }

  @override
  Future<BookingModel> acceptBooking(String bookingId) async {
    final response = await _dio.post(ApiEndpoints.acceptBooking(bookingId));
    return BookingModel.fromJson(response.data);
  }

  @override
  Future<void> rejectBooking(String bookingId, String reason) async {
    await _dio.post(
      ApiEndpoints.rejectBooking(bookingId),
      data: {'reason': reason},
    );
  }

  @override
  Future<BookingModel> startBooking(
    String bookingId, {
    List<String>? beforeImages,
  }) async {
    final response = await _dio.post(
      ApiEndpoints.startBooking(bookingId),
      data: {if (beforeImages != null) 'beforeImages': beforeImages},
    );
    return BookingModel.fromJson(response.data);
  }

  @override
  Future<BookingModel> completeBooking(
    String bookingId, {
    List<String>? afterImages,
    double? finalPrice,
    double? materialsCost,
  }) async {
    final response = await _dio.post(
      ApiEndpoints.completeBooking(bookingId),
      data: {
        if (afterImages != null) 'afterImages': afterImages,
        if (finalPrice != null) 'finalPrice': finalPrice,
        if (materialsCost != null) 'materialsCost': materialsCost,
      },
    );
    return BookingModel.fromJson(response.data);
  }

  @override
  Future<void> updateBookingLocation(String bookingId, double lat, double lng) async {
    await _dio.post(
      ApiEndpoints.bookingLocation(bookingId),
      data: {'lat': lat, 'lng': lng},
    );
  }

  @override
  Future<void> resetWorkerAvailability() async {
    await _dio.post('/users/worker/reset-status');
  }

  @override
  Stream<Map<String, dynamic>> subscribeToNewBookings(String workerId) {
    // Note: Realtime streaming via REST is usually done via WebSockets or Polling.
    // For now, returning an empty stream or implementing long polling placeholder.
    return const Stream.empty();
  }

  @override
  Stream<Map<String, dynamic>> subscribeToBookingUpdates(String bookingId) {
    return const Stream.empty();
  }
}
