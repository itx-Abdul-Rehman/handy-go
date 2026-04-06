import 'package:appwrite/appwrite.dart';

import '../../core/appwrite/appwrite_client.dart';
import '../../core/appwrite/appwrite_config.dart';
import '../../domain/repositories/worker_repository.dart';
import '../models/worker_model.dart';
import '../models/user_model.dart';

/// Appwrite-based worker profile repository.
///
/// Replaces the Dio-based [WorkerRepository] that calls user-service.
/// Reads/writes directly to Appwrite Databases and Storage.
class AppwriteWorkerRepository implements WorkerRepository {
  final Account _account = AppwriteClient.account;
  final TablesDB _tablesDB = AppwriteClient.tablesDB;
  final Storage _storage = AppwriteClient.storage;

  // ------------------------------------------------------------------
  // Profile
  // ------------------------------------------------------------------

  @override
  Future<WorkerModel> getProfile() async {
    try {
      final user = await _account.get();

      late final dynamic workerDoc;
      try {
        workerDoc = await _tablesDB.getRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.workersCollection,
          rowId: user.$id,
        );
      } on AppwriteException catch (e) {
        // Self-heal: if worker doc doesn't exist (404), create a default one
        if (e.code == 404) {
          workerDoc = await _tablesDB.createRow(
            databaseId: AppwriteConfig.databaseId,
            tableId: AppwriteConfig.workersCollection,
            rowId: user.$id,
            data: {
              'userId': user.$id,
              'firstName': user.name.split(' ').first,
              'lastName': user.name.split(' ').length > 1
                  ? user.name.split(' ').sublist(1).join(' ')
                  : '',
              'phone': user.phone.isNotEmpty ? user.phone : '',
              'cnic': '',
              'cnicVerified': false,
              'status': 'PENDING_VERIFICATION',
              'serviceRadius': 10,
              'isAvailable': false,
              'trustScore': 50,
              'totalJobsCompleted': 0,
              'totalEarnings': 0,
              'ratingAverage': 0,
              'ratingCount': 0,
            },
          );
        } else {
          rethrow;
        }
      }

      // Fetch skills
      final skillDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workerSkillsCollection,
        queries: [Query.equal('workerId', user.$id)],
      );

      // Fetch schedule
      final scheduleDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workerScheduleCollection,
        queries: [Query.equal('workerId', user.$id)],
      );

      return _buildWorkerModel(
        user,
        workerDoc.data,
        skillDocs.rows,
        scheduleDocs.rows,
      );
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to get profile');
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
      final user = await _account.get();

      // Build update data
      final data = <String, dynamic>{};
      if (firstName != null) data['firstName'] = firstName;
      if (lastName != null) data['lastName'] = lastName;
      if (phone != null) data['phone'] = phone;
      if (profileImage != null) data['profileImage'] = profileImage;
      if (serviceRadius != null) data['serviceRadius'] = serviceRadius;
      if (bankDetails != null) {
        data['bankAccountTitle'] = bankDetails.accountTitle;
        data['bankAccountNumber'] = bankDetails.accountNumber;
        data['bankName'] = bankDetails.bankName;
      }

      if (data.isNotEmpty) {
        await _tablesDB.updateRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.workersCollection,
          rowId: user.$id,
          data: data,
        );
      }

      // Note: Email cannot be updated without the user's current password.
      // Email changes require a separate flow with password confirmation.

      // Update skills (replace all)
      if (skills != null) {
        // Delete existing
        final existing = await _tablesDB.listRows(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.workerSkillsCollection,
          queries: [Query.equal('workerId', user.$id)],
        );
        for (final doc in existing.rows) {
          await _tablesDB.deleteRow(
            databaseId: AppwriteConfig.databaseId,
            tableId: AppwriteConfig.workerSkillsCollection,
            rowId: doc.$id,
          );
        }
        // Create new
        for (final skill in skills) {
          await _tablesDB.createRow(
            databaseId: AppwriteConfig.databaseId,
            tableId: AppwriteConfig.workerSkillsCollection,
            rowId: ID.unique(),
            data: {
              'workerId': user.$id,
              'category': skill.category,
              'experience': skill.experience,
              'hourlyRate': skill.hourlyRate,
              'isVerified': skill.isVerified,
            },
          );
        }
      }

      // Update availability schedule
      if (availability != null) {
        await _tablesDB.updateRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.workersCollection,
          rowId: user.$id,
          data: {'isAvailable': availability.isAvailable},
        );

        // Replace schedule
        final existingSched = await _tablesDB.listRows(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.workerScheduleCollection,
          queries: [Query.equal('workerId', user.$id)],
        );
        for (final doc in existingSched.rows) {
          await _tablesDB.deleteRow(
            databaseId: AppwriteConfig.databaseId,
            tableId: AppwriteConfig.workerScheduleCollection,
            rowId: doc.$id,
          );
        }
        for (final sched in availability.schedule) {
          await _tablesDB.createRow(
            databaseId: AppwriteConfig.databaseId,
            tableId: AppwriteConfig.workerScheduleCollection,
            rowId: ID.unique(),
            data: {
              'workerId': user.$id,
              'day': sched.day,
              'startTime': sched.startTime,
              'endTime': sched.endTime,
            },
          );
        }
      }

      return getProfile();
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to update profile');
    }
  }

  // ------------------------------------------------------------------
  // Location updates (called frequently by worker app)
  // ------------------------------------------------------------------

  @override
  Future<void> updateLocation(double lat, double lng) async {
    try {
      final user = await _account.get();
      await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workersCollection,
        rowId: user.$id,
        data: {'currentLatitude': lat, 'currentLongitude': lng},
      );

      // Note: Location history with bookingId is handled by
      // updateBookingLocation() during active bookings.
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to update location');
    }
  }

  // ------------------------------------------------------------------
  // Availability toggle
  // ------------------------------------------------------------------

  @override
  Future<bool> updateAvailability(bool isAvailable) async {
    try {
      final user = await _account.get();
      await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workersCollection,
        rowId: user.$id,
        data: {'isAvailable': isAvailable},
      );
      return isAvailable;
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to update availability');
    }
  }

  // ------------------------------------------------------------------
  // Document upload (CNIC, etc.)
  // ------------------------------------------------------------------

  @override
  Future<String> uploadDocument(String type, String url) async {
    // If url is a local file path, upload to Appwrite Storage first
    // Otherwise, store the remote URL directly
    try {
      final user = await _account.get();
      // Select appropriate bucket based on document type
      final String bucketId = type == 'profile_photo'
          ? AppwriteConfig.profileImagesBucket
          : AppwriteConfig.cnicImagesBucket;

      String fileUrl = url;
      if (url.startsWith('/') ||
          url.startsWith('file://') ||
          !url.startsWith('http')) {
        // Local file — upload
        // Extract file extension from path to satisfy bucket extension whitelist
        final ext = url.split('.').length > 1
            ? url.split('.').last.toLowerCase()
            : 'jpg';
        final file = await _storage.createFile(
          bucketId: bucketId,
          fileId: ID.unique(),
          file: InputFile.fromPath(
            path: url,
            filename: '${type}_${user.$id}.$ext',
          ),
        );
        fileUrl = AppwriteConfig.getFileUrl(bucketId, file.$id);
      }

      // Update worker doc based on document type
      if (type == 'cnic_front') {
        await _tablesDB.updateRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.workersCollection,
          rowId: user.$id,
          data: {'cnicFrontImage': fileUrl, 'cnicFrontStatus': 'pending'},
        );
      } else if (type == 'cnic_back') {
        await _tablesDB.updateRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.workersCollection,
          rowId: user.$id,
          data: {'cnicBackImage': fileUrl, 'cnicBackStatus': 'pending'},
        );
      } else if (type == 'profile_photo') {
        await _tablesDB.updateRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.workersCollection,
          rowId: user.$id,
          data: {'profileImage': fileUrl, 'profilePhotoStatus': 'pending'},
        );
      }
      // For certificates and other doc types, the URL is returned
      // but there's no dedicated DB column yet — caller can handle it

      return fileUrl;
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to upload document');
    }
  }

  // ------------------------------------------------------------------
  // Earnings
  // ------------------------------------------------------------------

  @override
  Future<Map<String, dynamic>> getEarnings({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final user = await _account.get();

      // Query completed bookings for this worker
      final queries = <String>[
        Query.equal('workerId', user.$id),
        Query.equal('status', 'COMPLETED'),
      ];
      if (startDate != null) {
        queries.add(
          Query.greaterThanEqual(
            'scheduledDateTime',
            startDate.toIso8601String(),
          ),
        );
      }
      if (endDate != null) {
        queries.add(
          Query.lessThanEqual('scheduledDateTime', endDate.toIso8601String()),
        );
      }

      final bookings = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        queries: queries,
      );

      double total = 0;
      final breakdown = <String, double>{};

      for (final doc in bookings.rows) {
        final amount = (doc.data['finalPrice'] ?? 0).toDouble();
        total += amount;
        final category = doc.data['serviceCategory'] ?? 'OTHER';
        breakdown[category] = (breakdown[category] ?? 0) + amount;
      }

      return {
        'success': true,
        'total': total,
        'count': bookings.total,
        'breakdown': breakdown,
      };
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to get earnings');
    }
  }

  // ------------------------------------------------------------------
  // Upload profile image
  // ------------------------------------------------------------------

  @override
  Future<String> uploadProfileImage(String filePath) async {
    try {
      final user = await _account.get();
      // Extract actual file extension instead of hardcoding .jpg
      final ext = filePath.split('.').length > 1
          ? filePath.split('.').last.toLowerCase()
          : 'jpg';
      final file = await _storage.createFile(
        bucketId: AppwriteConfig.profileImagesBucket,
        fileId: ID.unique(),
        file: InputFile.fromPath(
          path: filePath,
          filename: 'profile_${user.$id}.$ext',
        ),
      );
      final url = AppwriteConfig.getFileUrl(
        AppwriteConfig.profileImagesBucket,
        file.$id,
      );
      // Update worker document
      await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workersCollection,
        rowId: user.$id,
        data: {'profileImage': url},
      );
      return url;
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to upload profile image');
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  WorkerModel _buildWorkerModel(
    dynamic user,
    Map<String, dynamic> w,
    List<dynamic> skillDocs,
    List<dynamic> scheduleDocs,
  ) {
    final skills = skillDocs
        .map(
          (d) => SkillModel(
            category: d.data['category'] ?? '',
            experience: d.data['experience'] ?? 0,
            hourlyRate: (d.data['hourlyRate'] ?? 0).toDouble(),
            isVerified: d.data['isVerified'] ?? false,
          ),
        )
        .toList();

    final schedule = scheduleDocs
        .map(
          (d) => AvailabilitySchedule(
            day: d.data['day'] ?? '',
            startTime: d.data['startTime'] ?? '08:00',
            endTime: d.data['endTime'] ?? '20:00',
          ),
        )
        .toList();

    return WorkerModel(
      id: w['\$id'] ?? user.$id,
      user: UserModel(
        id: user.$id,
        role: 'WORKER',
        phone: user.phone ?? '',
        email: user.email,
        isVerified: user.emailVerification ?? false,
        isActive: true,
        createdAt: DateTime.tryParse(user.$createdAt ?? '') ?? DateTime.now(),
        updatedAt: DateTime.tryParse(user.$updatedAt ?? '') ?? DateTime.now(),
      ),
      firstName: w['firstName'] ?? '',
      lastName: w['lastName'] ?? '',
      profileImage: w['profileImage'],
      cnic: w['cnic'] ?? '',
      cnicVerified: w['cnicVerified'] ?? false,
      cnicFrontImage: w['cnicFrontImage'],
      cnicBackImage: w['cnicBackImage'],
      cnicFrontStatus:
          w['cnicFrontStatus'] ??
          (w['cnicFrontImage'] != null ? 'pending' : 'not_uploaded'),
      cnicBackStatus:
          w['cnicBackStatus'] ??
          (w['cnicBackImage'] != null ? 'pending' : 'not_uploaded'),
      profilePhotoStatus:
          w['profilePhotoStatus'] ??
          (w['profileImage'] != null ? 'pending' : 'not_uploaded'),
      verificationNotes: w['verificationNotes'],
      skills: skills,
      currentLocation: w['currentLatitude'] != null
          ? Coordinates(
              lat: (w['currentLatitude'] as num).toDouble(),
              lng: (w['currentLongitude'] as num).toDouble(),
            )
          : null,
      serviceRadius: (w['serviceRadius'] ?? 10).toDouble(),
      availability: WorkerAvailability(
        isAvailable: w['isAvailable'] ?? false,
        schedule: schedule,
      ),
      rating: WorkerRating(
        average: (w['ratingAverage'] ?? 0).toDouble(),
        count: w['ratingCount'] ?? 0,
      ),
      trustScore: w['trustScore'] ?? 50,
      totalJobsCompleted: w['totalJobsCompleted'] ?? 0,
      totalEarnings: (w['totalEarnings'] ?? 0).toDouble(),
      bankDetails: w['bankAccountTitle'] != null
          ? BankDetails(
              accountTitle: w['bankAccountTitle'] ?? '',
              accountNumber: w['bankAccountNumber'] ?? '',
              bankName: w['bankName'] ?? '',
            )
          : null,
      status: w['status'] ?? 'PENDING_VERIFICATION',
      createdAt: DateTime.tryParse(w['createdAt'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(w['\$updatedAt'] ?? '') ?? DateTime.now(),
    );
  }
}
