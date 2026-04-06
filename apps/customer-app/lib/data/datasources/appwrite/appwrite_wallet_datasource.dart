import 'dart:convert';

import 'package:appwrite/appwrite.dart';

import '../../../core/appwrite/appwrite_client.dart';
import '../../../core/appwrite/appwrite_config.dart';
import '../../models/wallet_model.dart';

/// Appwrite-based wallet & payment data source.
///
/// Uses the `payment_processor` Appwrite Function for all wallet
/// operations (top-up, withdrawal, booking payment, refund) and
/// reads wallet / transaction documents directly from TablesDB.
class AppwriteWalletDataSource {
  final Functions _functions;

  AppwriteWalletDataSource({Functions? functions})
    : _functions = functions ?? AppwriteClient.functions;

  // ============================================================
  //  WALLET
  // ============================================================

  /// Ensure a wallet exists for the current user (idempotent).
  Future<WalletModel> getOrCreateWallet(String userId) async {
    final execution = await _functions.createExecution(
      functionId: AppwriteConfig.paymentProcessorFunction,
      body: jsonEncode({'action': 'get_wallet', 'userId': userId}),
    );

    final result = jsonDecode(execution.responseBody);
    if (result['error'] != null) {
      throw Exception(result['error']);
    }
    return WalletModel.fromJson(result['wallet']);
  }

  /// Get current wallet balance for a user.
  Future<double> getBalance(String userId) async {
    final wallet = await getOrCreateWallet(userId);
    return wallet.balance;
  }

  // ============================================================
  //  TRANSACTIONS
  // ============================================================

  /// Fetch paginated transaction history.
  Future<({List<TransactionModel> transactions, int total})> getTransactions({
    required String userId,
    String? type,
    int limit = 25,
    int offset = 0,
  }) async {
    final execution = await _functions.createExecution(
      functionId: AppwriteConfig.paymentProcessorFunction,
      body: jsonEncode({
        'action': 'get_transactions',
        'userId': userId,
        if (type != null) 'type': type,
        'limit': limit,
        'offset': offset,
      }),
    );

    final result = jsonDecode(execution.responseBody);
    if (result['error'] != null) {
      throw Exception(result['error']);
    }

    final docs = (result['transactions'] as List?) ?? [];
    return (
      transactions: docs
          .map((d) => TransactionModel.fromJson(Map<String, dynamic>.from(d)))
          .toList(),
      total: (result['total'] ?? docs.length) as int,
    );
  }

  // ============================================================
  //  TOP-UP
  // ============================================================

  /// Top up wallet balance.
  ///
  /// [paymentMethod] is one of: JAZZCASH, EASYPAISA, CARD, BANK_TRANSFER.
  /// [gatewayToken] is an optional token from the client-side gateway SDK
  /// (e.g. Stripe PaymentMethod ID).
  ///
  /// Returns the new balance after top-up.
  ///
  /// ```
  /// // TODO: Before calling this, integrate the gateway client SDK
  /// // (JazzCash / Easypaisa / Stripe) in the Flutter app to obtain
  /// // a gatewayToken and pass it here.
  /// ```
  Future<({TransactionModel transaction, double newBalance})> topUpWallet({
    required String userId,
    required double amount,
    required String paymentMethod,
    String? gatewayToken,
  }) async {
    final execution = await _functions.createExecution(
      functionId: AppwriteConfig.paymentProcessorFunction,
      body: jsonEncode({
        'action': 'top_up_wallet',
        'userId': userId,
        'amount': amount,
        'paymentMethod': paymentMethod,
        if (gatewayToken != null) 'gatewayToken': gatewayToken,
      }),
    );

    final result = jsonDecode(execution.responseBody);
    if (result['error'] != null) {
      throw Exception(result['error']);
    }

    return (
      transaction: TransactionModel.fromJson(
        Map<String, dynamic>.from(result['transaction']),
      ),
      newBalance: ((result['newBalance'] ?? 0) as num).toDouble(),
    );
  }

  // ============================================================
  //  BOOKING PAYMENT
  // ============================================================

  /// Process payment for a completed booking.
  Future<String> processBookingPayment({
    required String bookingId,
    required String customerId,
    required String workerId,
    required double amount,
    required String paymentMethod,
  }) async {
    final execution = await _functions.createExecution(
      functionId: AppwriteConfig.paymentProcessorFunction,
      body: jsonEncode({
        'action': 'process_booking_payment',
        'bookingId': bookingId,
        'customerId': customerId,
        'workerId': workerId,
        'amount': amount,
        'paymentMethod': paymentMethod,
      }),
    );

    final result = jsonDecode(execution.responseBody);
    if (result['error'] != null) {
      throw Exception(result['error']);
    }
    return result['transactionId'] ?? '';
  }

  // ============================================================
  //  WITHDRAWAL
  // ============================================================

  /// Request a withdrawal to bank account.
  ///
  /// ```
  /// // TODO: When integrating real bank payouts, the gateway will
  /// // process the transfer asynchronously.  Add a webhook handler
  /// // (Appwrite Function triggered by gateway callback) to update
  /// // the transaction status from PENDING → COMPLETED / FAILED.
  /// ```
  Future<({String transactionId, double newBalance})> requestWithdrawal({
    required String userId,
    required double amount,
    Map<String, String>? bankDetails,
  }) async {
    final execution = await _functions.createExecution(
      functionId: AppwriteConfig.paymentProcessorFunction,
      body: jsonEncode({
        'action': 'request_withdrawal',
        'userId': userId,
        'amount': amount,
        if (bankDetails != null) 'bankDetails': bankDetails,
      }),
    );

    final result = jsonDecode(execution.responseBody);
    if (result['error'] != null) {
      throw Exception(result['error']);
    }

    return (
      transactionId: (result['transactionId'] ?? '') as String,
      newBalance: ((result['newBalance'] ?? 0) as num).toDouble(),
    );
  }

  // ============================================================
  //  REFUND
  // ============================================================

  /// Process refund for a cancelled / disputed booking.
  Future<({String transactionId, double newBalance})> processRefund({
    required String bookingId,
    required String customerId,
    required double amount,
    String? reason,
  }) async {
    final execution = await _functions.createExecution(
      functionId: AppwriteConfig.paymentProcessorFunction,
      body: jsonEncode({
        'action': 'process_refund',
        'bookingId': bookingId,
        'customerId': customerId,
        'amount': amount,
        if (reason != null) 'reason': reason,
      }),
    );

    final result = jsonDecode(execution.responseBody);
    if (result['error'] != null) {
      throw Exception(result['error']);
    }

    return (
      transactionId: (result['transactionId'] ?? '') as String,
      newBalance: ((result['newBalance'] ?? 0) as num).toDouble(),
    );
  }
}
