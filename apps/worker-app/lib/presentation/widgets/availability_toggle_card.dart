import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';

/// Toggle card showing the worker's online/offline status with a switch.
///
/// Usage:
/// ```dart
/// AvailabilityToggleCard(
///   isAvailable: true,
///   onToggle: () => bloc.add(HomeToggleAvailability()),
/// )
/// ```
class AvailabilityToggleCard extends StatelessWidget {
  final bool isAvailable;
  final VoidCallback onToggle;

  const AvailabilityToggleCard({
    super.key,
    required this.isAvailable,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: isAvailable
            ? AppColors.primaryGradient
            : const LinearGradient(
                colors: [Color(0xFF555555), Color(0xFF757575)],
              ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLG),
        boxShadow: [
          BoxShadow(
            color:
                (isAvailable
                        ? AppColors.primary
                        : Theme.of(
                            context,
                          ).colorScheme.onSurface.withValues(alpha: 0.7))
                    .withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isAvailable ? 'You are Online' : 'You are Offline',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textOnPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isAvailable
                      ? 'Ready to receive job requests'
                      : 'Toggle to start receiving jobs',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textOnPrimary.withValues(alpha: 0.9),
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: isAvailable,
            onChanged: (_) => onToggle(),
            activeThumbColor: AppColors.textOnPrimary,
            activeTrackColor: AppColors.textOnPrimary.withValues(alpha: 0.3),
            inactiveThumbColor: AppColors.textOnPrimary,
            inactiveTrackColor: AppColors.textOnPrimary.withValues(alpha: 0.3),
          ),
        ],
      ),
    );
  }
}
