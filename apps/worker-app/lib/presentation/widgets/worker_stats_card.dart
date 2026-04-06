import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';

/// A compact row of worker statistics (rating, jobs completed, trust score).
///
/// Usage:
/// ```dart
/// WorkerStatsCard(
///   rating: 4.5,
///   totalJobs: 120,
///   trustScore: 85,
/// )
/// ```
class WorkerStatsCard extends StatelessWidget {
  final double rating;
  final int totalJobs;
  final int trustScore;

  const WorkerStatsCard({
    super.key,
    required this.rating,
    required this.totalJobs,
    required this.trustScore,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Container(
        padding: const EdgeInsets.symmetric(
          vertical: AppSpacing.md,
          horizontal: AppSpacing.lg,
        ),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildStat(
              context,
              Icons.star,
              rating.toStringAsFixed(1),
              'Rating',
              AppColors.starActive,
            ),
            Container(width: 1, height: 36, color: AppColors.border),
            _buildStat(
              context,
              Icons.check_circle,
              '$totalJobs',
              'Jobs',
              AppColors.success,
            ),
            Container(width: 1, height: 36, color: AppColors.border),
            _buildStat(
              context,
              Icons.verified_user,
              '$trustScore',
              'Trust',
              AppColors.info,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(
    BuildContext context,
    IconData icon,
    String value,
    String label,
    Color color,
  ) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 4),
            Text(
              value,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Theme.of(
              context,
            ).colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        ),
      ],
    );
  }
}
