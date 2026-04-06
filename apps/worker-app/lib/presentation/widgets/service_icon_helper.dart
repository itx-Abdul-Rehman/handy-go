import 'package:flutter/material.dart';

/// Maps service category strings to appropriate Material Design icons.
///
/// Usage:
/// ```dart
/// Icon(ServiceIconHelper.icon('PLUMBING'), color: Colors.blue)
/// ```
class ServiceIconHelper {
  ServiceIconHelper._();

  static IconData icon(String category) {
    switch (category) {
      case 'PLUMBING':
        return Icons.plumbing;
      case 'ELECTRICAL':
        return Icons.electrical_services;
      case 'CLEANING':
        return Icons.cleaning_services;
      case 'AC_REPAIR':
        return Icons.ac_unit;
      case 'CARPENTER':
        return Icons.carpenter;
      case 'PAINTING':
        return Icons.format_paint;
      case 'MECHANIC':
        return Icons.build;
      case 'GENERAL_HANDYMAN':
        return Icons.handyman;
      default:
        return Icons.handyman;
    }
  }
}
