import '../../data/models/wallet_model.dart';

/// Abstract contract for wallet / payment operations.
///
/// Concrete implementation: `AppwriteWalletDataSource`.
abstract class WalletRepository {
  /// Fetch the wallet for [userId], creating one if it doesn't exist.
  Future<WalletModel> getOrCreateWallet(String userId);

  /// Current wallet balance for [userId].
  Future<double> getBalance(String userId);

  /// Paginated list of transactions for [userId].
  ///
  /// Returns a record containing the transaction list and total count.
  Future<({List<TransactionModel> transactions, int total})> getTransactions({
    required String userId,
    String? type,
    int limit = 25,
    int offset = 0,
  });

  /// Request a withdrawal from the wallet.
  ///
  /// Returns the new transaction ID and updated balance.
  Future<({String transactionId, double newBalance})> requestWithdrawal({
    required String userId,
    required double amount,
    Map<String, String>? bankDetails,
  });
}
