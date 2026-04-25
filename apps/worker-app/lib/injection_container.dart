import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'core/network/dio_client.dart';
import 'data/datasources/appwrite_wallet_datasource.dart';
import 'data/repositories/appwrite_auth_repository.dart';
import 'data/repositories/appwrite_booking_repository.dart';
import 'data/repositories/appwrite_worker_repository.dart';
import 'data/repositories/rest_auth_repository.dart';
import 'data/repositories/rest_booking_repository.dart';
import 'data/repositories/rest_worker_repository.dart';
import 'data/repositories/rest_wallet_repository.dart';

import 'domain/repositories/auth_repository.dart';
import 'domain/repositories/booking_repository.dart';
import 'domain/repositories/wallet_repository.dart';
import 'domain/repositories/worker_repository.dart';

import 'presentation/blocs/bookings/bookings_bloc.dart';
import 'presentation/blocs/earnings/earnings_bloc.dart';
import 'presentation/blocs/home/home_bloc.dart';
import 'presentation/blocs/profile/profile_bloc.dart';

/// Toggle this to switch between Appwrite and REST (Node.js)
const bool useAppwrite = false;

/// Global service-locator instance.
final GetIt sl = GetIt.instance;

/// Register all repositories, data-sources, and BLoCs.
void initDependencies() {
  // ── Networking ──
  sl.registerSingleton<FlutterSecureStorage>(const FlutterSecureStorage());
  sl.registerLazySingleton<Dio>(() => Dio());
  sl.registerLazySingleton<DioClient>(
    () => DioClient(dio: sl<Dio>(), secureStorage: sl<FlutterSecureStorage>()),
  );

  // ── Repositories (singletons) ──

  if (useAppwrite) {
    sl.registerLazySingleton<AuthRepository>(() => AppwriteAuthRepository());
    sl.registerLazySingleton<WorkerRepository>(() => AppwriteWorkerRepository());
    sl.registerLazySingleton<BookingRepository>(
      () => AppwriteBookingRepository(),
    );
    sl.registerLazySingleton<WalletRepository>(() => AppwriteWalletDataSource());

    // Concrete types for backward compatibility
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
  } else {
    sl.registerLazySingleton<AuthRepository>(
      () => RestAuthRepository(
        dio: sl<DioClient>().dio,
        secureStorage: sl<FlutterSecureStorage>(),
      ),
    );
    sl.registerLazySingleton<WorkerRepository>(
      () => RestWorkerRepository(dio: sl<DioClient>().dio),
    );
    sl.registerLazySingleton<BookingRepository>(
      () => RestBookingRepository(dio: sl<DioClient>().dio),
    );
    sl.registerLazySingleton<WalletRepository>(() => RestWalletRepository());
  }

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
