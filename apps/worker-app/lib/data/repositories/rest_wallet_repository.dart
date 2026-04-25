import '../../domain/repositories/wallet_repository.dart';

/// REST implementation of WalletRepository (Placeholder/Dummy)
class RestWalletRepository implements WalletRepository {
  @override
  Future<Map<String, dynamic>> getWalletBalance() async {
    return {'balance': 0.0, 'currency': 'PKR'};
  }

  @override
  Future<List<Map<String, dynamic>>> getTransactionHistory() async {
    return [];
  }

  @override
  Future<void> withdrawFunds(double amount, String method) async {
    // Implementation coming soon
  }
}
