import 'package:equatable/equatable.dart';

import '../../../data/models/wallet_model.dart';

/// States for [EarningsBloc].
abstract class EarningsState extends Equatable {
  const EarningsState();
  @override
  List<Object?> get props => [];
}

class EarningsInitial extends EarningsState {
  const EarningsInitial();
}

class EarningsLoading extends EarningsState {
  const EarningsLoading();
}

class EarningsLoaded extends EarningsState {
  final double totalEarnings;
  final double walletBalance;
  final Map<String, dynamic> breakdown;
  final List<TransactionModel> recentTransactions;

  const EarningsLoaded({
    required this.totalEarnings,
    required this.walletBalance,
    required this.breakdown,
    required this.recentTransactions,
  });

  @override
  List<Object?> get props => [
    totalEarnings,
    walletBalance,
    breakdown,
    recentTransactions,
  ];
}

class WithdrawalSuccess extends EarningsState {
  final double newBalance;
  const WithdrawalSuccess(this.newBalance);
  @override
  List<Object?> get props => [newBalance];
}

class EarningsError extends EarningsState {
  final String message;
  const EarningsError(this.message);
  @override
  List<Object?> get props => [message];
}
