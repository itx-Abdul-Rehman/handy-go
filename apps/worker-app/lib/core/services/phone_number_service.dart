import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';

/// Model representing a phone number detected from a SIM card.
class SimPhoneNumber {
  final String phone;
  final String carrier;
  final int slot;
  final String countryIso;

  const SimPhoneNumber({
    required this.phone,
    required this.carrier,
    required this.slot,
    required this.countryIso,
  });

  /// Normalizes the phone number to +92 format (Pakistan).
  /// Handles: 03XX..., 923XX..., +923XX..., 3XX...
  String get normalizedPhone {
    String cleaned = phone.replaceAll(RegExp(r'[\s\-\(\)]'), '');

    // Already in +92 format
    if (cleaned.startsWith('+92')) return cleaned;

    // Starts with 92 (without +)
    if (cleaned.startsWith('92') && cleaned.length >= 12) {
      return '+$cleaned';
    }

    // Starts with 0 (local format: 03XX...)
    if (cleaned.startsWith('0') && cleaned.length >= 11) {
      return '+92${cleaned.substring(1)}';
    }

    // Starts with 3 (without country code)
    if (cleaned.startsWith('3') && cleaned.length >= 10) {
      return '+92$cleaned';
    }

    // Return as-is with + prefix if not already
    return cleaned.startsWith('+') ? cleaned : '+$cleaned';
  }

  @override
  String toString() =>
      'SimPhoneNumber(phone: $phone, carrier: $carrier, slot: $slot)';
}

/// Service for detecting phone numbers from SIM cards installed on the device.
/// Uses Android MethodChannel to access SubscriptionManager/TelephonyManager.
class PhoneNumberService {
  static const _channel = MethodChannel('com.handygo/phone_number');

  /// Request permission to read phone state and phone numbers.
  /// Returns true if permission is granted.
  static Future<bool> requestPermission() async {
    try {
      final phoneStatus = await Permission.phone.request();
      debugPrint('[PhoneNumberService] Phone permission status: $phoneStatus');
      return phoneStatus.isGranted;
    } catch (e) {
      debugPrint('[PhoneNumberService] Error requesting permission: $e');
      return false;
    }
  }

  /// Check if phone permission is already granted.
  static Future<bool> hasPermission() async {
    return await Permission.phone.isGranted;
  }

  /// Get phone numbers from all SIM cards on the device.
  /// Returns an empty list if no numbers are detected or on error.
  ///
  /// NOTE: Not all carriers store the phone number on the SIM card.
  /// This may return an empty list even with permission granted.
  static Future<List<SimPhoneNumber>> getSimPhoneNumbers() async {
    try {
      final hasPerms = await hasPermission();
      if (!hasPerms) {
        debugPrint(
          '[PhoneNumberService] Permission not granted, requesting...',
        );
        final granted = await requestPermission();
        if (!granted) {
          debugPrint('[PhoneNumberService] Permission denied by user');
          return [];
        }
      }

      debugPrint('[PhoneNumberService] Calling native getPhoneNumbers...');
      final result = await _channel.invokeListMethod<Map>('getPhoneNumbers');

      if (result == null || result.isEmpty) {
        debugPrint('[PhoneNumberService] No phone numbers detected from SIM');
        return [];
      }

      final numbers = result
          .map((map) {
            return SimPhoneNumber(
              phone: (map['phone'] as String?) ?? '',
              carrier: (map['carrier'] as String?) ?? 'Unknown',
              slot: int.tryParse((map['slot'] as String?) ?? '0') ?? 0,
              countryIso: (map['countryIso'] as String?) ?? '',
            );
          })
          .where((n) => n.phone.isNotEmpty)
          .toList();

      debugPrint(
        '[PhoneNumberService] Detected ${numbers.length} phone number(s): ${numbers.map((n) => n.normalizedPhone).join(', ')}',
      );
      return numbers;
    } on PlatformException catch (e) {
      debugPrint(
        '[PhoneNumberService] Platform error: ${e.code} - ${e.message}',
      );
      return [];
    } catch (e) {
      debugPrint('[PhoneNumberService] Error getting phone numbers: $e');
      return [];
    }
  }

  /// Get the primary (first SIM slot) phone number.
  /// Returns null if no number is detected.
  static Future<String?> getPrimaryPhoneNumber() async {
    final numbers = await getSimPhoneNumbers();
    if (numbers.isEmpty) return null;
    return numbers.first.normalizedPhone;
  }
}
