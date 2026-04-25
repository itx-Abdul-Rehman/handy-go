import 'package:dio/dio.dart';
import '../../domain/repositories/worker_repository.dart';
import '../../core/constants/api_endpoints.dart';
import '../../data/models/worker_model.dart';

/// REST implementation of WorkerRepository for the Worker app
class RestWorkerRepository implements WorkerRepository {
  final Dio _dio;

  RestWorkerRepository({required Dio dio}) : _dio = dio;

  @override
  Future<WorkerModel> getProfile() async {
    try {
      final response = await _dio.get(ApiEndpoints.workerProfile);
      return WorkerModel.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<WorkerModel> updateProfile({
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? profileImage,
    List<SkillModel>? skills,
    double? serviceRadius,
    WorkerAvailability? availability,
    BankDetails? bankDetails,
  }) async {
    try {
      final response = await _dio.patch(
        ApiEndpoints.workerProfile,
        data: {
          if (firstName != null) 'firstName': firstName,
          if (lastName != null) 'lastName': lastName,
          if (email != null) 'email': email,
          if (phone != null) 'phone': phone,
          if (profileImage != null) 'profileImage': profileImage,
          if (skills != null) 'skills': skills.map((s) => s.toJson()).toList(),
          if (serviceRadius != null) 'serviceRadius': serviceRadius,
          if (availability != null) 'availability': availability.toString(),
          if (bankDetails != null) 'bankDetails': bankDetails.toJson(),
        },
      );
      return WorkerModel.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<void> updateLocation(double lat, double lng) async {
    await _dio.post(
      ApiEndpoints.updateLocation,
      data: {'lat': lat, 'lng': lng},
    );
  }

  @override
  Future<bool> updateAvailability(bool isAvailable) async {
    final response = await _dio.post(
      ApiEndpoints.updateAvailability,
      data: {'isAvailable': isAvailable},
    );
    return response.data['isAvailable'] as bool;
  }

  @override
  Future<String> uploadDocument(String type, String filePath) async {
    final formData = FormData.fromMap({
      'type': type,
      'document': await MultipartFile.fromFile(filePath),
    });
    final response = await _dio.post(ApiEndpoints.uploadDocuments, data: formData);
    return response.data['url'] as String;
  }

  @override
  Future<String> uploadProfileImage(String filePath) async {
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(filePath),
    });
    final response = await _dio.post('/users/worker/profile-image', data: formData);
    return response.data['url'] as String;
  }

  @override
  Future<Map<String, dynamic>> getEarnings({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final response = await _dio.get(
      ApiEndpoints.workerEarnings,
      queryParameters: {
        if (startDate != null) 'startDate': startDate.toIso8601String(),
        if (endDate != null) 'endDate': endDate.toIso8601String(),
      },
    );
    return response.data;
  }
}
