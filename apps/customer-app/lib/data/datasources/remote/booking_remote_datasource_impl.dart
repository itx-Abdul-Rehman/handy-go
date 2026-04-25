import 'package:dio/dio.dart';
import '../../../core/error/exceptions.dart';
import '../../models/booking_model.dart';
import '../../models/worker_model.dart';
import '../../../domain/repositories/booking_repository.dart';
import '../../../presentation/blocs/booking/booking_state.dart';
import 'booking_remote_datasource.dart';

/// REST implementation of BookingRemoteDataSource using Dio
class BookingRemoteDataSourceImpl implements BookingRemoteDataSource {
  final Dio _dio;

  BookingRemoteDataSourceImpl({required Dio dio}) : _dio = dio;

  @override
  Future<ProblemAnalysisResult> analyzeProblem({
    required String description,
    String? category,
  }) async {
    try {
      final response = await _dio.post(
        '/matching/analyze-problem',
        data: {
          'description': description,
          if (category != null) 'category': category,
        },
      );
      return ProblemAnalysisResult.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<FindWorkersResult> findWorkers({
    required String serviceCategory,
    required double lat,
    required double lng,
    required DateTime scheduledDateTime,
    bool isUrgent = false,
  }) async {
    try {
      final response = await _dio.post(
        '/matching/find-workers',
        data: {
          'serviceCategory': serviceCategory,
          'lat': lat,
          'lng': lng,
          'scheduledDateTime': scheduledDateTime.toIso8601String(),
          'isUrgent': isUrgent,
        },
      );
      return FindWorkersResult.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<CreateBookingResult> createBooking(BookingCreateRequest request) async {
    try {
      final response = await _dio.post(
        '/bookings',
        data: request.toJson(),
      );
      return CreateBookingResult.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<BookingModel> selectWorker({
    required String bookingId,
    required String workerId,
  }) async {
    try {
      final response = await _dio.post(
        '/bookings/$bookingId/select-worker',
        data: {'workerId': workerId},
      );
      return BookingModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<void> cancelBooking({
    required String bookingId,
    required String reason,
  }) async {
    try {
      await _dio.post(
        '/bookings/$bookingId/cancel',
        data: {'reason': reason},
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<BookingsListResult> getCustomerBookings({
    String? status,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _dio.get(
        '/bookings/customer',
        queryParameters: {
          if (status != null) 'status': status,
          'page': page,
          'limit': limit,
        },
      );
      return BookingsListResult.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<BookingModel> getBookingDetails(String bookingId) async {
    try {
      final response = await _dio.get('/bookings/$bookingId');
      return BookingModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<void> submitRating({
    required String bookingId,
    required int rating,
    String? review,
    Map<String, int>? categoryRatings,
  }) async {
    try {
      await _dio.post(
        '/bookings/$bookingId/rate',
        data: {
          'rating': rating,
          if (review != null) 'review': review,
          if (categoryRatings != null) 'categoryRatings': categoryRatings,
        },
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<WorkerLocationResponse> getWorkerLocation(String bookingId) async {
    try {
      final response = await _dio.get('/bookings/$bookingId/location');
      return WorkerLocationResponse.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<SOSTriggerResult> triggerSOS({
    String? bookingId,
    required String reason,
    required String description,
    required double lat,
    required double lng,
  }) async {
    try {
      final response = await _dio.post(
        '/sos/trigger',
        data: {
          if (bookingId != null) 'bookingId': bookingId,
          'reason': reason,
          'description': description,
          'lat': lat,
          'lng': lng,
        },
      );
      return SOSTriggerResult.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<PriceEstimate> estimatePrice({
    required String serviceCategory,
    required String problemDescription,
    required String city,
  }) async {
    try {
      final response = await _dio.post(
        '/matching/estimate-price',
        data: {
          'serviceCategory': serviceCategory,
          'problemDescription': problemDescription,
          'city': city,
        },
      );
      return PriceEstimate.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<int> estimateDuration({
    required String serviceCategory,
    required String problemDescription,
  }) async {
    try {
      final response = await _dio.post(
        '/matching/estimate-duration',
        data: {
          'serviceCategory': serviceCategory,
          'problemDescription': problemDescription,
        },
      );
      return response.data['duration'] as int;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Exception _handleDioError(DioException e) {
    if (e.response != null) {
      final data = e.response!.data;
      final message = data is Map ? data['message'] ?? 'Server error' : 'Server error';
      return ServerException(
        message: message,
        statusCode: e.response!.statusCode,
        data: data,
      );
    }
    return const ServerException(message: 'Unexpected network error');
  }
}
