import 'package:appwrite/appwrite.dart';
import 'appwrite_config.dart';

/// Singleton Appwrite client provider
///
/// This replaces the Dio-based API client for all backend operations.
/// Appwrite handles authentication, sessions, and JWT tokens automatically.
class AppwriteClient {
  static Client? _client;
  static Account? _account;
  static Databases? _databases;
  static TablesDB? _tablesDB;
  static Storage? _storage;
  static Functions? _functions;
  static Realtime? _realtime;
  static Avatars? _avatars;

  AppwriteClient._();

  /// Initialize the Appwrite client (call once at app startup)
  static void initialize() {
    _client = Client()
        .setEndpoint(AppwriteConfig.endpoint)
        .setProject(AppwriteConfig.projectId)
        .setSelfSigned(status: false); // Cloud doesn't need self-signed
  }

  /// Get the raw Appwrite Client instance
  static Client get client {
    if (_client == null) {
      throw StateError(
        'AppwriteClient not initialized! Call AppwriteClient.initialize() first.',
      );
    }
    return _client!;
  }

  /// Authentication service (replaces auth-service)
  /// Handles: login, register, phone OTP, sessions, JWT tokens
  static Account get account {
    _account ??= Account(client);
    return _account!;
  }

  /// Database service (replaces MongoDB via user-service, booking-service)
  /// Handles: CRUD for all collections
  @Deprecated('Use tablesDB instead')
  static Databases get databases {
    _databases ??= Databases(client);
    return _databases!;
  }

  /// TablesDB service (new API replacing Databases)
  /// Handles: CRUD for all collections/tables
  static TablesDB get tablesDB {
    _tablesDB ??= TablesDB(client);
    return _tablesDB!;
  }

  /// Storage service (replaces Cloudinary)
  /// Handles: profile images, CNIC uploads, booking photos, SOS evidence
  static Storage get storage {
    _storage ??= Storage(client);
    return _storage!;
  }

  /// Functions service (replaces matching-service, SOS analyzer)
  /// Handles: AI matching, price estimation, trust calculation
  static Functions get functions {
    _functions ??= Functions(client);
    return _functions!;
  }

  /// Realtime service (replaces polling for live updates)
  /// Handles: booking status changes, worker location, notifications
  static Realtime get realtime {
    _realtime ??= Realtime(client);
    return _realtime!;
  }

  /// Avatars service (for user initials avatars)
  static Avatars get avatars {
    _avatars ??= Avatars(client);
    return _avatars!;
  }
}
