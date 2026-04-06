import 'dart:convert';

import 'package:appwrite/appwrite.dart';

import '../../core/appwrite/appwrite_client.dart';
import '../../core/appwrite/appwrite_config.dart';
import '../../domain/repositories/wallet_repository.dart';
import '../models/wallet_model.dart';

/// Appwrite-based wallet & payment data source for Worker App.
///
/// Uses the `payment_processor` Appwrite Function for all wallet
/// operations (earnings credit, withdrawal, balance queries).
class AppwriteWalletDataSource implements WalletRepository {
  final Functions _functions;

  AppwriteWalletDataSource({Functions? functions})
    : _functions = functions ?? AppwriteClient.functions;

  // ============================================================
  //  WALLET
  // ============================================================

  /// Ensure a wallet exists for the current worker (idempotent).
  @override
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

  /// Get current wallet balance.
  @override
  Future<double> getBalance(String userId) async {
    final wallet = await getOrCreateWallet(userId);
    return wallet.balance;
  }

  // ============================================================
  //  TRANSACTIONS
  // ============================================================

  /// Fetch paginated transaction history.
  @override
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
  //  WITHDRAWAL
  // ============================================================

  /// Request a withdrawal to bank account.
  ///
  /// ```
  /// // TODO: When integrating real bank payouts, the gateway will
  /// // process the transfer asynchronously. Add a webhook handler
  /// // (Appwrite Function triggered by gateway callback) to update
  /// // the transaction status from PENDING → COMPLETED / FAILED.
  /// ```
  @override
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
}
