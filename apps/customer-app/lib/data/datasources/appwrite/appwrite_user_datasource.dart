import 'dart:convert';

import 'package:appwrite/appwrite.dart';
import 'package:appwrite/models.dart' show Row;
import '../../models/user_model.dart';
import '../../../core/appwrite/appwrite_client.dart';
import '../../../core/appwrite/appwrite_config.dart';
import '../remote/user_remote_datasource.dart';

/// Appwrite-based user data source
///
/// Replaces the Dio/REST-based UserRemoteDataSourceImpl.
/// Uses Appwrite Databases for profile CRUD and Appwrite Storage for images.
class AppwriteUserDataSource implements UserRemoteDataSource {
  final Account _account;
  final TablesDB _tablesDB;
  final Storage _storage;
  final Functions _functions;

  AppwriteUserDataSource({
    Account? account,
    TablesDB? tablesDB,
    Storage? storage,
    Functions? functions,
  }) : _account = account ?? AppwriteClient.account,
       _tablesDB = tablesDB ?? AppwriteClient.tablesDB,
       _storage = storage ?? AppwriteClient.storage,
       _functions = functions ?? AppwriteClient.functions;

  /// Auto-create a customer document from the Appwrite account if none exists.
  /// This self-heals when the user has a valid session but no profile doc
  /// (e.g. collection was recreated, or registration was interrupted).
  Future<Row> _ensureCustomerDoc() async {
    final user = await _account.get();
    final docs = await _tablesDB.listRows(
      databaseId: AppwriteConfig.databaseId,
      tableId: AppwriteConfig.customersCollection,
      queries: [Query.equal('userId', user.$id)],
    );

    if (docs.rows.isNotEmpty) return docs.rows.first;

    // Auto-create from Appwrite account data
    final nameParts = (user.name.isNotEmpty ? user.name : 'User').split(' ');
    final firstName = nameParts.first;
    final lastName = nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';

    final newDoc = await _tablesDB.createRow(
      databaseId: AppwriteConfig.databaseId,
      tableId: AppwriteConfig.customersCollection,
      rowId: ID.unique(),
      data: {
        'userId': user.$id,
        'firstName': firstName,
        'lastName': lastName,
        'phone': user.phone.isNotEmpty ? user.phone : '',
        'email': user.email,
        'preferredLanguage': 'en',
        'totalBookings': 0,
      },
    );
    return newDoc;
  }

  @override
  Future<CustomerModel> getProfile() async {
    try {
      final doc = await _ensureCustomerDoc();

      // Also fetch addresses from separate collection
      final addressDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customerAddressesCollection,
        queries: [Query.equal('customerId', doc.$id), Query.limit(5)],
      );

      final addresses = addressDocs.rows.map((addrDoc) {
        return AddressModel(
          id: addrDoc.$id,
          label: addrDoc.data['label'] ?? '',
          address: addrDoc.data['address'] ?? '',
          city: addrDoc.data['city'] ?? '',
          coordinates:
              (addrDoc.data['latitude'] != null &&
                  addrDoc.data['longitude'] != null)
              ? CoordinatesModel(
                  lat: (addrDoc.data['latitude'] as num).toDouble(),
                  lng: (addrDoc.data['longitude'] as num).toDouble(),
                )
              : null,
          isDefault: addrDoc.data['isDefault'] ?? false,
        );
      }).toList();

      return CustomerModel(
        id: doc.$id,
        firstName: doc.data['firstName'] ?? '',
        lastName: doc.data['lastName'] ?? '',
        profileImage: doc.data['profileImage'],
        addresses: addresses,
        preferredLanguage: doc.data['preferredLanguage'] ?? 'en',
        totalBookings: doc.data['totalBookings'] ?? 0,
      );
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to get profile');
    }
  }

  @override
  Future<CustomerModel> updateProfile({
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? profileImage,
    String? preferredLanguage,
  }) async {
    try {
      final currentDoc = await _ensureCustomerDoc();
      final docId = currentDoc.$id;

      // Build update data
      final data = <String, dynamic>{};
      if (firstName != null) data['firstName'] = firstName;
      if (lastName != null) data['lastName'] = lastName;
      if (email != null) data['email'] = email;
      if (phone != null) data['phone'] = phone;
      if (profileImage != null) data['profileImage'] = profileImage;
      if (preferredLanguage != null) {
        data['preferredLanguage'] = preferredLanguage;
      }

      // Update Appwrite user name if first/last name changed
      if (firstName != null || lastName != null) {
        final newFirst = firstName ?? currentDoc.data['firstName'];
        final newLast = lastName ?? currentDoc.data['lastName'];
        await _account.updateName(name: '$newFirst $newLast');
      }

      // Update database document
      await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customersCollection,
        rowId: docId,
        data: data,
      );

      return getProfile();
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to update profile');
    }
  }

  @override
  Future<List<AddressModel>> getAddresses() async {
    try {
      final user = await _account.get();
      final customerDocs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customersCollection,
        queries: [Query.equal('userId', user.$id)],
      );

      if (customerDocs.rows.isEmpty) return [];

      final customerId = customerDocs.rows.first.$id;
      final docs = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customerAddressesCollection,
        queries: [Query.equal('customerId', customerId), Query.limit(10)],
      );

      return docs.rows.map((doc) {
        return AddressModel(
          id: doc.$id,
          label: doc.data['label'] ?? '',
          address: doc.data['address'] ?? '',
          city: doc.data['city'] ?? '',
          coordinates:
              (doc.data['latitude'] != null && doc.data['longitude'] != null)
              ? CoordinatesModel(
                  lat: (doc.data['latitude'] as num).toDouble(),
                  lng: (doc.data['longitude'] as num).toDouble(),
                )
              : null,
          isDefault: doc.data['isDefault'] ?? false,
        );
      }).toList();
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to get addresses');
    }
  }

  @override
  Future<AddressModel> addAddress(AddressModel address) async {
    try {
      final customerDoc = await _ensureCustomerDoc();
      final customerId = customerDoc.$id;

      // If this is set as default, unset other defaults first
      if (address.isDefault) {
        final existingAddresses = await _tablesDB.listRows(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.customerAddressesCollection,
          queries: [
            Query.equal('customerId', customerId),
            Query.equal('isDefault', true),
          ],
        );
        for (final doc in existingAddresses.rows) {
          await _tablesDB.updateRow(
            databaseId: AppwriteConfig.databaseId,
            tableId: AppwriteConfig.customerAddressesCollection,
            rowId: doc.$id,
            data: {'isDefault': false},
          );
        }
      }

      final doc = await _tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customerAddressesCollection,
        rowId: ID.unique(),
        data: {
          'customerId': customerId,
          'label': address.label,
          'address': address.address,
          'city': address.city,
          'latitude': address.coordinates?.lat,
          'longitude': address.coordinates?.lng,
          'isDefault': address.isDefault,
        },
      );

      return AddressModel(
        id: doc.$id,
        label: doc.data['label'],
        address: doc.data['address'],
        city: doc.data['city'],
        coordinates: (doc.data['latitude'] != null)
            ? CoordinatesModel(
                lat: (doc.data['latitude'] as num).toDouble(),
                lng: (doc.data['longitude'] as num).toDouble(),
              )
            : null,
        isDefault: doc.data['isDefault'] ?? false,
      );
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to add address');
    }
  }

  @override
  Future<AddressModel> updateAddress(
    String addressId,
    AddressModel address,
  ) async {
    try {
      final doc = await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customerAddressesCollection,
        rowId: addressId,
        data: {
          'label': address.label,
          'address': address.address,
          'city': address.city,
          'latitude': address.coordinates?.lat,
          'longitude': address.coordinates?.lng,
          'isDefault': address.isDefault,
        },
      );

      return AddressModel(
        id: doc.$id,
        label: doc.data['label'],
        address: doc.data['address'],
        city: doc.data['city'],
        coordinates: (doc.data['latitude'] != null)
            ? CoordinatesModel(
                lat: (doc.data['latitude'] as num).toDouble(),
                lng: (doc.data['longitude'] as num).toDouble(),
              )
            : null,
        isDefault: doc.data['isDefault'] ?? false,
      );
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to update address');
    }
  }

  @override
  Future<void> deleteAddress(String addressId) async {
    try {
      await _tablesDB.deleteRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customerAddressesCollection,
        rowId: addressId,
      );
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to delete address');
    }
  }

  @override
  Future<void> setDefaultAddress(String addressId) async {
    try {
      final customerDoc = await _ensureCustomerDoc();
      final customerId = customerDoc.$id;

      // Unset all current defaults
      final existingAddresses = await _tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customerAddressesCollection,
        queries: [
          Query.equal('customerId', customerId),
          Query.equal('isDefault', true),
        ],
      );
      for (final doc in existingAddresses.rows) {
        await _tablesDB.updateRow(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.customerAddressesCollection,
          rowId: doc.$id,
          data: {'isDefault': false},
        );
      }

      // Set the selected address as default
      await _tablesDB.updateRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.customerAddressesCollection,
        rowId: addressId,
        data: {'isDefault': true},
      );
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to set default address');
    }
  }

  @override
  Future<void> deleteAccount() async {
    try {
      final user = await _account.get();

      // Call server-side function to fully delete the account.
      // This uses the Server SDK (with API key) to call users.delete(),
      // which completely removes the user from Appwrite and frees the
      // email for re-registration.
      final execution = await _functions.createExecution(
        functionId: AppwriteConfig.emailOtpFunction,
        body: jsonEncode({'action': 'delete_account', 'userId': user.$id}),
      );

      Map<String, dynamic> response;
      try {
        final decoded = jsonDecode(execution.responseBody);
        if (decoded is Map<String, dynamic>) {
          response = decoded;
        } else if (decoded is Map) {
          response = Map<String, dynamic>.from(decoded);
        } else {
          throw Exception('Unexpected response from delete function');
        }
      } on FormatException {
        throw Exception('Invalid response from delete function');
      }

      if (response['success'] != true) {
        throw Exception(
          response['error'] as String? ?? 'Failed to delete account',
        );
      }
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to delete account');
    }
  }

  // ============================================================
  // STORAGE HELPERS (replaces Cloudinary)
  // ============================================================

  /// Upload a profile image to Appwrite Storage
  Future<String> uploadProfileImage(String filePath) async {
    try {
      final file = await _storage.createFile(
        bucketId: AppwriteConfig.profileImagesBucket,
        fileId: ID.unique(),
        file: InputFile.fromPath(path: filePath),
      );

      return AppwriteConfig.getFilePreview(
        AppwriteConfig.profileImagesBucket,
        file.$id,
        width: 200,
        height: 200,
      );
    } on AppwriteException catch (e) {
      throw Exception(e.message ?? 'Failed to upload image');
    }
  }
}
