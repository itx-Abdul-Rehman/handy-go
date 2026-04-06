import '../../domain/repositories/user_repository.dart';
import '../models/user_model.dart';
import '../datasources/remote/user_remote_datasource.dart';

/// User repository implementation
class UserRepositoryImpl implements UserRepository {
  final UserRemoteDataSource _remoteDataSource;

  UserRepositoryImpl({required UserRemoteDataSource remoteDataSource})
    : _remoteDataSource = remoteDataSource;

  @override
  Future<CustomerModel> getProfile() async {
    return await _remoteDataSource.getProfile();
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
    return await _remoteDataSource.updateProfile(
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      profileImage: profileImage,
      preferredLanguage: preferredLanguage,
    );
  }

  @override
  Future<List<AddressModel>> getAddresses() async {
    return await _remoteDataSource.getAddresses();
  }

  @override
  Future<AddressModel> addAddress(AddressModel address) async {
    return await _remoteDataSource.addAddress(address);
  }

  @override
  Future<AddressModel> updateAddress(
    String addressId,
    AddressModel address,
  ) async {
    return await _remoteDataSource.updateAddress(addressId, address);
  }

  @override
  Future<void> setDefaultAddress(String addressId) async {
    await _remoteDataSource.setDefaultAddress(addressId);
  }

  @override
  Future<void> deleteAddress(String addressId) async {
    await _remoteDataSource.deleteAddress(addressId);
  }

  @override
  Future<void> deleteAccount() async {
    await _remoteDataSource.deleteAccount();
  }
}
