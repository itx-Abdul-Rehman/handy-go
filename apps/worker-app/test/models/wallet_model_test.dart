import 'package:flutter_test/flutter_test.dart';
import 'package:worker_app/data/models/wallet_model.dart';

/// Unit tests for WalletModel and TransactionModel serialization.
///
/// These verify that Appwrite JSON documents round-trip correctly
/// through fromJson, covering null handling, default values, and
/// enum parsing for every variant.
void main() {
  // ── WalletModel ──────────────────────────────────────────

  group('WalletModel.fromJson', () {
    test('parses minimal Appwrite document', () {
      final json = {
        '\$id': 'wallet_001',
        'userId': 'user_001',
        'balance': 1500,
        'currency': 'PKR',
        'status': 'ACTIVE',
        '\$createdAt': '2024-01-15T10:00:00.000Z',
        '\$updatedAt': '2024-01-15T10:00:00.000Z',
      };

      final wallet = WalletModel.fromJson(json);

      expect(wallet.id, 'wallet_001');
      expect(wallet.userId, 'user_001');
      expect(wallet.balance, 1500.0);
      expect(wallet.currency, 'PKR');
      expect(wallet.status, WalletStatus.active);
      expect(wallet.isActive, isTrue);
      expect(wallet.lastTopUpAt, isNull);
      expect(wallet.lastWithdrawalAt, isNull);
    });

    test('handles frozen status', () {
      final json = {
        '\$id': 'w2',
        'userId': 'u2',
        'balance': 0,
        'status': 'FROZEN',
        '\$createdAt': '2024-01-01T00:00:00.000Z',
        '\$updatedAt': '2024-01-01T00:00:00.000Z',
      };

      final wallet = WalletModel.fromJson(json);
      expect(wallet.status, WalletStatus.frozen);
      expect(wallet.isActive, isFalse);
    });

    test('handles closed status', () {
      final json = {
        '\$id': 'w3',
        'userId': 'u3',
        'balance': 0,
        'status': 'CLOSED',
        '\$createdAt': '2024-01-01T00:00:00.000Z',
        '\$updatedAt': '2024-01-01T00:00:00.000Z',
      };

      final wallet = WalletModel.fromJson(json);
      expect(wallet.status, WalletStatus.closed);
    });

    test('defaults to active on unknown status', () {
      final json = {
        '\$id': 'w4',
        'userId': 'u4',
        'balance': 100,
        'status': 'UNKNOWN',
        '\$createdAt': '2024-01-01T00:00:00.000Z',
        '\$updatedAt': '2024-01-01T00:00:00.000Z',
      };

      final wallet = WalletModel.fromJson(json);
      expect(wallet.status, WalletStatus.active);
    });

    test('handles null balance gracefully (defaults to 0)', () {
      final json = {
        '\$id': 'w5',
        'userId': 'u5',
        '\$createdAt': '2024-01-01T00:00:00.000Z',
        '\$updatedAt': '2024-01-01T00:00:00.000Z',
      };

      final wallet = WalletModel.fromJson(json);
      expect(wallet.balance, 0.0);
    });

    test('parses lastTopUpAt and lastWithdrawalAt when present', () {
      final json = {
        '\$id': 'w6',
        'userId': 'u6',
        'balance': 500,
        'lastTopUpAt': '2024-06-01T12:00:00.000Z',
        'lastWithdrawalAt': '2024-06-02T12:00:00.000Z',
        '\$createdAt': '2024-01-01T00:00:00.000Z',
        '\$updatedAt': '2024-01-01T00:00:00.000Z',
      };

      final wallet = WalletModel.fromJson(json);
      expect(wallet.lastTopUpAt, isNotNull);
      expect(wallet.lastWithdrawalAt, isNotNull);
    });

    test('Equatable: two wallets with same props are equal', () {
      final a = WalletModel(
        id: 'x',
        userId: 'u',
        balance: 100,
        createdAt: DateTime(2024),
        updatedAt: DateTime(2024),
      );
      final b = WalletModel(
        id: 'x',
        userId: 'u',
        balance: 100,
        createdAt: DateTime(2025), // not in props
        updatedAt: DateTime(2025),
      );
      expect(a, equals(b));
    });
  });

  // ── TransactionModel ─────────────────────────────────────

  group('TransactionModel.fromJson', () {
    test('parses full Appwrite transaction document', () {
      final json = {
        '\$id': 'txn_001',
        'userId': 'user_001',
        'type': 'EARNING',
        'amount': 2500,
        'status': 'COMPLETED',
        'bookingId': 'booking_001',
        'paymentMethod': 'WALLET',
        'description': 'Job completed',
        'gatewayReference': 'gw_ref_123',
        '\$createdAt': '2024-06-01T10:00:00.000Z',
        '\$updatedAt': '2024-06-01T10:00:00.000Z',
      };

      final txn = TransactionModel.fromJson(json);

      expect(txn.id, 'txn_001');
      expect(txn.userId, 'user_001');
      expect(txn.type, WalletTransactionType.earning);
      expect(txn.amount, 2500.0);
      expect(txn.status, TransactionStatus.completed);
      expect(txn.bookingId, 'booking_001');
      expect(txn.paymentMethod, WalletPaymentMethod.wallet);
      expect(txn.description, 'Job completed');
      expect(txn.isCredit, isTrue);
      expect(txn.isDebit, isFalse);
      expect(txn.typeLabel, 'Earning');
      expect(txn.statusLabel, 'Completed');
    });

    test('parses metadata from JSON string', () {
      final json = {
        '\$id': 'txn_002',
        'userId': 'u',
        'type': 'TOP_UP',
        'amount': 1000,
        'status': 'PENDING',
        'metadata': '{"source":"jazzcash"}',
        '\$createdAt': '2024-01-01T00:00:00.000Z',
        '\$updatedAt': '2024-01-01T00:00:00.000Z',
      };

      final txn = TransactionModel.fromJson(json);
      expect(txn.metadata, isNotNull);
      expect(txn.metadata!['source'], 'jazzcash');
    });

    test('parses metadata from Map', () {
      final json = {
        '\$id': 'txn_003',
        'userId': 'u',
        'type': 'REFUND',
        'amount': 500,
        'status': 'COMPLETED',
        'metadata': {'reason': 'cancelled'},
        '\$createdAt': '2024-01-01T00:00:00.000Z',
        '\$updatedAt': '2024-01-01T00:00:00.000Z',
      };

      final txn = TransactionModel.fromJson(json);
      expect(txn.metadata!['reason'], 'cancelled');
    });

    test('handles bad metadata string gracefully', () {
      final json = {
        '\$id': 'txn_004',
        'userId': 'u',
        'type': 'WITHDRAWAL',
        'amount': 1000,
        'status': 'FAILED',
        'metadata': 'not-valid-json',
        '\$createdAt': '2024-01-01T00:00:00.000Z',
        '\$updatedAt': '2024-01-01T00:00:00.000Z',
      };

      final txn = TransactionModel.fromJson(json);
      expect(txn.metadata, isNull);
    });

    // Test all transaction type enum parsing
    final typeMap = {
      'TOP_UP': WalletTransactionType.topUp,
      'BOOKING_DEBIT': WalletTransactionType.bookingDebit,
      'BOOKING_CASH': WalletTransactionType.bookingCash,
      'REFUND': WalletTransactionType.refund,
      'WITHDRAWAL': WalletTransactionType.withdrawal,
      'PLATFORM_FEE': WalletTransactionType.platformFee,
      'EARNING': WalletTransactionType.earning,
    };

    typeMap.forEach((raw, expected) {
      test('parses transaction type "$raw"', () {
        final json = {
          '\$id': 'id',
          'userId': 'u',
          'type': raw,
          'amount': 100,
          'status': 'PENDING',
          '\$createdAt': '2024-01-01T00:00:00.000Z',
          '\$updatedAt': '2024-01-01T00:00:00.000Z',
        };
        expect(TransactionModel.fromJson(json).type, expected);
      });
    });

    // Test all payment method enum parsing
    final methodMap = {
      'CASH': WalletPaymentMethod.cash,
      'WALLET': WalletPaymentMethod.wallet,
      'CARD': WalletPaymentMethod.card,
      'JAZZCASH': WalletPaymentMethod.jazzcash,
      'EASYPAISA': WalletPaymentMethod.easypaisa,
      'BANK_TRANSFER': WalletPaymentMethod.bankTransfer,
    };

    methodMap.forEach((raw, expected) {
      test('parses payment method "$raw"', () {
        final json = {
          '\$id': 'id',
          'userId': 'u',
          'type': 'EARNING',
          'amount': 100,
          'status': 'COMPLETED',
          'paymentMethod': raw,
          '\$createdAt': '2024-01-01T00:00:00.000Z',
          '\$updatedAt': '2024-01-01T00:00:00.000Z',
        };
        expect(TransactionModel.fromJson(json).paymentMethod, expected);
      });
    });

    test('isCredit returns true for topUp, refund, earning', () {
      for (final type in ['TOP_UP', 'REFUND', 'EARNING']) {
        final txn = TransactionModel.fromJson({
          '\$id': 'id',
          'userId': 'u',
          'type': type,
          'amount': 100,
          'status': 'COMPLETED',
          '\$createdAt': '2024-01-01T00:00:00.000Z',
          '\$updatedAt': '2024-01-01T00:00:00.000Z',
        });
        expect(txn.isCredit, isTrue, reason: '$type should be credit');
      }
    });

    test('isDebit returns true for bookingDebit, withdrawal', () {
      for (final type in ['BOOKING_DEBIT', 'WITHDRAWAL']) {
        final txn = TransactionModel.fromJson({
          '\$id': 'id',
          'userId': 'u',
          'type': type,
          'amount': 100,
          'status': 'COMPLETED',
          '\$createdAt': '2024-01-01T00:00:00.000Z',
          '\$updatedAt': '2024-01-01T00:00:00.000Z',
        });
        expect(txn.isDebit, isTrue, reason: '$type should be debit');
      }
    });
  });
}
