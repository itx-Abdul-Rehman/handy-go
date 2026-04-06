import '../../models/user_model.dart';

/// User remote data source interface
abstract class UserRemoteDataSource {
  Future<CustomerModel> getProfile();
  Future<CustomerModel> updateProfile({
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? profileImage,
    String? preferredLanguage,
  });
  Future<List<AddressModel>> getAddresses();
  Future<AddressModel> addAddress(AddressModel address);
  Future<AddressModel> updateAddress(String addressId, AddressModel address);
  Future<void> setDefaultAddress(String addressId);
  Future<void> deleteAddress(String addressId);
  Future<void> deleteAccount();
}
