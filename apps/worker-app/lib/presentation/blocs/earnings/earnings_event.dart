import 'package:equatable/equatable.dart';

/// Events for [EarningsBloc].
abstract class EarningsEvent extends Equatable {
  const EarningsEvent();
  @override
  List<Object?> get props => [];
}

/// Load earnings summary and transaction history.
class EarningsLoadRequested extends EarningsEvent {
  final String userId;
  final DateTime? startDate;
  final DateTime? endDate;
  const EarningsLoadRequested({
    required this.userId,
    this.startDate,
    this.endDate,
  });
  @override
  List<Object?> get props => [userId, startDate, endDate];
}

/// Request a withdrawal from the wallet.
class WithdrawalRequested extends EarningsEvent {
  final String userId;
  final double amount;
  final Map<String, String>? bankDetails;
  const WithdrawalRequested({
    required this.userId,
    required this.amount,
    this.bankDetails,
  });
  @override
  List<Object?> get props => [userId, amount, bankDetails];
}
