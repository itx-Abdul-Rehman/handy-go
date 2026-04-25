import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_endpoints.dart';

/// Centralized Dio client for the application
class DioClient {
  final Dio dio;
  final FlutterSecureStorage secureStorage;

  DioClient({
    required this.dio,
    required this.secureStorage,
  }) {
    _configureDio();
  }

  void _configureDio() {
    dio.options = BaseOptions(
      baseUrl: ApiEndpoints.baseUrl,
      connectTimeout: const Duration(milliseconds: ApiEndpoints.connectionTimeout),
      receiveTimeout: const Duration(milliseconds: ApiEndpoints.receiveTimeout),
      contentType: 'application/json',
    );

    // Interceptor for Auth (JWT injection)
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await secureStorage.read(key: 'access_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // TODO: Implement refresh token logic if needed
          return handler.next(e);
        },
      ),
    );

    // Logger for debugging
    dio.interceptors.add(
      PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        responseHeader: false,
        error: true,
        compact: true,
        maxWidth: 90,
      ),
    );
  }
}
