import 'package:get_it/get_it.dart';

import 'data/datasources/appwrite_wallet_datasource.dart';
import 'data/repositories/appwrite_auth_repository.dart';
import 'data/repositories/appwrite_booking_repository.dart';
import 'data/repositories/appwrite_worker_repository.dart';
import 'domain/repositories/auth_repository.dart';
import 'domain/repositories/booking_repository.dart';
import 'domain/repositories/wallet_repository.dart';
import 'domain/repositories/worker_repository.dart';
import 'presentation/blocs/bookings/bookings_bloc.dart';
import 'presentation/blocs/earnings/earnings_bloc.dart';
import 'presentation/blocs/home/home_bloc.dart';
import 'presentation/blocs/profile/profile_bloc.dart';

/// Global service-locator instance.
///
/// Usage:
/// ```dart
/// final authRepo = sl<AuthRepository>();
/// ```
final GetIt sl = GetIt.instance;

/// Register all repositories, data-sources, and BLoCs.
///
/// Must be called **once** in `main()` after `AppwriteClient.initialize()`.
void initDependencies() {
  // ── Repositories (singletons — they hold in-memory caches & SDK refs) ──

  sl.registerLazySingleton<AuthRepository>(() => AppwriteAuthRepository());
  sl.registerLazySingleton<WorkerRepository>(() => AppwriteWorkerRepository());
  sl.registerLazySingleton<BookingRepository>(
    () => AppwriteBookingRepository(),
  );
  sl.registerLazySingleton<WalletRepository>(() => AppwriteWalletDataSource());

  // Also register concrete types for backward-compatibility with screens
  // that still reference the Appwrite-specific class directly.
  sl.registerLazySingleton<AppwriteAuthRepository>(
    () => sl<AuthRepository>() as AppwriteAuthRepository,
  );
  sl.registerLazySingleton<AppwriteWorkerRepository>(
    () => sl<WorkerRepository>() as AppwriteWorkerRepository,
  );
  sl.registerLazySingleton<AppwriteBookingRepository>(
    () => sl<BookingRepository>() as AppwriteBookingRepository,
  );
  sl.registerLazySingleton<AppwriteWalletDataSource>(
    () => sl<WalletRepository>() as AppwriteWalletDataSource,
  );

  // ── BLoCs (factories — new instance per screen) ──

  sl.registerFactory<HomeBloc>(
    () => HomeBloc(
      workerRepository: sl<WorkerRepository>(),
      bookingRepository: sl<BookingRepository>(),
    ),
  );
  sl.registerFactory<BookingsBloc>(
    () => BookingsBloc(bookingRepository: sl<BookingRepository>()),
  );
  sl.registerFactory<EarningsBloc>(
    () => EarningsBloc(
      workerRepository: sl<WorkerRepository>(),
      walletRepository: sl<WalletRepository>(),
    ),
  );
  sl.registerFactory<ProfileBloc>(
    () => ProfileBloc(workerRepository: sl<WorkerRepository>()),
  );
}
