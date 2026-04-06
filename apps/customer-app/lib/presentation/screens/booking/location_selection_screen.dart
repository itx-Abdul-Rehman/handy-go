import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../data/models/user_model.dart';
import '../../blocs/user/user_bloc.dart';
import '../../blocs/user/user_event.dart';
import '../../blocs/user/user_state.dart';

/// Location selection screen for booking
class LocationSelectionScreen extends StatefulWidget {
  const LocationSelectionScreen({super.key});

  @override
  State<LocationSelectionScreen> createState() =>
      _LocationSelectionScreenState();
}

class _LocationSelectionScreenState extends State<LocationSelectionScreen> {
  final _addressController = TextEditingController();
  String _selectedCity = 'Karachi';
  bool _saveAddress = false;
  int _selectedAddressIndex = -1;
  bool _isLoadingLocation = false;
  double? _latitude;
  double? _longitude;
  GoogleMapController? _mapController;

  // Booking context from service selection screen
  Map<String, dynamic> _bookingContext = {};

  final List<String> _cities = [
    'Karachi',
    'Lahore',
    'Islamabad',
    'Rawalpindi',
    'Faisalabad',
    'Multan',
    'Peshawar',
    'Quetta',
  ];

  @override
  void initState() {
    super.initState();
    // Load user's saved addresses
    context.read<UserBloc>().add(const LoadAddressesRequested());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null && _bookingContext.isEmpty) {
      _bookingContext = Map<String, dynamic>.from(args);
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _useCurrentLocation() async {
    setState(() {
      _isLoadingLocation = true;
      _addressController.text = 'Getting your location...';
    });

    try {
      // Check location permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permissions are denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception(
          'Location permissions are permanently denied. Please enable from settings.',
        );
      }

      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled. Please enable GPS.');
      }

      // Get current position
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 15),
      );

      _latitude = position.latitude;
      _longitude = position.longitude;

      // Animate map to current location
      _mapController?.animateCamera(
        CameraUpdate.newLatLng(LatLng(position.latitude, position.longitude)),
      );

      // Reverse geocode to get address
      try {
        final placemarks = await placemarkFromCoordinates(
          position.latitude,
          position.longitude,
        );

        if (placemarks.isNotEmpty) {
          final place = placemarks.first;
          final address = [
            place.street,
            place.subLocality,
            place.locality,
          ].where((s) => s != null && s.isNotEmpty).join(', ');

          if (mounted) {
            setState(() {
              _addressController.text = address.isNotEmpty
                  ? address
                  : '${position.latitude}, ${position.longitude}';
              _selectedCity = place.locality ?? 'Karachi';
              _selectedAddressIndex = -1;
              _isLoadingLocation = false;
            });
          }
        }
      } catch (e) {
        // If geocoding fails, just use coordinates
        if (mounted) {
          setState(() {
            _addressController.text =
                '${position.latitude.toStringAsFixed(6)}, ${position.longitude.toStringAsFixed(6)}';
            _isLoadingLocation = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingLocation = false;
          _addressController.text = '';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _selectSavedAddress(int index, List<AddressModel> savedAddresses) {
    if (index >= 0 && index < savedAddresses.length) {
      final address = savedAddresses[index];
      setState(() {
        _selectedAddressIndex = index;
        _addressController.text = address.address;
        _selectedCity = address.city;
        _latitude = address.coordinates?.lat;
        _longitude = address.coordinates?.lng;
      });
      // Animate map to saved address location
      if (address.coordinates != null) {
        _mapController?.animateCamera(
          CameraUpdate.newLatLng(
            LatLng(address.coordinates!.lat, address.coordinates!.lng),
          ),
        );
      }
    }
  }

  void _confirmLocation() {
    if (_addressController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter or select an address')),
      );
      return;
    }

    // Save address if checkbox is checked
    if (_saveAddress && _addressController.text.isNotEmpty) {
      context.read<UserBloc>().add(
        AddAddressRequested(
          label: 'Other',
          address: _addressController.text,
          city: _selectedCity,
          lat: _latitude,
          lng: _longitude,
          isDefault: false,
        ),
      );
    }

    // Pass accumulated booking context + location data to next screen
    Navigator.of(context).pushNamed(
      AppRoutes.schedule,
      arguments: {
        ..._bookingContext,
        'address': _addressController.text,
        'city': _selectedCity,
        'latitude': _latitude,
        'longitude': _longitude,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return BlocListener<UserBloc, UserState>(
      listener: (context, state) {
        if (state is AddressActionSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.success,
            ),
          );
        } else if (state is UserError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      child: BlocBuilder<UserBloc, UserState>(
        builder: (context, state) {
          List<AddressModel> savedAddresses = [];
          if (state is UserProfileLoaded) {
            savedAddresses = state.addresses;
          }

          return Scaffold(
            appBar: AppBar(title: const Text('Select Location')),
            body: Column(
              children: [
                // Interactive Google Map
                SizedBox(
                  height: 250,
                  width: double.infinity,
                  child: GoogleMap(
                    initialCameraPosition: CameraPosition(
                      target: LatLng(
                        _latitude ?? 24.8607, // Default: Karachi
                        _longitude ?? 67.0011,
                      ),
                      zoom: 14,
                    ),
                    markers: _latitude != null && _longitude != null
                        ? {
                            Marker(
                              markerId: const MarkerId('selected'),
                              position: LatLng(_latitude!, _longitude!),
                              icon: BitmapDescriptor.defaultMarkerWithHue(
                                BitmapDescriptor.hueRed,
                              ),
                            ),
                          }
                        : {},
                    myLocationEnabled: true,
                    myLocationButtonEnabled: false,
                    zoomControlsEnabled: false,
                    onMapCreated: (controller) {
                      _mapController = controller;
                    },
                    onTap: (position) async {
                      setState(() {
                        _latitude = position.latitude;
                        _longitude = position.longitude;
                        _selectedAddressIndex = -1;
                        _addressController.text = 'Loading address...';
                      });
                      // Reverse geocode the tapped position
                      try {
                        final placemarks = await placemarkFromCoordinates(
                          position.latitude,
                          position.longitude,
                        );
                        if (placemarks.isNotEmpty && mounted) {
                          final place = placemarks.first;
                          final address = [
                            place.street,
                            place.subLocality,
                            place.locality,
                          ].where((s) => s != null && s.isNotEmpty).join(', ');
                          setState(() {
                            _addressController.text = address.isNotEmpty
                                ? address
                                : '${position.latitude.toStringAsFixed(6)}, ${position.longitude.toStringAsFixed(6)}';
                            if (place.locality != null &&
                                _cities.contains(place.locality)) {
                              _selectedCity = place.locality!;
                            }
                          });
                        }
                      } catch (_) {
                        if (mounted) {
                          setState(() {
                            _addressController.text =
                                '${position.latitude.toStringAsFixed(6)}, ${position.longitude.toStringAsFixed(6)}';
                          });
                        }
                      }
                    },
                  ),
                ),

                // Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Current location button
                        GestureDetector(
                          onTap: _isLoadingLocation
                              ? null
                              : _useCurrentLocation,
                          child: Container(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            decoration: BoxDecoration(
                              color: colorScheme.surface,
                              borderRadius: BorderRadius.circular(
                                AppSpacing.radiusMd,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: theme.shadowColor.withValues(
                                    alpha: 0.1,
                                  ),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(AppSpacing.sm),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(
                                      alpha: 0.1,
                                    ),
                                    shape: BoxShape.circle,
                                  ),
                                  child: _isLoadingLocation
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                          ),
                                        )
                                      : const Icon(
                                          Icons.my_location,
                                          color: AppColors.primary,
                                          size: 20,
                                        ),
                                ),
                                const SizedBox(width: AppSpacing.md),
                                Text(
                                  _isLoadingLocation
                                      ? 'Getting location...'
                                      : 'Use current location',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: AppSpacing.lg),

                        // Saved addresses
                        if (savedAddresses.isNotEmpty) ...[
                          Text(
                            'Saved Addresses',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          Column(
                            children: List.generate(
                              savedAddresses.length,
                              (index) =>
                                  _buildSavedAddressCard(index, savedAddresses),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.lg),
                        ],

                        // Manual address entry
                        Text(
                          'Or enter address manually',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),

                        // Address input
                        TextField(
                          controller: _addressController,
                          maxLines: 2,
                          decoration: const InputDecoration(
                            labelText: 'Full Address',
                            hintText: 'House/Flat no., Street, Area',
                            prefixIcon: Icon(Icons.location_on_outlined),
                          ),
                          onChanged: (value) {
                            // Clear selected address when typing manually
                            if (_selectedAddressIndex >= 0) {
                              setState(() => _selectedAddressIndex = -1);
                            }
                          },
                        ),

                        const SizedBox(height: AppSpacing.md),

                        // City dropdown
                        DropdownButtonFormField<String>(
                          initialValue: _selectedCity,
                          decoration: const InputDecoration(
                            labelText: 'City',
                            prefixIcon: Icon(Icons.location_city_outlined),
                          ),
                          items: _cities.map((city) {
                            return DropdownMenuItem(
                              value: city,
                              child: Text(city),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() => _selectedCity = value!);
                          },
                        ),

                        const SizedBox(height: AppSpacing.md),

                        // Save address checkbox
                        Row(
                          children: [
                            SizedBox(
                              width: 24,
                              height: 24,
                              child: Checkbox(
                                value: _saveAddress,
                                onChanged: (value) {
                                  setState(() => _saveAddress = value ?? false);
                                },
                                activeColor: AppColors.primary,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            const Expanded(
                              child: Text(
                                'Save this address for future bookings',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            bottomNavigationBar: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: ElevatedButton(
                  onPressed: _confirmLocation,
                  child: const Text('Confirm Location'),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSavedAddressCard(int index, List<AddressModel> savedAddresses) {
    final address = savedAddresses[index];
    final isSelected = _selectedAddressIndex == index;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return GestureDetector(
      onTap: () => _selectSavedAddress(index, savedAddresses),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.primary.withValues(alpha: 0.1)
                    : colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getAddressIcon(address.label),
                color: isSelected
                    ? AppColors.primary
                    : colorScheme.onSurface.withValues(alpha: 0.7),
                size: 20,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        address.label,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      if (address.isDefault) ...[
                        const SizedBox(width: AppSpacing.sm),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.sm,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(
                              AppSpacing.radiusXs,
                            ),
                          ),
                          child: const Text(
                            'Default',
                            style: TextStyle(
                              fontSize: 10,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${address.address}, ${address.city}',
                    style: TextStyle(
                      fontSize: 12,
                      color: colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Radio<int>(
              value: index,
              groupValue: _selectedAddressIndex,
              activeColor: AppColors.primary,
              onChanged: (int? value) =>
                  _selectSavedAddress(value!, savedAddresses),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getAddressIcon(String label) {
    switch (label.toLowerCase()) {
      case 'home':
        return Icons.home;
      case 'work':
      case 'office':
        return Icons.work;
      default:
        return Icons.location_on;
    }
  }
}
