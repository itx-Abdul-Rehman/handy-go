import 'dart:convert';

import 'package:appwrite/appwrite.dart';

import '../../core/appwrite/appwrite_client.dart';
import '../../core/appwrite/appwrite_config.dart';
import '../../domain/repositories/booking_repository.dart';
import '../models/booking_model.dart';
import '../models/worker_model.dart';

/// Appwrite-based booking repository for the Worker App.
///
/// Replaces the Dio-based [BookingRepository] that calls booking-service.
/// Reads/writes directly to Appwrite Databases and Functions.
class AppwriteBookingRepository implements BookingRepository {
  final Account _account = AppwriteClient.account;
  final TablesDB _tablesDB = AppwriteClient.tablesDB;
  final Storage _storage = AppwriteClient.storage;
  final Functions _functions = AppwriteClient.functions;

  /// In-memory cache for customer info to avoid repeated lookups within a session.
  final Map<String, Map<String, dynamic>> _customerCache = {};

  // ------------------------------------------------------------------
  // Available bookings (worker can accept)
  // ------------------------------------------------------------------

  /// Get bookings that are PENDING and don't have a worker,
  /// or bookings assigned to the current worker awaiting acceptance.
  @override
  Future<List<BookingModel>> getAvailableBookings() async {
    try {
      final user = await _account.get();

      // Get bookings assigned to this worker that are still PENDING
      final assigned = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        queries: [
          Query.equal('workerId', user.$id),
          Query.equal('status', 'PENDING'),
          Query.orderDesc('\$createdAt'),
          Query.limit(50),
        ],
      );

      return Future.wait(
        assigned.rows.map((doc) => _enrichAndConvert(doc.data)),
      );
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to fetch available bookings');
    }
  }

  // ------------------------------------------------------------------
  // Worker's bookings (with filter)
  // ------------------------------------------------------------------

  @override
  Future<List<BookingModel>> getWorkerBookings({
    String? status,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final user = await _account.get();
      final queries = <String>[
        Query.equal('workerId', user.$id),
        Query.orderDesc('\$createdAt'),
        Query.limit(limit),
        Query.offset((page - 1) * limit),
      ];
      if (status != null) {
        queries.add(Query.equal('status', status));
      }

      final result = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        queries: queries,
      );

      return Future.wait(result.rows.map((doc) => _enrichAndConvert(doc.data)));
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to fetch bookings');
    }
  }

  // ------------------------------------------------------------------
  // Booking details
  // ------------------------------------------------------------------

  @override
  Future<BookingModel> getBookingDetails(String bookingId) async {
    try {
      final doc = await _tablesDB.getRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        rowId: bookingId,
      );

      // Also fetch timeline
      final timelineDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingTimelineCollection,
        queries: [
          Query.equal('bookingId', bookingId),
          Query.orderAsc('timestamp'),
        ],
      );

      // Fetch images
      final imageDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingImagesCollection,
        queries: [Query.equal('bookingId', bookingId)],
      );

      final timeline = timelineDocs.rows
          .map(
            (d) => {
              'status': d.data['status'],
              'timestamp': d.data['timestamp'],
              'note': d.data['note'],
            },
          )
          .toList();

      final beforeImages = imageDocs.rows
          .where((d) => d.data['type'] == 'before')
          .map((d) => (d.data['url'] ?? d.data['imageUrl'] ?? '') as String)
          .toList();
      final afterImages = imageDocs.rows
          .where((d) => d.data['type'] == 'after')
          .map((d) => (d.data['url'] ?? d.data['imageUrl'] ?? '') as String)
          .toList();

      final data = Map<String, dynamic>.from(doc.data);
      data['timeline'] = timeline;
      data['images'] = {'before': beforeImages, 'after': afterImages};

      return _enrichAndConvert(data);
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to fetch booking details');
    }
  }

  // ------------------------------------------------------------------
  // Accept booking
  // ------------------------------------------------------------------

  @override
  Future<BookingModel> acceptBooking(String bookingId) async {
    try {
      final doc = await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        rowId: bookingId,
        data: {'status': 'ACCEPTED'},
      );

      // Add timeline entry
      await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingTimelineCollection,
        rowId: ID.unique(),
        data: {
          'bookingId': bookingId,
          'status': 'ACCEPTED',
          'note': 'Worker accepted the booking',
          'timestamp': DateTime.now().toIso8601String(),
        },
      );

      // Mark worker as unavailable while job is active
      try {
        final user = await _account.get();
        await _tablesDB.updateRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.workersCollection,
          rowId: user.$id,
          data: {'isAvailable': false},
        );
      } catch (_) {
        // Best-effort — don't block accept flow
      }

      // Notify customer via notification function
      try {
        final user = await _account.get();
        final workerDoc = await _tablesDB.getRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.workersCollection,
          rowId: user.$id,
        );
        final workerName =
            '${workerDoc.data['firstName'] ?? ''} ${workerDoc.data['lastName'] ?? ''}'
                .trim();

        await _functions.createExecution(
          functionId: AppwriteConfig.notificationSenderFunction,
          body: jsonEncode({
            'action': 'send_template',
            'recipientId': doc.data['customerId'],
            'template': 'worker_accepted',
            'variables': {
              'workerName': workerName.isNotEmpty ? workerName : 'Worker',
            },
            'extraData': {'bookingId': bookingId},
          }),
        );
      } catch (_) {
        // Non-critical
      }

      return _enrichAndConvert(doc.data);
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to accept booking');
    }
  }

  // ------------------------------------------------------------------
  // Reject booking
  // ------------------------------------------------------------------

  @override
  Future<void> rejectBooking(String bookingId, String reason) async {
    try {
      // Get booking to find customer before clearing worker
      final bookingDoc = await _tablesDB.getRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        rowId: bookingId,
      );
      final customerId = bookingDoc.data['customerId'];

      await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        rowId: bookingId,
        data: {'workerId': null, 'status': 'PENDING'},
      );

      await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingTimelineCollection,
        rowId: ID.unique(),
        data: {
          'bookingId': bookingId,
          'status': 'WORKER_REJECTED',
          'note': 'Worker rejected: $reason',
          'timestamp': DateTime.now().toIso8601String(),
        },
      );

      // Notify customer that worker declined
      try {
        if (customerId != null) {
          await _functions.createExecution(
            functionId: AppwriteConfig.notificationSenderFunction,
            body: jsonEncode({
              'action': 'send',
              'recipientId': customerId,
              'type': 'BOOKING',
              'title': 'Worker Declined',
              'body':
                  'Your assigned worker has declined the booking. We are finding you another worker.',
              'data': {'bookingId': bookingId},
            }),
          );
        }
      } catch (_) {
        // Non-critical
      }
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to reject booking');
    }
  }

  // ------------------------------------------------------------------
  // Start booking (worker arrives and begins)
  // ------------------------------------------------------------------

  @override
  Future<BookingModel> startBooking(
    String bookingId, {
    List<String>? beforeImages,
  }) async {
    try {
      final doc = await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        rowId: bookingId,
        data: {'status': 'IN_PROGRESS'},
      );

      await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingTimelineCollection,
        rowId: ID.unique(),
        data: {
          'bookingId': bookingId,
          'status': 'IN_PROGRESS',
          'note': 'Job started',
          'timestamp': DateTime.now().toIso8601String(),
        },
      );

      // Save before-images (upload to storage first, then record in collection)
      if (beforeImages != null) {
        for (final imagePath in beforeImages) {
          try {
            final file = await _storage.createFile(
              bucketId: AppwriteConfig.bookingImagesBucket,
              fileId: ID.unique(),
              file: InputFile.fromPath(path: imagePath),
            );
            await _tablesDB.createRow(
              databaseId: AppwriteConfig.databaseId,
              tableId: AppwriteConfig.bookingImagesCollection,
              rowId: ID.unique(),
              data: {
                'bookingId': bookingId,
                'type': 'before',
                'fileId': file.$id,
                'url':
                    '${AppwriteConfig.endpoint}/storage/buckets/${AppwriteConfig.bookingImagesBucket}/files/${file.$id}/view?project=${AppwriteConfig.projectId}',
              },
            );
          } catch (_) {
            // Image upload failure should not block job start
          }
        }
      }

      // Notify customer
      try {
        await _functions.createExecution(
          functionId: AppwriteConfig.notificationSenderFunction,
          body: jsonEncode({
            'action': 'send_template',
            'recipientId': doc.data['customerId'],
            'template': 'job_started',
            'variables': {'serviceCategory': doc.data['serviceCategory'] ?? ''},
            'extraData': {'bookingId': bookingId},
          }),
        );
      } catch (_) {}

      return _enrichAndConvert(doc.data);
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to start booking');
    }
  }

  // ------------------------------------------------------------------
  // Complete booking
  // ------------------------------------------------------------------

  @override
  Future<BookingModel> completeBooking(
    String bookingId, {
    List<String>? afterImages,
    double? finalPrice,
    double? materialsCost,
  }) async {
    try {
      // Upload after-images to storage and create booking_images rows
      if (afterImages != null) {
        for (final imagePath in afterImages) {
          try {
            final file = await _storage.createFile(
              bucketId: AppwriteConfig.bookingImagesBucket,
              fileId: ID.unique(),
              file: InputFile.fromPath(path: imagePath),
            );
            await _tablesDB.createRow(
              databaseId: AppwriteConfig.databaseId,
              tableId: AppwriteConfig.bookingImagesCollection,
              rowId: ID.unique(),
              data: {
                'bookingId': bookingId,
                'type': 'after',
                'fileId': file.$id,
                'url':
                    '${AppwriteConfig.endpoint}/storage/buckets/${AppwriteConfig.bookingImagesBucket}/files/${file.$id}/view?project=${AppwriteConfig.projectId}',
              },
            );
          } catch (_) {
            // Image upload failure should not block completion
          }
        }
      }

      // Use the booking-processor function for proper completion
      final execution = await _functions.createExecution(
        functionId: AppwriteConfig.bookingProcessorFunction,
        body: jsonEncode({
          'action': 'complete_booking',
          'bookingId': bookingId,
          'finalPrice': finalPrice,
          'materialsCost': materialsCost,
        }),
      );

      // Inspect function response for errors
      if (execution.responseStatusCode >= 400) {
        final responseBody = execution.responseBody;
        throw Exception('Server error: $responseBody');
      }
      try {
        final responseData =
            jsonDecode(execution.responseBody) as Map<String, dynamic>;
        if (responseData.containsKey('error')) {
          throw Exception(responseData['error']);
        }
      } on FormatException {
        // JSON parse failure is ok — function may return non-JSON success
      }

      // Re-fetch the updated booking
      return getBookingDetails(bookingId);
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to complete booking');
    }
  }

  // ------------------------------------------------------------------
  // Live location updates during active booking
  // ------------------------------------------------------------------

  @override
  Future<void> updateBookingLocation(
    String bookingId,
    double lat,
    double lng,
  ) async {
    try {
      final user = await _account.get();
      await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workerLocationHistoryCollection,
        rowId: ID.unique(),
        data: {
          'workerId': user.$id,
          'bookingId': bookingId,
          'latitude': lat,
          'longitude': lng,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to update location');
    }
  }

  // ------------------------------------------------------------------
  // Worker availability helpers
  // ------------------------------------------------------------------

  /// Reset worker availability to true (e.g. after cancellation).
  /// Fire-and-forget — callers should not await this.
  @override
  Future<void> resetWorkerAvailability() async {
    try {
      final user = await _account.get();
      await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workersCollection,
        rowId: user.$id,
        data: {'isAvailable': true, 'status': 'ACTIVE'},
      );
    } catch (_) {
      // Best-effort: don't crash the app if this fails
    }
  }

  // ------------------------------------------------------------------
  // Realtime subscriptions
  // ------------------------------------------------------------------
  //
  // NOTE: Appwrite realtime channels don't support query-based filtering.
  // Collection-level subscriptions receive ALL document events because
  // the collections have `read("users")` permissions.
  // Client-side filtering is applied below.
  //
  // FUTURE: Remove collection-level `read("users")`, set per-document
  // `$permissions` with `read("user:<workerId>")` on booking creation,
  // so Appwrite only delivers events to the assigned worker.
  // ------------------------------------------------------------------

  /// Subscribe to new bookings assigned to the current worker.
  /// Filters client-side by workerId and PENDING status.
  @override
  Stream<Map<String, dynamic>> subscribeToNewBookings(String workerId) {
    final sub = AppwriteClient.realtime.subscribe([
      'tablesdb.${AppwriteConfig.databaseId}.tables.${AppwriteConfig.bookingsCollection}.rows',
    ]);

    return sub.stream
        .where((event) {
          final data = event.payload;
          return data['workerId'] == workerId && data['status'] == 'PENDING';
        })
        .map((event) => event.payload);
  }

  /// Subscribe to booking status changes
  @override
  Stream<Map<String, dynamic>> subscribeToBookingUpdates(String bookingId) {
    final sub = AppwriteClient.realtime.subscribe([
      'tablesdb.${AppwriteConfig.databaseId}.tables.${AppwriteConfig.bookingsCollection}.rows.$bookingId',
    ]);
    return sub.stream.map((event) => event.payload);
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  /// Fetch customer info from the customers collection.
  /// Results are cached in-memory to avoid repeated lookups.
  Future<Map<String, dynamic>> _getCustomerInfo(String customerId) async {
    if (customerId.isEmpty) return {};
    if (_customerCache.containsKey(customerId)) {
      return _customerCache[customerId]!;
    }
    try {
      final doc = await _tablesDB.getRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customersCollection,
        rowId: customerId,
      );
      final info = <String, dynamic>{
        'customerFirstName': doc.data['firstName'] ?? '',
        'customerLastName': doc.data['lastName'] ?? '',
        'customerProfileImage': doc.data['profileImage'],
        'customerPhone': doc.data['phone'] ?? '',
      };
      _customerCache[customerId] = info;
      return info;
    } catch (_) {
      // Customer doc not found or permission error – return blanks
      return {};
    }
  }

  /// Enrich a raw booking data map with customer info looked up from the
  /// customers collection, then convert to [BookingModel].
  Future<BookingModel> _enrichAndConvert(Map<String, dynamic> data) async {
    final enriched = Map<String, dynamic>.from(data);
    final customerId = enriched['customerId'] ?? '';
    if (customerId is String && customerId.isNotEmpty) {
      final info = await _getCustomerInfo(customerId);
      enriched.addAll(info);
    }
    return _docToBooking(enriched);
  }

  BookingModel _docToBooking(Map<String, dynamic> data) {
    // Map Appwrite flat document to the nested structure BookingModel expects
    return BookingModel(
      id: data['\$id'] ?? data['_id'] ?? '',
      bookingNumber: data['bookingNumber'] ?? '',
      customer: CustomerInfo(
        id: data['customerId'] ?? '',
        firstName: data['customerFirstName'] ?? '',
        lastName: data['customerLastName'] ?? '',
        profileImage: data['customerProfileImage'],
        phone: data['customerPhone'] ?? '',
      ),
      workerId: data['workerId'],
      serviceCategory: data['serviceCategory'] ?? '',
      problemDescription: data['problemDescription'] ?? '',
      aiDetectedServices: data['aiDetectedServices'] != null
          ? (data['aiDetectedServices'] is String
                ? List<String>.from(jsonDecode(data['aiDetectedServices']))
                : List<String>.from(data['aiDetectedServices']))
          : null,
      address: BookingAddress(
        full: data['addressFull'] ?? '',
        city: data['addressCity'] ?? '',
        coordinates: Coordinates(
          lat: (data['addressLatitude'] ?? 0).toDouble(),
          lng: (data['addressLongitude'] ?? 0).toDouble(),
        ),
      ),
      scheduledDateTime:
          DateTime.tryParse(data['scheduledDateTime'] ?? '') ?? DateTime.now(),
      isUrgent: data['isUrgent'] ?? false,
      status: data['status'] ?? 'PENDING',
      pricing: BookingPricing(
        estimatedPrice: (data['estimatedPrice'] ?? 0).toDouble(),
        finalPrice: (data['finalPrice'] ?? 0).toDouble(),
        laborCost: (data['laborCost'] ?? 0).toDouble(),
        materialsCost: (data['materialsCost'] ?? 0).toDouble(),
        platformFee: (data['platformFee'] ?? 0).toDouble(),
        discount: (data['discount'] ?? 0).toDouble(),
      ),
      estimatedDuration: data['estimatedDuration'],
      actualDuration: data['actualDuration'],
      timeline: (data['timeline'] is List)
          ? (data['timeline'] as List)
                .map(
                  (t) => BookingTimeline(
                    status: t['status'] ?? '',
                    timestamp:
                        DateTime.tryParse(t['timestamp'] ?? '') ??
                        DateTime.now(),
                    note: t['note'],
                  ),
                )
                .toList()
          : [],
      beforeImages: data['images']?['before'] != null
          ? List<String>.from(data['images']['before'])
          : null,
      afterImages: data['images']?['after'] != null
          ? List<String>.from(data['images']['after'])
          : null,
      createdAt:
          DateTime.tryParse(data['\$createdAt'] ?? data['createdAt'] ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(data['\$updatedAt'] ?? data['updatedAt'] ?? '') ??
          DateTime.now(),
    );
  }
}
