import 'package:flutter_test/flutter_test.dart';
import 'package:worker_app/data/models/booking_model.dart';

/// Comprehensive tests for BookingModel and its nested models:
/// BookingAddress, BookingPricing, BookingTimeline, CustomerInfo.
///
/// All tests use pure fromJson/toJson round-trips — no mocking needed.

void main() {
  // ── Full JSON fixture ─────────────────────────────────────
  final fullJson = <String, dynamic>{
    '_id': 'booking123',
    'bookingNumber': 'HG-20260301-00001',
    'customer': {
      '_id': 'cust1',
      'firstName': 'Ali',
      'lastName': 'Khan',
      'profileImage': 'https://example.com/ali.png',
      'user': {'phone': '+923001234567'},
    },
    'worker': 'worker456',
    'serviceCategory': 'PLUMBING',
    'problemDescription': 'Kitchen tap leaking',
    'aiDetectedServices': ['pipe_repair', 'tap_replacement'],
    'address': {
      'full': '123 Main Street, F-8',
      'city': 'Islamabad',
      'coordinates': {'lat': 33.7294, 'lng': 73.0931},
    },
    'scheduledDateTime': '2026-03-01T10:00:00.000Z',
    'isUrgent': true,
    'status': 'IN_PROGRESS',
    'pricing': {
      'estimatedPrice': 2500.0,
      'finalPrice': 2800.0,
      'laborCost': 2000.0,
      'materialsCost': 500.0,
      'platformFee': 200.0,
      'discount': 100.0,
    },
    'estimatedDuration': 60,
    'actualDuration': 75,
    'timeline': [
      {
        'status': 'PENDING',
        'timestamp': '2026-03-01T08:00:00.000Z',
        'note': 'Booking created',
      },
      {
        'status': 'ACCEPTED',
        'timestamp': '2026-03-01T08:05:00.000Z',
        'note': null,
      },
    ],
    'images': {
      'before': ['https://example.com/before1.jpg'],
      'after': ['https://example.com/after1.jpg'],
    },
    'createdAt': '2026-03-01T07:59:00.000Z',
    'updatedAt': '2026-03-01T09:30:00.000Z',
  };

  // ── BookingAddress ────────────────────────────────────────

  group('BookingAddress', () {
    test('fromJson parses all fields', () {
      final addr = BookingAddress.fromJson({
        'full': '456 Street',
        'city': 'Lahore',
        'coordinates': {'lat': 31.5204, 'lng': 74.3587},
      });
      expect(addr.full, '456 Street');
      expect(addr.city, 'Lahore');
      expect(addr.coordinates.lat, 31.5204);
      expect(addr.coordinates.lng, 74.3587);
    });

    test('fromJson handles missing fields gracefully', () {
      final addr = BookingAddress.fromJson({});
      expect(addr.full, '');
      expect(addr.city, '');
    });

    test('toJson round-trips correctly', () {
      final addr = BookingAddress.fromJson({
        'full': '789 Road',
        'city': 'Karachi',
        'coordinates': {'lat': 24.8607, 'lng': 67.0011},
      });
      final json = addr.toJson();
      expect(json['full'], '789 Road');
      expect(json['city'], 'Karachi');
      expect(json['coordinates']['lat'], 24.8607);
    });
  });

  // ── BookingPricing ────────────────────────────────────────

  group('BookingPricing', () {
    test('fromJson parses all price fields', () {
      final pricing = BookingPricing.fromJson({
        'estimatedPrice': 2500,
        'finalPrice': 2800,
        'laborCost': 2000,
        'materialsCost': 500,
        'platformFee': 200,
        'discount': 100,
      });
      expect(pricing.estimatedPrice, 2500.0);
      expect(pricing.finalPrice, 2800.0);
      expect(pricing.laborCost, 2000.0);
      expect(pricing.materialsCost, 500.0);
      expect(pricing.platformFee, 200.0);
      expect(pricing.discount, 100.0);
    });

    test('fromJson defaults missing values to 0', () {
      final pricing = BookingPricing.fromJson({});
      expect(pricing.estimatedPrice, 0.0);
      expect(pricing.finalPrice, 0.0);
    });

    test('toJson round-trips correctly', () {
      final pricing = BookingPricing.fromJson({
        'estimatedPrice': 1500,
        'finalPrice': 1500,
        'laborCost': 1200,
        'materialsCost': 0,
        'platformFee': 150,
        'discount': 0,
      });
      final json = pricing.toJson();
      expect(json['estimatedPrice'], 1500.0);
      expect(json['platformFee'], 150.0);
    });
  });

  // ── BookingTimeline ───────────────────────────────────────

  group('BookingTimeline', () {
    test('fromJson parses status, timestamp, and note', () {
      final tl = BookingTimeline.fromJson({
        'status': 'ACCEPTED',
        'timestamp': '2026-03-01T08:05:00.000Z',
        'note': 'Worker accepted',
      });
      expect(tl.status, 'ACCEPTED');
      expect(tl.timestamp.year, 2026);
      expect(tl.note, 'Worker accepted');
    });

    test('fromJson handles null note', () {
      final tl = BookingTimeline.fromJson({
        'status': 'PENDING',
        'timestamp': '2026-03-01T08:00:00.000Z',
      });
      expect(tl.note, isNull);
    });

    test('toJson round-trips correctly', () {
      final tl = BookingTimeline.fromJson({
        'status': 'COMPLETED',
        'timestamp': '2026-03-01T10:00:00.000Z',
        'note': 'Done',
      });
      final json = tl.toJson();
      expect(json['status'], 'COMPLETED');
      expect(json['note'], 'Done');
      expect(json['timestamp'], contains('2026-03-01'));
    });
  });

  // ── CustomerInfo ──────────────────────────────────────────

  group('CustomerInfo', () {
    test('fromJson parses names and phone from nested user', () {
      final ci = CustomerInfo.fromJson({
        '_id': 'c1',
        'firstName': 'Sara',
        'lastName': 'Ahmed',
        'profileImage': 'https://example.com/sara.png',
        'user': {'phone': '+923009876543'},
      });
      expect(ci.id, 'c1');
      expect(ci.firstName, 'Sara');
      expect(ci.lastName, 'Ahmed');
      expect(ci.fullName, 'Sara Ahmed');
      expect(ci.phone, '+923009876543');
      expect(ci.profileImage, 'https://example.com/sara.png');
    });

    test('fromJson falls back to flat phone field', () {
      final ci = CustomerInfo.fromJson({
        'id': 'c2',
        'firstName': 'Omar',
        'lastName': 'Farooq',
        'phone': '+923111111111',
      });
      expect(ci.id, 'c2');
      expect(ci.phone, '+923111111111');
      expect(ci.profileImage, isNull);
    });

    test('fromJson defaults to empty strings on missing data', () {
      final ci = CustomerInfo.fromJson({});
      expect(ci.id, '');
      expect(ci.firstName, '');
      expect(ci.phone, '');
    });
  });

  // ── BookingModel ──────────────────────────────────────────

  group('BookingModel', () {
    test('fromJson parses full document', () {
      final b = BookingModel.fromJson(fullJson);

      expect(b.id, 'booking123');
      expect(b.bookingNumber, 'HG-20260301-00001');
      expect(b.customer.firstName, 'Ali');
      expect(b.customer.phone, '+923001234567');
      expect(b.workerId, 'worker456');
      expect(b.serviceCategory, 'PLUMBING');
      expect(b.problemDescription, 'Kitchen tap leaking');
      expect(b.aiDetectedServices, ['pipe_repair', 'tap_replacement']);
      expect(b.address.city, 'Islamabad');
      expect(b.scheduledDateTime.year, 2026);
      expect(b.isUrgent, true);
      expect(b.status, 'IN_PROGRESS');
      expect(b.pricing.finalPrice, 2800.0);
      expect(b.estimatedDuration, 60);
      expect(b.actualDuration, 75);
      expect(b.timeline.length, 2);
      expect(b.beforeImages, ['https://example.com/before1.jpg']);
      expect(b.afterImages, ['https://example.com/after1.jpg']);
    });

    test('fromJson handles minimal document', () {
      final b = BookingModel.fromJson(<String, dynamic>{
        '_id': 'b1',
        'bookingNumber': 'HG-20260301-00002',
        'customer': <String, dynamic>{'firstName': 'Test', 'lastName': 'User'},
        'serviceCategory': 'ELECTRICAL',
        'problemDescription': 'Light not working',
        'address': <String, dynamic>{
          'full': 'Test address',
          'city': 'Karachi',
          'coordinates': <String, dynamic>{'lat': 24.86, 'lng': 67.0},
        },
        'scheduledDateTime': '2026-03-02T14:00:00.000Z',
        'pricing': <String, dynamic>{},
      });
      expect(b.id, 'b1');
      expect(b.isUrgent, false);
      expect(b.status, 'PENDING');
      expect(b.workerId, isNull);
      expect(b.aiDetectedServices, isNull);
      expect(b.estimatedDuration, isNull);
      expect(b.actualDuration, isNull);
      expect(b.beforeImages, isNull);
      expect(b.afterImages, isNull);
      expect(b.timeline, isEmpty);
      expect(b.pricing.estimatedPrice, 0.0);
    });

    test('status convenience getters', () {
      BookingModel make(String status) => BookingModel.fromJson(
        <String, dynamic>{...fullJson, 'status': status},
      );

      expect(make('PENDING').isPending, true);
      expect(make('PENDING').isCompleted, false);
      expect(make('ACCEPTED').isAccepted, true);
      expect(make('IN_PROGRESS').isInProgress, true);
      expect(make('COMPLETED').isCompleted, true);
      expect(make('CANCELLED').isCancelled, true);
    });

    test('toJson round-trip preserves key fields', () {
      final b = BookingModel.fromJson(fullJson);
      final json = b.toJson();

      expect(json['_id'], 'booking123');
      expect(json['bookingNumber'], 'HG-20260301-00001');
      expect(json['serviceCategory'], 'PLUMBING');
      expect(json['isUrgent'], true);
      expect(json['status'], 'IN_PROGRESS');
      expect(json['estimatedDuration'], 60);
      expect(json['actualDuration'], 75);
      expect((json['timeline'] as List).length, 2);
      expect((json['images'] as Map)['before'], [
        'https://example.com/before1.jpg',
      ]);
    });

    test('id parsing prefers _id over id', () {
      final b1 = BookingModel.fromJson(<String, dynamic>{
        ...fullJson,
        '_id': 'prefer_this',
        'id': 'not_this',
      });
      expect(b1.id, 'prefer_this');
    });
  });
}
