import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../data/models/booking_model.dart';
import 'service_icon_helper.dart';

/// Card for an available job that the worker can tap to view details.
///
/// Usage:
/// ```dart
/// AvailableJobCard(
///   booking: booking,
///   onTap: () => Navigator.pushNamed(context, AppRoutes.bookingDetails, arguments: booking.id),
/// )
/// ```
class AvailableJobCard extends StatelessWidget {
  final BookingModel booking;
  final VoidCallback onTap;

  const AvailableJobCard({
    super.key,
    required this.booking,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final surfaceDim = Theme.of(
      context,
    ).colorScheme.onSurface.withValues(alpha: 0.7);

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusSM),
                    ),
                    child: Icon(
                      ServiceIconHelper.icon(booking.serviceCategory),
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          booking.serviceCategory.replaceAll('_', ' '),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          booking.customer.fullName,
                          style: TextStyle(fontSize: 14, color: surfaceDim),
                        ),
                      ],
                    ),
                  ),
                  if (booking.isUrgent) _urgentBadge(),
                ],
              ),

              const SizedBox(height: AppSpacing.md),

              // Description
              Text(
                booking.problemDescription,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 14, color: surfaceDim),
              ),
              const SizedBox(height: AppSpacing.md),

              // Footer row – address + price
              Row(
                children: [
                  Icon(Icons.location_on_outlined, size: 16, color: surfaceDim),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      booking.address.full,
                      style: TextStyle(fontSize: 12, color: surfaceDim),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    'Rs. ${booking.pricing.estimatedPrice?.toStringAsFixed(0) ?? '---'}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _urgentBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: AppColors.error,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSM),
      ),
      child: const Text(
        'URGENT',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: AppColors.textOnPrimary,
        ),
      ),
    );
  }
}
