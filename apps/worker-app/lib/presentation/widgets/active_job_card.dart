import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../data/models/booking_model.dart';

/// Horizontal card for an active (in-progress) job.
///
/// Usage:
/// ```dart
/// ActiveJobCard(booking: booking, onTap: () => /* navigate */)
/// ```
class ActiveJobCard extends StatelessWidget {
  final BookingModel booking;
  final VoidCallback onTap;

  const ActiveJobCard({super.key, required this.booking, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final surfaceDim = Theme.of(
      context,
    ).colorScheme.onSurface.withValues(alpha: 0.7);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 280,
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status badge + booking number
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.statusInProgress,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusSM),
                  ),
                  child: const Text(
                    'IN PROGRESS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textOnPrimary,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Flexible(
                  child: Text(
                    booking.bookingNumber,
                    style: TextStyle(fontSize: 12, color: surfaceDim),
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.end,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),

            // Category
            Text(
              booking.serviceCategory.replaceAll('_', ' '),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.xs),

            // Description
            Flexible(
              child: Text(
                booking.problemDescription,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 13, color: surfaceDim),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),

            // City
            Row(
              children: [
                Icon(Icons.location_on_outlined, size: 16, color: surfaceDim),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    booking.address.city,
                    style: TextStyle(fontSize: 12, color: surfaceDim),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
