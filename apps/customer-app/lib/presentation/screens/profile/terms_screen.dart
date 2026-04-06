import 'package:flutter/material.dart';
import '../../../core/constants/app_spacing.dart';

/// Terms and Conditions screen
class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Terms & Conditions')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSection(
              context,
              'Welcome to HandyGo',
              'By downloading, accessing, or using the HandyGo mobile application ("App"), '
                  'you agree to be bound by these Terms and Conditions. Please read them carefully '
                  'before using our services.',
            ),
            _buildSection(
              context,
              '1. Services Description',
              'HandyGo provides a platform connecting customers with skilled service providers '
                  '(workers) for various home maintenance and repair services including but not limited to:\n\n'
                  '• Plumbing\n'
                  '• Electrical work\n'
                  '• Cleaning services\n'
                  '• AC repair and maintenance\n'
                  '• Carpentry\n'
                  '• Painting\n'
                  '• General handyman services',
            ),
            _buildSection(
              context,
              '2. User Registration',
              '• Users must provide accurate and complete information during registration\n'
                  '• Users must be at least 18 years old to create an account\n'
                  '• Users are responsible for maintaining the confidentiality of their account credentials\n'
                  '• One person may only have one active account',
            ),
            _buildSection(
              context,
              '3. Booking and Payment',
              '• All bookings are subject to availability of service providers\n'
                  '• Prices shown are estimates and may vary based on actual work required\n'
                  '• Payment is due upon completion of service unless otherwise agreed\n'
                  '• Accepted payment methods include cash, digital wallet, and card payments',
            ),
            _buildSection(
              context,
              '4. Cancellation Policy',
              '• Free cancellation is available up to 1 hour before scheduled service time\n'
                  '• Late cancellations may incur a cancellation fee\n'
                  '• Workers who cancel repeatedly may face account restrictions\n'
                  '• Refunds for prepaid services will be processed within 5-7 business days',
            ),
            _buildSection(
              context,
              '5. Service Quality',
              '• HandyGo strives to connect customers with verified and skilled workers\n'
                  '• All workers undergo background verification before onboarding\n'
                  '• Customers can rate and review services to help maintain quality standards\n'
                  '• HandyGo reserves the right to remove underperforming workers from the platform',
            ),
            _buildSection(
              context,
              '6. Safety and Security',
              '• The SOS feature is available for emergency situations\n'
                  '• Report any safety concerns immediately through the app\n'
                  '• HandyGo maintains records of all service transactions\n'
                  '• Location tracking during active bookings is for safety purposes',
            ),
            _buildSection(
              context,
              '7. User Conduct',
              'Users agree not to:\n\n'
                  '• Use the platform for any illegal purposes\n'
                  '• Harass, abuse, or discriminate against service providers\n'
                  '• Attempt to contact workers outside the platform for services\n'
                  '• Share account credentials with others\n'
                  '• Provide false information or reviews',
            ),
            _buildSection(
              context,
              '8. Liability',
              '• HandyGo acts as an intermediary platform\n'
                  '• We are not liable for the quality of work performed by service providers\n'
                  '• Disputes between customers and workers should be reported through the app\n'
                  '• Maximum liability is limited to the service fee paid',
            ),
            _buildSection(
              context,
              '9. Modifications',
              'HandyGo reserves the right to modify these terms at any time. '
                  'Users will be notified of significant changes through the app or email.',
            ),
            _buildSection(
              context,
              '10. Contact Information',
              'For questions about these terms, please contact us at:\n\n'
                  'Email: support@handygo.com\n'
                  'Phone: +92 300 1234567\n'
                  'WhatsApp: +92 300 1234567',
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Last updated: January 2024',
              style: TextStyle(
                fontSize: 12,
                color: colorScheme.onSurface.withValues(alpha: 0.5),
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, String content) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withValues(alpha: 0.1),
            blurRadius: 5,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            content,
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurface.withValues(alpha: 0.7),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
