import 'dart:convert';

import 'package:equatable/equatable.dart';

/// Wallet status
enum WalletStatus { active, frozen, closed }

/// Transaction type (matches Appwrite enum)
enum WalletTransactionType {
  topUp,
  bookingDebit,
  bookingCash,
  refund,
  withdrawal,
  platformFee,
  earning,
}

/// Transaction status
enum TransactionStatus { pending, completed, failed, reversed }

/// Payment method type
enum WalletPaymentMethod {
  cash,
  wallet,
  card,
  jazzcash,
  easypaisa,
  bankTransfer,
}

// ================================================================
//  WALLET MODEL
// ================================================================

class WalletModel extends Equatable {
  final String id;
  final String userId;
  final double balance;
  final String currency;
  final WalletStatus status;
  final DateTime? lastTopUpAt;
  final DateTime? lastWithdrawalAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const WalletModel({
    required this.id,
    required this.userId,
    required this.balance,
    this.currency = 'PKR',
    this.status = WalletStatus.active,
    this.lastTopUpAt,
    this.lastWithdrawalAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) {
    return WalletModel(
      id: json['\$id'] ?? json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      balance: (json['balance'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'PKR',
      status: _parseWalletStatus(json['status']),
      lastTopUpAt: json['lastTopUpAt'] != null
          ? DateTime.tryParse(json['lastTopUpAt'])
          : null,
      lastWithdrawalAt: json['lastWithdrawalAt'] != null
          ? DateTime.tryParse(json['lastWithdrawalAt'])
          : null,
      createdAt: json['\$createdAt'] != null
          ? DateTime.parse(json['\$createdAt'])
          : DateTime.now(),
      updatedAt: json['\$updatedAt'] != null
          ? DateTime.parse(json['\$updatedAt'])
          : DateTime.now(),
    );
  }

  static WalletStatus _parseWalletStatus(String? value) {
    switch (value?.toUpperCase()) {
      case 'FROZEN':
        return WalletStatus.frozen;
      case 'CLOSED':
        return WalletStatus.closed;
      default:
        return WalletStatus.active;
    }
  }

  bool get isActive => status == WalletStatus.active;

  @override
  List<Object?> get props => [id, userId, balance, status];
}

// ================================================================
//  TRANSACTION MODEL
// ================================================================

class TransactionModel extends Equatable {
  final String id;
  final String userId;
  final WalletTransactionType type;
  final double amount;
  final TransactionStatus status;
  final String? bookingId;
  final WalletPaymentMethod? paymentMethod;
  final String? description;
  final String? gatewayReference;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime updatedAt;

  const TransactionModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.amount,
    required this.status,
    this.bookingId,
    this.paymentMethod,
    this.description,
    this.gatewayReference,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? parsedMetadata;
    if (json['metadata'] is String && (json['metadata'] as String).isNotEmpty) {
      try {
        parsedMetadata = Map<String, dynamic>.from(
          jsonDecode(json['metadata']),
        );
      } catch (_) {
        parsedMetadata = null;
      }
    } else if (json['metadata'] is Map) {
      parsedMetadata = Map<String, dynamic>.from(json['metadata']);
    }

    return TransactionModel(
      id: json['\$id'] ?? json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      type: _parseTxnType(json['type']),
      amount: (json['amount'] ?? 0).toDouble(),
      status: _parseTxnStatus(json['status']),
      bookingId: json['bookingId'],
      paymentMethod: _parsePaymentMethod(json['paymentMethod']),
      description: json['description'],
      gatewayReference: json['gatewayReference'],
      metadata: parsedMetadata,
      createdAt: json['\$createdAt'] != null
          ? DateTime.parse(json['\$createdAt'])
          : DateTime.now(),
      updatedAt: json['\$updatedAt'] != null
          ? DateTime.parse(json['\$updatedAt'])
          : DateTime.now(),
    );
  }

  /// Whether this transaction adds money to the wallet
  bool get isCredit =>
      type == WalletTransactionType.topUp ||
      type == WalletTransactionType.refund ||
      type == WalletTransactionType.earning;

  /// Whether this transaction removes money from the wallet
  bool get isDebit =>
      type == WalletTransactionType.bookingDebit ||
      type == WalletTransactionType.withdrawal;

  /// Human-readable type label
  String get typeLabel {
    switch (type) {
      case WalletTransactionType.topUp:
        return 'Top Up';
      case WalletTransactionType.bookingDebit:
        return 'Booking Payment';
      case WalletTransactionType.bookingCash:
        return 'Cash Payment';
      case WalletTransactionType.refund:
        return 'Refund';
      case WalletTransactionType.withdrawal:
        return 'Withdrawal';
      case WalletTransactionType.platformFee:
        return 'Platform Fee';
      case WalletTransactionType.earning:
        return 'Earning';
    }
  }

  /// Status display label
  String get statusLabel {
    switch (status) {
      case TransactionStatus.pending:
        return 'Pending';
      case TransactionStatus.completed:
        return 'Completed';
      case TransactionStatus.failed:
        return 'Failed';
      case TransactionStatus.reversed:
        return 'Reversed';
    }
  }

  // ── Private parsers ──────────────────────────────────────

  static WalletTransactionType _parseTxnType(String? value) {
    switch (value?.toUpperCase()) {
      case 'TOP_UP':
        return WalletTransactionType.topUp;
      case 'BOOKING_DEBIT':
        return WalletTransactionType.bookingDebit;
      case 'BOOKING_CASH':
        return WalletTransactionType.bookingCash;
      case 'REFUND':
        return WalletTransactionType.refund;
      case 'WITHDRAWAL':
        return WalletTransactionType.withdrawal;
      case 'PLATFORM_FEE':
        return WalletTransactionType.platformFee;
      case 'EARNING':
        return WalletTransactionType.earning;
      default:
        return WalletTransactionType.bookingCash;
    }
  }

  static TransactionStatus _parseTxnStatus(String? value) {
    switch (value?.toUpperCase()) {
      case 'COMPLETED':
        return TransactionStatus.completed;
      case 'FAILED':
        return TransactionStatus.failed;
      case 'REVERSED':
        return TransactionStatus.reversed;
      default:
        return TransactionStatus.pending;
    }
  }

  static WalletPaymentMethod? _parsePaymentMethod(String? value) {
    switch (value?.toUpperCase()) {
      case 'CASH':
        return WalletPaymentMethod.cash;
      case 'WALLET':
        return WalletPaymentMethod.wallet;
      case 'CARD':
        return WalletPaymentMethod.card;
      case 'JAZZCASH':
        return WalletPaymentMethod.jazzcash;
      case 'EASYPAISA':
        return WalletPaymentMethod.easypaisa;
      case 'BANK_TRANSFER':
        return WalletPaymentMethod.bankTransfer;
      default:
        return null;
    }
  }

  @override
  List<Object?> get props => [id, userId, type, amount, status];
}
