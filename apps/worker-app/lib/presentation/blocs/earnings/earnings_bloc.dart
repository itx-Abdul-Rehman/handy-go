import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/utils/error_mapper.dart';
import '../../../domain/repositories/wallet_repository.dart';
import '../../../domain/repositories/worker_repository.dart';
import 'earnings_event.dart';
import 'earnings_state.dart';

/// Manages earnings display: totals, wallet balance, transactions,
/// and withdrawal requests.
class EarningsBloc extends Bloc<EarningsEvent, EarningsState> {
  final WorkerRepository _workerRepo;
  final WalletRepository _walletRepo;

  EarningsBloc({
    required WorkerRepository workerRepository,
    required WalletRepository walletRepository,
  }) : _workerRepo = workerRepository,
       _walletRepo = walletRepository,
       super(const EarningsInitial()) {
    on<EarningsLoadRequested>(_onLoad);
    on<WithdrawalRequested>(_onWithdrawal);
  }

  Future<void> _onLoad(
    EarningsLoadRequested event,
    Emitter<EarningsState> emit,
  ) async {
    emit(const EarningsLoading());
    try {
      final userId = event.userId;
      // Fetch earnings summary from worker repo and wallet data in parallel
      final results = await Future.wait([
        _workerRepo.getEarnings(
          startDate: event.startDate,
          endDate: event.endDate,
        ),
        _walletRepo.getOrCreateWallet(userId),
        _walletRepo.getTransactions(userId: userId, limit: 20),
      ]);

      final earningsSummary = results[0] as Map<String, dynamic>;
      final wallet = results[1] as dynamic;
      final txResult = results[2] as dynamic;

      emit(
        EarningsLoaded(
          totalEarnings: (earningsSummary['totalEarnings'] ?? 0).toDouble(),
          walletBalance: wallet.balance,
          breakdown: earningsSummary,
          recentTransactions: txResult.transactions,
        ),
      );
    } catch (e) {
      emit(EarningsError(ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onWithdrawal(
    WithdrawalRequested event,
    Emitter<EarningsState> emit,
  ) async {
    emit(const EarningsLoading());
    try {
      final result = await _walletRepo.requestWithdrawal(
        userId: event.userId,
        amount: event.amount,
        bankDetails: event.bankDetails,
      );
      emit(WithdrawalSuccess(result.newBalance));
      // Refresh earnings after withdrawal
      add(EarningsLoadRequested(userId: event.userId));
    } catch (e) {
      emit(EarningsError(ErrorMapper.toUserMessage(e)));
    }
  }
}
