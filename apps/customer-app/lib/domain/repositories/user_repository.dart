import '../../data/models/user_model.dart';

/// User repository interface
abstract class UserRepository {
  /// Get the current user's profile
  Future<CustomerModel> getProfile();

  /// Update the current user's profile
  Future<CustomerModel> updateProfile({
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? profileImage,
    String? preferredLanguage,
  });

  /// Get user's saved addresses
  Future<List<AddressModel>> getAddresses();

  /// Add a new address
  Future<AddressModel> addAddress(AddressModel address);

  /// Update an existing address
  Future<AddressModel> updateAddress(String addressId, AddressModel address);

  /// Set an address as the default
  Future<void> setDefaultAddress(String addressId);

  /// Delete an address
  Future<void> deleteAddress(String addressId);

  /// Delete the user's account
  Future<void> deleteAccount();
}
