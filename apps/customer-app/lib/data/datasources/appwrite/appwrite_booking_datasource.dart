import 'dart:convert';
import 'dart:math' as math;
import 'package:appwrite/appwrite.dart';
import '../../models/booking_model.dart';
import '../../models/worker_model.dart';
import '../../../core/appwrite/appwrite_client.dart';
import '../../../core/appwrite/appwrite_config.dart';
import '../../../core/error/exceptions.dart';
import '../../../domain/repositories/booking_repository.dart';
import '../../../presentation/blocs/booking/booking_state.dart';
import '../remote/booking_remote_datasource.dart';

/// Appwrite-based booking data source
///
/// Replaces the Dio/REST-based BookingRemoteDataSourceImpl.
/// Uses Appwrite Databases for booking CRUD, Functions for AI matching,
/// and Realtime for live updates.
class AppwriteBookingDataSource implements BookingRemoteDataSource {
  final TablesDB _tablesDB;
  final Functions _functions;
  final Account _account;
  final Storage _storage;

  AppwriteBookingDataSource({
    TablesDB? tablesDB,
    Functions? functions,
    Account? account,
    Storage? storage,
  }) : _tablesDB = tablesDB ?? AppwriteClient.tablesDB,
       _functions = functions ?? AppwriteClient.functions,
       _account = account ?? AppwriteClient.account,
       _storage = storage ?? AppwriteClient.storage;

  // ============================================================
  // AI MATCHING (via Appwrite Functions)
  // ============================================================

  @override
  Future<ProblemAnalysisResult> analyzeProblem({
    required String description,
    String? category,
  }) async {
    try {
      final execution = await _functions.createExecution(
        functionId: AppwriteConfig.matchingFunction,
        body: jsonEncode({
          'action': 'analyze_problem',
          'problemDescription': description,
          if (category != null) 'serviceCategory': category,
        }),
      );

      final result = jsonDecode(execution.responseBody);
      return ProblemAnalysisResult.fromJson(result);
    } catch (_) {
      // Fallback: client-side keyword-based analysis
      return _analyzeLocally(description, category);
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
    // Try the cloud function first
    try {
      final execution = await _functions.createExecution(
        functionId: AppwriteConfig.matchingFunction,
        body: jsonEncode({
          'action': 'find_workers',
          'serviceCategory': serviceCategory,
          'location': {'lat': lat, 'lng': lng},
          'scheduledDateTime': scheduledDateTime.toIso8601String(),
          'isUrgent': isUrgent,
        }),
      );

      final result = jsonDecode(execution.responseBody);
      return FindWorkersResult.fromJson(result);
    } catch (_) {
      // Fallback: query workers collection directly
      return _findWorkersLocally(serviceCategory, lat, lng);
    }
  }

  @override
  Future<PriceEstimate> estimatePrice({
    required String serviceCategory,
    required String problemDescription,
    required String city,
  }) async {
    try {
      final execution = await _functions.createExecution(
        functionId: AppwriteConfig.matchingFunction,
        body: jsonEncode({
          'action': 'estimate_price',
          'serviceCategory': serviceCategory,
          'problemDescription': problemDescription,
          'location': {'city': city},
        }),
      );

      final result = jsonDecode(execution.responseBody);
      return PriceEstimate.fromJson(result);
    } catch (_) {
      // Fallback: local price baselines
      return _estimatePriceLocally(serviceCategory);
    }
  }

  @override
  Future<int> estimateDuration({
    required String serviceCategory,
    required String problemDescription,
  }) async {
    try {
      final execution = await _functions.createExecution(
        functionId: AppwriteConfig.matchingFunction,
        body: jsonEncode({
          'action': 'estimate_duration',
          'serviceCategory': serviceCategory,
          'problemDescription': problemDescription,
        }),
      );

      final result = jsonDecode(execution.responseBody);
      return result['estimatedMinutes'] ?? 60;
    } catch (_) {
      // Fallback: fixed estimate per category
      return _estimateDurationLocally(serviceCategory);
    }
  }

  // ============================================================
  // BOOKING CRUD (via Appwrite Databases)
  // ============================================================

  @override
  Future<CreateBookingResult> createBooking(
    BookingCreateRequest request,
  ) async {
    try {
      final user = await _account.get();

      // Get customer document ID
      final customerDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customersCollection,
        queries: [Query.equal('userId', user.$id)],
      );

      if (customerDocs.rows.isEmpty) {
        throw Exception(
          'Customer profile not found. Please complete your profile setup first.',
        );
      }

      final customerId = customerDocs.rows.first.$id;

      // Generate booking number
      final now = DateTime.now();
      final dateStr =
          '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';
      final random = now.millisecondsSinceEpoch.toString().substring(7);
      final bookingNumber = 'HG-$dateStr-$random';

      // Convert display category name to Appwrite enum format
      final categoryEnum = _toCategoryEnum(request.serviceCategory);
      final requestJson = request.toJson();

      // Create booking document
      final doc = await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        rowId: ID.unique(),
        data: {
          'bookingNumber': bookingNumber,
          'customerId': customerId,
          'serviceCategory': categoryEnum,
          'problemDescription': request.problemDescription,
          'addressFull': requestJson['address']?['full'] ?? '',
          'addressCity': requestJson['address']?['city'] ?? '',
          'addressLatitude': requestJson['address']?['coordinates']?['lat'],
          'addressLongitude': requestJson['address']?['coordinates']?['lng'],
          'scheduledDateTime':
              requestJson['scheduledDateTime'] ?? now.toIso8601String(),
          'isUrgent': request.isUrgent,
          'status': 'PENDING',
          'paymentMethod': request.paymentMethod,
          'paymentStatus': 'PENDING',
        },
      );

      // Add timeline entry
      await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingTimelineCollection,
        rowId: ID.unique(),
        data: {
          'bookingId': doc.$id,
          'status': 'PENDING',
          'timestamp': now.toIso8601String(),
          'note': 'Booking created',
        },
      );

      // Upload booking images if any
      final imagePaths = request.images;
      if (imagePaths != null && imagePaths.isNotEmpty) {
        for (final path in imagePaths) {
          try {
            final file = await _storage.createFile(
              bucketId: AppwriteConfig.bookingImagesBucket,
              fileId: ID.unique(),
              file: InputFile.fromPath(path: path),
            );
            await _tablesDB.createRow(
              databaseId: AppwriteConfig.databaseId,
              tableId: AppwriteConfig.bookingImagesCollection,
              rowId: ID.unique(),
              data: {
                'bookingId': doc.$id,
                'type': 'before',
                'fileId': file.$id,
                'url':
                    '${AppwriteConfig.endpoint}/storage/buckets/${AppwriteConfig.bookingImagesBucket}/files/${file.$id}/view?project=${AppwriteConfig.projectId}',
              },
            );
          } catch (_) {
            // Image upload failure should not block booking creation
          }
        }
      }

      return CreateBookingResult.fromJson({
        'success': true,
        'data': {'booking': _docToBookingJson(doc)},
      });
    } on AppwriteException catch (e) {
      throw _handleError(e);
    } catch (e) {
      throw ServerException(message: e.toString(), statusCode: 500);
    }
  }

  @override
  Future<BookingModel> selectWorker({
    required String bookingId,
    required String workerId,
  }) async {
    try {
      final doc = await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        rowId: bookingId,
        data: {'workerId': workerId},
      );

      // Add timeline entry
      await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingTimelineCollection,
        rowId: ID.unique(),
        data: {
          'bookingId': bookingId,
          'status': 'WORKER_SELECTED',
          'timestamp': DateTime.now().toIso8601String(),
          'note': 'Worker selected',
        },
      );

      // Trigger notification to worker
      try {
        await _functions.createExecution(
          functionId: AppwriteConfig.notificationSenderFunction,
          body: jsonEncode({
            'action': 'send_template',
            'recipientId': workerId,
            'template': 'worker_assigned',
            'variables': {'workerName': 'You'},
            'extraData': {'bookingId': bookingId},
          }),
        );
      } catch (_) {
        // Don't fail the booking if notification fails
      }

      return BookingModel.fromJson(_docToBookingJson(doc));
    } on AppwriteException catch (e) {
      throw _handleError(e);
    }
  }

  @override
  Future<void> cancelBooking({
    required String bookingId,
    required String reason,
  }) async {
    try {
      await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        rowId: bookingId,
        data: {
          'status': 'CANCELLED',
          'cancelledBy': 'CUSTOMER',
          'cancellationReason': reason,
          'cancelledAt': DateTime.now().toIso8601String(),
        },
      );

      await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingTimelineCollection,
        rowId: ID.unique(),
        data: {
          'bookingId': bookingId,
          'status': 'CANCELLED',
          'timestamp': DateTime.now().toIso8601String(),
          'note': 'Cancelled by customer: $reason',
        },
      );

      // Notify worker if one was assigned
      try {
        final bookingDoc = await _tablesDB.getRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.bookingsCollection,
          rowId: bookingId,
        );
        final workerId = bookingDoc.data['workerId'];
        if (workerId != null && workerId.toString().isNotEmpty) {
          // Reset worker availability
          try {
            await _tablesDB.updateRow(
              databaseId: AppwriteConfig.databaseId,
              tableId: AppwriteConfig.workersCollection,
              rowId: workerId,
              data: {'isAvailable': true, 'status': 'ACTIVE'},
            );
          } catch (_) {}

          await _functions.createExecution(
            functionId: AppwriteConfig.notificationSenderFunction,
            body: jsonEncode({
              'action': 'send_template',
              'recipientId': workerId,
              'template': 'booking_cancelled',
              'extraData': {'bookingId': bookingId},
            }),
          );
        }
      } catch (_) {
        // Non-critical
      }
    } on AppwriteException catch (e) {
      throw _handleError(e);
    }
  }

  @override
  Future<BookingsListResult> getCustomerBookings({
    String? status,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final user = await _account.get();
      final customerDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customersCollection,
        queries: [Query.equal('userId', user.$id)],
      );

      if (customerDocs.rows.isEmpty) {
        return BookingsListResult.fromJson({
          'success': true,
          'data': {
            'bookings': [],
            'pagination': {'total': 0},
          },
        });
      }

      final customerId = customerDocs.rows.first.$id;

      final queries = <String>[
        Query.equal('customerId', customerId),
        Query.orderDesc('\$createdAt'),
        Query.limit(limit),
        Query.offset((page - 1) * limit),
      ];

      if (status != null &&
          status.isNotEmpty &&
          status.toLowerCase() != 'all') {
        queries.add(Query.equal('status', status));
      }

      final docs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        queries: queries,
      );

      final bookings = docs.rows.map((doc) => _docToBookingJson(doc)).toList();

      return BookingsListResult.fromJson({
        'success': true,
        'data': {
          'bookings': bookings,
          'pagination': {
            'total': docs.total,
            'page': page,
            'limit': limit,
            'totalPages': (docs.total / limit).ceil(),
          },
        },
      });
    } on AppwriteException catch (e) {
      throw _handleError(e);
    }
  }

  @override
  Future<BookingModel> getBookingDetails(String bookingId) async {
    try {
      final doc = await _tablesDB.getRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        rowId: bookingId,
      );

      // Fetch timeline
      final timelineDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingTimelineCollection,
        queries: [
          Query.equal('bookingId', bookingId),
          Query.orderAsc('timestamp'),
        ],
      );

      final bookingJson = _docToBookingJson(doc);
      bookingJson['timeline'] = timelineDocs.rows
          .map(
            (t) => {
              'status': t.data['status'],
              'timestamp': t.data['timestamp'],
              'note': t.data['note'],
            },
          )
          .toList();

      return BookingModel.fromJson(bookingJson);
    } on AppwriteException catch (e) {
      throw _handleError(e);
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
      final user = await _account.get();
      final customerDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customersCollection,
        queries: [Query.equal('userId', user.$id)],
      );

      final booking = await _tablesDB.getRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        rowId: bookingId,
      );

      // Create review document
      await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.reviewsCollection,
        rowId: ID.unique(),
        data: {
          'bookingId': bookingId,
          'customerId': customerDocs.rows.first.$id,
          'workerId': booking.data['workerId'],
          'rating': rating,
          if (review != null) 'review': review,
          if (categoryRatings?['punctuality'] != null)
            'punctuality': categoryRatings!['punctuality'],
          if (categoryRatings?['quality'] != null)
            'quality': categoryRatings!['quality'],
          if (categoryRatings?['professionalism'] != null)
            'professionalism': categoryRatings!['professionalism'],
          if (categoryRatings?['value'] != null)
            'value': categoryRatings!['value'],
        },
      );

      // Update booking with rating
      await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.bookingsCollection,
        rowId: bookingId,
        data: {
          'ratingScore': rating,
          if (review != null) 'ratingReview': review,
        },
      );

      // Trigger trust score recalculation via function
      try {
        await _functions.createExecution(
          functionId: AppwriteConfig.trustCalculatorFunction,
          body: jsonEncode({
            'action': 'update_rating',
            'workerId': booking.data['workerId'],
            'newRating': rating,
          }),
        );
      } catch (_) {
        // Don't fail rating if trust calc fails
      }
    } on AppwriteException catch (e) {
      throw _handleError(e);
    }
  }

  @override
  Future<WorkerLocationResponse> getWorkerLocation(String bookingId) async {
    try {
      final locationDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workerLocationHistoryCollection,
        queries: [
          Query.equal('bookingId', bookingId),
          Query.orderDesc('timestamp'),
          Query.limit(1),
        ],
      );

      if (locationDocs.rows.isEmpty) {
        return WorkerLocationResponse.fromJson({
          'success': true,
          'data': {'location': null},
        });
      }

      final loc = locationDocs.rows.first;
      return WorkerLocationResponse.fromJson({
        'success': true,
        'data': {
          'location': {
            'lat': loc.data['latitude'],
            'lng': loc.data['longitude'],
            'timestamp': loc.data['timestamp'],
          },
        },
      });
    } on AppwriteException catch (e) {
      throw _handleError(e);
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
      final user = await _account.get();

      // Create SOS document
      final doc = await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.sosCollection,
        rowId: ID.unique(),
        data: {
          if (bookingId != null) 'bookingId': bookingId,
          'initiatedByType': 'CUSTOMER',
          'initiatedByUserId': user.$id,
          'priority': 'HIGH',
          'reason': reason,
          'description': description,
          'latitude': lat,
          'longitude': lng,
          'status': 'ACTIVE',
        },
      );

      // Trigger SOS analyzer function for AI priority assessment
      try {
        await _functions.createExecution(
          functionId: AppwriteConfig.sosAnalyzerFunction,
          body: jsonEncode({
            'sosId': doc.$id,
            'reason': reason,
            'description': description,
          }),
        );
      } catch (_) {
        // SOS created even if analysis fails
      }

      // Send SOS notification to admins via broadcast
      try {
        await _functions.createExecution(
          functionId: AppwriteConfig.notificationSenderFunction,
          body: jsonEncode({
            'action': 'send',
            'recipientId': user.$id, // Self-notification as confirmation
            'type': 'SOS',
            'title': '🚨 SOS Alert Sent',
            'body': 'Your emergency alert has been sent. Help is on the way.',
            'data': {'sosId': doc.$id, 'bookingId': bookingId},
          }),
        );
      } catch (_) {
        // Non-critical
      }

      return SOSTriggerResult.fromJson({
        'success': true,
        'data': {
          'sosId': doc.$id,
          'priority': 'HIGH',
          'message': 'SOS alert sent. Help is on the way.',
        },
      });
    } on AppwriteException catch (e) {
      throw _handleError(e);
    }
  }

  // ============================================================
  // REALTIME SUBSCRIPTIONS (new - replaces polling)
  // ============================================================
  //
  // NOTE on Appwrite Realtime & Permissions:
  // All collections currently have collection-level `read("users")` which means
  // every authenticated user receives every document event via realtime.
  // Appwrite's realtime channels don't support query-based filtering — the only
  // server-side filter is subscribing to a specific document ID.
  //
  // Where we know the document ID (e.g. booking tracking), we subscribe to the
  // specific document channel. Where we don't (e.g. worker location, chat),
  // we subscribe to the collection and filter client-side.
  //
  // FUTURE OPTIMIZATION: Remove `read("users")` from collection permissions and
  // set per-document `$permissions` (e.g. read("user:<customerId>")) on every
  // document creation. This would make Appwrite only deliver realtime events
  // to the relevant users, eliminating the need for client-side filtering.
  // ============================================================

  /// Subscribe to booking status changes in real-time.
  /// Uses document-level channel for efficient server-side filtering.
  /// Returns a RealtimeSubscription that can be cancelled.
  RealtimeSubscription subscribeToBooking(
    String bookingId,
    void Function(Map<String, dynamic> data) onUpdate,
  ) {
    final subscription = AppwriteClient.realtime.subscribe([
      'tablesdb.${AppwriteConfig.databaseId}.tables.${AppwriteConfig.bookingsCollection}.rows.$bookingId',
    ]);

    subscription.stream.listen((event) {
      if (event.payload.isNotEmpty) {
        onUpdate(event.payload);
      }
    });

    return subscription;
  }

  /// Subscribe to worker location updates for a booking.
  /// Subscribes to the entire collection because document IDs for new location
  /// entries are unknown ahead of time. Client-side filter by bookingId.
  /// See NOTE above about per-document permissions as future optimization.
  RealtimeSubscription subscribeToWorkerLocation(
    String bookingId,
    void Function(double lat, double lng) onLocationUpdate,
  ) {
    final subscription = AppwriteClient.realtime.subscribe([
      'tablesdb.${AppwriteConfig.databaseId}.tables.${AppwriteConfig.workerLocationHistoryCollection}.rows',
    ]);

    subscription.stream.listen((event) {
      if (event.payload.isNotEmpty && event.payload['bookingId'] == bookingId) {
        onLocationUpdate(
          (event.payload['latitude'] as num).toDouble(),
          (event.payload['longitude'] as num).toDouble(),
        );
      }
    });

    return subscription;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /// Convert Appwrite document to booking JSON matching existing model
  Map<String, dynamic> _docToBookingJson(dynamic doc) {
    final data = doc.data is Map<String, dynamic>
        ? doc.data as Map<String, dynamic>
        : <String, dynamic>{};
    return {
      '_id': doc.$id,
      'id': doc.$id,
      'bookingNumber': data['bookingNumber'],
      'customer': data['customerId'],
      'worker': data['workerId'],
      'serviceCategory': data['serviceCategory'],
      'problemDescription': data['problemDescription'],
      'address': {
        'full': data['addressFull'],
        'city': data['addressCity'],
        'coordinates': {
          'lat': data['addressLatitude'],
          'lng': data['addressLongitude'],
        },
      },
      'scheduledDateTime': data['scheduledDateTime'],
      'isUrgent': data['isUrgent'] ?? false,
      'status': data['status'],
      'pricing': {
        'estimatedPrice': data['estimatedPrice'],
        'finalPrice': data['finalPrice'],
        'laborCost': data['laborCost'],
        'materialsCost': data['materialsCost'],
        'platformFee': data['platformFee'],
        'discount': data['discount'],
      },
      'estimatedDuration': data['estimatedDuration'],
      'actualDuration': data['actualDuration'],
      'payment': {
        'method': data['paymentMethod'],
        'status': data['paymentStatus'],
        'transactionId': data['transactionId'],
      },
      'rating': {'score': data['ratingScore'], 'review': data['ratingReview']},
      'cancellation': {
        'cancelledBy': data['cancelledBy'],
        'reason': data['cancellationReason'],
        'timestamp': data['cancelledAt'],
      },
      'createdAt': doc.$createdAt,
      'updatedAt': doc.$updatedAt,
    };
  }

  // ============================================================
  // CLIENT-SIDE FALLBACKS (used when Appwrite Functions unavailable)
  // ============================================================

  /// Query workers collection directly and build matched results
  Future<FindWorkersResult> _findWorkersLocally(
    String serviceCategory,
    double lat,
    double lng,
  ) async {
    try {
      // 1. Get workers with matching skills
      final skillsDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.workerSkillsCollection,
        queries: [Query.equal('category', serviceCategory), Query.limit(50)],
      );

      // Also try to find workers directly if no skill entries found
      // (workers may have registered but skills weren't saved to separate collection)
      Set<String> workerIds = {};
      final skillsByWorker = <String, Map<String, dynamic>>{};

      if (skillsDocs.rows.isNotEmpty) {
        for (final row in skillsDocs.rows) {
          final wId = row.data['workerId'] as String? ?? '';
          if (wId.isNotEmpty) {
            workerIds.add(wId);
            skillsByWorker[wId] = row.data;
          }
        }
      }

      // Fallback: query workers collection directly for available workers
      // This covers cases where skills weren't saved to workerSkills collection
      if (workerIds.isEmpty) {
        try {
          final workerDocs = await _tablesDB.listRows(
            databaseId: AppwriteConfig.databaseId,
            tableId: AppwriteConfig.workersCollection,
            queries: [Query.equal('isAvailable', true), Query.limit(20)],
          );
          for (final doc in workerDocs.rows) {
            workerIds.add(doc.$id);
          }
        } catch (_) {
          // If this also fails, we'll return empty
        }
      }

      if (workerIds.isEmpty) {
        return FindWorkersResult(
          workers: [],
          totalAvailable: 0,
          priceEstimate: _estimatePriceLocally(serviceCategory),
        );
      }

      // 2. Fetch worker profiles
      final workers = <MatchedWorkerModel>[];
      for (final wId in workerIds.take(20)) {
        try {
          final workerDoc = await _tablesDB.getRow(
            databaseId: AppwriteConfig.databaseId,
            tableId: AppwriteConfig.workersCollection,
            rowId: wId,
          );
          final d = workerDoc.data;
          final status = d['status'] as String? ?? '';
          // Accept ACTIVE workers, plus PENDING_VERIFICATION workers who
          // are marked available (they've completed their profile setup)
          final isAvailable = d['isAvailable'] == true;
          if (status == 'SUSPENDED' || status == 'INACTIVE') continue;
          if (status == 'PENDING_VERIFICATION' && !isAvailable) continue;

          // Rough distance in km (Haversine simplified)
          final wLat = (d['locationLatitude'] as num?)?.toDouble() ?? 0.0;
          final wLng = (d['locationLongitude'] as num?)?.toDouble() ?? 0.0;
          final dist = _haversineKm(lat, lng, wLat, wLng);

          final skill = skillsByWorker[wId];
          final hourlyRate =
              (skill?['hourlyRate'] as num?)?.toDouble() ?? 500.0;
          final ratingAvg = (d['ratingAverage'] as num?)?.toDouble() ?? 0.0;
          final ratingCount = (d['ratingCount'] as num?)?.toInt() ?? 0;
          final trustScore = (d['trustScore'] as num?)?.toInt() ?? 50;
          final experience = (skill?['experience'] as num?)?.toInt() ?? 0;

          // Match score: distance 25%, rating 25%, trust 20%, experience 15%, workload 15%
          double distScore = dist > 0 ? (1 - (dist / 50.0)).clamp(0, 1) : 1.0;
          double ratingScore = ratingAvg / 5.0;
          double trustScoreNorm = trustScore / 100.0;
          double expScore = (experience / 10.0).clamp(0, 1);
          double matchScore =
              distScore * 0.25 +
              ratingScore * 0.25 +
              trustScoreNorm * 0.20 +
              expScore * 0.15 +
              0.15; // baseline workload score

          workers.add(
            MatchedWorkerModel(
              workerId: wId,
              name: '${d['firstName'] ?? ''} ${d['lastName'] ?? ''}'.trim(),
              profileImage: d['profileImage'] as String?,
              rating: ratingAvg,
              ratingCount: ratingCount,
              trustScore: trustScore,
              distance: dist,
              estimatedArrival: (dist * 3).clamp(5, 120).toInt(),
              matchScore: matchScore,
              hourlyRate: hourlyRate,
              skills: [serviceCategory],
            ),
          );
        } catch (_) {
          // Skip unavailable worker
        }
      }

      // Sort by match score descending
      workers.sort((a, b) => b.matchScore.compareTo(a.matchScore));

      return FindWorkersResult(
        workers: workers.take(10).toList(),
        totalAvailable: workers.length,
        priceEstimate: _estimatePriceLocally(serviceCategory),
      );
    } on AppwriteException catch (e) {
      throw _handleError(e);
    }
  }

  /// Haversine distance in kilometres
  double _haversineKm(double lat1, double lng1, double lat2, double lng2) {
    if (lat2 == 0 && lng2 == 0) return 5.0; // default if no location stored
    const r = 6371.0;
    final dLat = _deg2rad(lat2 - lat1);
    final dLng = _deg2rad(lng2 - lng1);
    final a =
        math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_deg2rad(lat1)) *
            math.cos(_deg2rad(lat2)) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return r * c;
  }

  double _deg2rad(double deg) => deg * math.pi / 180.0;

  /// Local problem analysis using keyword matching with expanded vocabulary
  ProblemAnalysisResult _analyzeLocally(String description, String? category) {
    final lower = description.toLowerCase().trim();
    // Expanded keywords: English + common Pakistani/Urdu/Roman Urdu terms
    final Map<String, List<String>> keywords = {
      'PLUMBING': [
        'leak',
        'leaking',
        'leaks',
        'leaked',
        'pipe',
        'pipes',
        'piping',
        'pipeline',
        'tap',
        'taps',
        'nulka',
        'nalka',
        'drain',
        'drainage',
        'clogged drain',
        'blocked drain',
        'toilet',
        'commode',
        'flush',
        'latrine',
        'water leak',
        'water pipe',
        'water tank',
        'tanki',
        'faucet',
        'sink',
        'basin',
        'bathroom',
        'washroom',
        'shower',
        'bathtub',
        'geyser',
        'water heater',
        'hot water',
        'sewage',
        'sewer',
        'nali',
        'gutter',
        'plumber',
        'plumbing',
        'water supply',
        'water not coming',
        'no water',
        'pani',
        'pani nahi',
        'pani leak',
        'overflow',
        'dripping',
        'drip',
        'valve',
        'stopcock',
        'water motor',
        'pump',
      ],
      'ELECTRICAL': [
        'switch',
        'switches',
        'switchboard',
        'wire',
        'wires',
        'wiring',
        'rewiring',
        'socket',
        'plug',
        'outlet',
        'extension',
        'light',
        'lights',
        'lighting',
        'bulb',
        'tube light',
        'led',
        'fan',
        'ceiling fan',
        'exhaust fan',
        'pankha',
        'short circuit',
        'short',
        'sparking',
        'spark',
        'power',
        'power cut',
        'tripping',
        'trip',
        'electricity',
        'bijli',
        'current',
        'electrician',
        'electrical',
        'circuit breaker',
        'breaker',
        'mcb',
        'db board',
        'fuse',
        'fused',
        'voltage',
        'fluctuation',
        'stabilizer',
        'inverter',
        'ups',
        'generator',
        'meter',
        'electric meter',
        'earthing',
        'grounding',
        'chandelier',
        'spotlight',
        'not working',
        'stopped working',
      ],
      'CLEANING': [
        'clean',
        'cleaning',
        'cleaner',
        'wash',
        'washing',
        'dust',
        'dusty',
        'dusting',
        'mop',
        'mopping',
        'vacuum',
        'vacuuming',
        'sweep',
        'sweeping',
        'stain',
        'stains',
        'spot',
        'spots',
        'sanitize',
        'sanitization',
        'disinfect',
        'deep clean',
        'deep cleaning',
        'carpet clean',
        'carpet',
        'rug',
        'sofa cleaning',
        'upholstery',
        'window cleaning',
        'glass cleaning',
        'kitchen cleaning',
        'bathroom cleaning',
        'washroom cleaning',
        'office cleaning',
        'safai',
        'saaf',
        'dhulai',
        'pest control',
        'fumigation',
        'water tank cleaning',
        'tank cleaning',
        'floor',
        'polish',
        'polishing',
        'tile',
      ],
      'AC_REPAIR': [
        'ac',
        'a/c',
        'a.c',
        'air conditioner',
        'air conditioning',
        'cooling',
        'not cooling',
        'cool nahi',
        'compressor',
        'hvac',
        'ac repair',
        'ac service',
        'ac servicing',
        'ac install',
        'ac installation',
        'ac gas',
        'gas refill',
        'gas bharwana',
        'split ac',
        'window ac',
        'inverter ac',
        'ac leak',
        'ac dripping',
        'ac noise',
        'thermostat',
        'remote',
        'filter',
        'ac filter',
        'ac clean',
        'thanda',
        'thanda nahi ho raha',
        'condenser',
        'evaporator',
        'coil',
      ],
      'CARPENTER': [
        'wood',
        'wooden',
        'timber',
        'plywood',
        'door',
        'doors',
        'darwaza',
        'cabinet',
        'cabinets',
        'kitchen cabinet',
        'shelf',
        'shelves',
        'shelving',
        'rack',
        'furniture',
        'furnishing',
        'table',
        'desk',
        'counter',
        'chair',
        'chairs',
        'stool',
        'cupboard',
        'almari',
        'almirah',
        'wardrobe',
        'carpenter',
        'carpentry',
        'mistri',
        'bed',
        'cot',
        'palang',
        'drawer',
        'drawers',
        'window frame',
        'door frame',
        'partition',
        'panel',
        'paneling',
        'hinge',
        'lock',
        'handle',
        'knob',
        'termite',
        'deemak',
        'woodworm',
        'polish',
        'varnish',
        'laminate',
      ],
      'PAINTING': [
        'paint',
        'painting',
        'painter',
        'rang',
        'wall paint',
        'wall',
        'walls',
        'color',
        'colour',
        'coat',
        'coating',
        'recoat',
        'primer',
        'whitewash',
        'safedi',
        'distemper',
        'enamel',
        'texture',
        'textured',
        'emulsion',
        'interior painting',
        'exterior painting',
        'ceiling paint',
        'waterproof',
        'waterproofing',
        'damp',
        'seepage',
        'moisture',
        'peeling',
        'cracking',
        'crack',
        'putty',
        'wall putty',
        'spray paint',
        'stencil',
        'design',
      ],
      'MECHANIC': [
        'car',
        'vehicle',
        'gaari',
        'gari',
        'bike',
        'motorcycle',
        'motorbike',
        'scooter',
        'engine',
        'motor',
        'tyre',
        'tire',
        'puncture',
        'flat tire',
        'brake',
        'brakes',
        'break pad',
        'oil change',
        'oil',
        'mechanic',
        'workshop',
        'battery',
        'dead battery',
        'dent',
        'denting',
        'scratch',
        'scratches',
        'radiator',
        'coolant',
        'overheat',
        'clutch',
        'gear',
        'transmission',
        'suspension',
        'shock',
        'shock absorber',
        'ac repair car',
        'car ac',
        'service',
        'tuning',
        'tune up',
        'starter',
        'alternator',
        'windshield',
        'wiper',
        'headlight',
        'indicator',
      ],
      'GENERAL_HANDYMAN': [
        'handyman',
        'handy man',
        'helper',
        'odd job',
        'small job',
        'chota kaam',
        'mounting',
        'mount',
        'wall mount',
        'tv mount',
        'hanging',
        'hang',
        'picture',
        'frame',
        'assembly',
        'assemble',
        'ikea',
        'curtain rod',
        'curtain',
        'parda',
        'towel rack',
        'towel bar',
        'install',
        'installation',
        'fix',
        'fixing',
        'repair',
        'broken',
        'damage',
        'damaged',
        'replace',
        'replacement',
        'maintenance',
        'general',
        'drill',
        'drilling',
        'hole',
        'anchor',
        'screw',
        'bolt',
        'nail',
        'caulk',
        'seal',
        'sealant',
        'grout',
        'tile repair',
        'kaam',
        'marammat',
      ],
    };

    // Weighted keyword matching: longer/more-specific phrases score higher
    final detected = <String>[];
    final scores = <String, double>{};
    double maxConf = 0.0;

    for (final entry in keywords.entries) {
      double weightedHits = 0;
      int rawHits = 0;
      for (final kw in entry.value) {
        if (lower.contains(kw)) {
          rawHits++;
          // Multi-word phrases are more specific, weight them higher
          final wordCount = kw.split(' ').length;
          weightedHits += wordCount >= 2 ? 2.0 : 1.0;
        }
      }
      if (rawHits > 0) {
        // Accept even a single keyword match — false positives are
        // preferable to missing the correct category
        detected.add(entry.key);
        // Confidence: base 0.5 for single match, scales up with more hits
        final conf = (0.5 + (weightedHits / entry.value.length) * 0.5).clamp(
          0.0,
          1.0,
        );
        scores[entry.key] = conf;
        if (conf > maxConf) maxConf = conf;
      }
    }

    // Sort detected services by confidence (highest first)
    detected.sort((a, b) => (scores[b] ?? 0).compareTo(scores[a] ?? 0));

    // Ensure user-selected category is included at front
    if (category != null && !detected.contains(category)) {
      detected.insert(0, category);
      if (maxConf < 0.5) maxConf = 0.5;
    }
    if (detected.isEmpty) {
      detected.add(category ?? 'GENERAL_HANDYMAN');
      maxConf = category != null ? 0.6 : 0.4;
    }

    // Urgency detection with expanded terms
    final isUrgent =
        lower.contains('urgent') ||
        lower.contains('emergency') ||
        lower.contains('asap') ||
        lower.contains('fori') ||
        lower.contains('jaldi') ||
        lower.contains('immediately') ||
        lower.contains('right now') ||
        lower.contains('abhi');

    return ProblemAnalysisResult(
      detectedServices: detected,
      confidence: maxConf,
      suggestedQuestions: [],
      urgencyLevel: isUrgent ? 'HIGH' : 'LOW',
    );
  }

  /// Local price estimate by category
  PriceEstimate _estimatePriceLocally(String serviceCategory) {
    const baselines = {
      'PLUMBING': {'min': 500, 'max': 3000, 'avg': 1500},
      'ELECTRICAL': {'min': 500, 'max': 3500, 'avg': 1800},
      'CLEANING': {'min': 1000, 'max': 5000, 'avg': 2500},
      'AC_REPAIR': {'min': 1000, 'max': 5000, 'avg': 2500},
      'CARPENTER': {'min': 800, 'max': 4000, 'avg': 2000},
      'PAINTING': {'min': 2000, 'max': 10000, 'avg': 5000},
      'MECHANIC': {'min': 500, 'max': 5000, 'avg': 2000},
      'GENERAL_HANDYMAN': {'min': 500, 'max': 3000, 'avg': 1500},
    };

    final b = baselines[serviceCategory] ?? baselines['GENERAL_HANDYMAN']!;
    final mn = (b['min']!).toDouble();
    final mx = (b['max']!).toDouble();
    final avg = (b['avg']!).toDouble();
    final fee = (avg * 0.10).roundToDouble();

    return PriceEstimate(
      min: mn,
      max: mx,
      average: avg,
      laborCostMin: mn * 0.7,
      laborCostMax: mx * 0.7,
      estimatedMaterialsMin: mn * 0.2,
      estimatedMaterialsMax: mx * 0.2,
      platformFee: fee,
    );
  }

  /// Local duration estimate by category
  int _estimateDurationLocally(String serviceCategory) {
    const durations = {
      'PLUMBING': 60,
      'ELECTRICAL': 45,
      'CLEANING': 120,
      'AC_REPAIR': 90,
      'CARPENTER': 120,
      'PAINTING': 240,
      'MECHANIC': 90,
      'GENERAL_HANDYMAN': 60,
    };
    return durations[serviceCategory] ?? 60;
  }

  /// Convert display category name to Appwrite enum value.
  ///
  /// The UI uses human-readable names like 'Plumbing', 'AC Repair', etc.
  /// but the bookings collection has a strict enum with values like
  /// 'PLUMBING', 'AC_REPAIR', etc.
  String _toCategoryEnum(String category) {
    switch (category.toLowerCase().trim()) {
      case 'plumbing':
        return 'PLUMBING';
      case 'electrical':
        return 'ELECTRICAL';
      case 'cleaning':
        return 'CLEANING';
      case 'ac repair':
        return 'AC_REPAIR';
      case 'carpenter':
        return 'CARPENTER';
      case 'painting':
        return 'PAINTING';
      case 'mechanic':
        return 'MECHANIC';
      case 'general handyman':
      case 'handyman':
        return 'GENERAL_HANDYMAN';
      default:
        // Already in enum format or unknown — normalize anyway
        return category.toUpperCase().replaceAll(' ', '_');
    }
  }

  Exception _handleError(AppwriteException e) {
    final code = e.code;
    final message = e.message ?? 'An error occurred';

    if (code == 401) {
      return AuthException(message: message);
    } else if (code == 400) {
      return ValidationException(message: message);
    } else if (code == 404) {
      return NotFoundException(message: message);
    } else if (code == 429) {
      return const RateLimitException(
        message: 'Too many requests. Please wait.',
      );
    }
    return ServerException(message: message);
  }
}
