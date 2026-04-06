import 'package:appwrite/appwrite.dart';
import 'appwrite_config.dart';

/// Singleton Appwrite client provider for the Worker App
///
/// Replaces the Dio-based API client. Appwrite manages sessions automatically.
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
        .setSelfSigned(status: false);
  }

  static Client get client {
    if (_client == null) {
      throw StateError(
        'AppwriteClient not initialized! Call AppwriteClient.initialize() first.',
      );
    }
    return _client!;
  }

  static Account get account {
    _account ??= Account(client);
    return _account!;
  }

  @Deprecated('Use tablesDB instead')
  static Databases get databases {
    _databases ??= Databases(client);
    return _databases!;
  }

  /// TablesDB service (new API replacing Databases)
  static TablesDB get tablesDB {
    _tablesDB ??= TablesDB(client);
    return _tablesDB!;
  }

  static Storage get storage {
    _storage ??= Storage(client);
    return _storage!;
  }

  static Functions get functions {
    _functions ??= Functions(client);
    return _functions!;
  }

  static Realtime get realtime {
    _realtime ??= Realtime(client);
    return _realtime!;
  }

  static Avatars get avatars {
    _avatars ??= Avatars(client);
    return _avatars!;
  }
}
