import 'package:flutter/material.dart';
import '../../../core/constants/app_spacing.dart';

/// Privacy Policy screen
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy Policy')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSection(
              context,
              'Privacy Policy',
              'Your privacy is important to us. This Privacy Policy explains how HandyGo '
                  'collects, uses, discloses, and safeguards your information when you use our '
                  'mobile application.',
            ),
            _buildSection(
              context,
              '1. Information We Collect',
              'Personal Information:\n'
                  '• Name and contact information (phone number, email)\n'
                  '• Profile photo (optional)\n'
                  '• CNIC number (for workers)\n'
                  '• Payment information\n'
                  '• Address and location data\n\n'
                  'Usage Information:\n'
                  '• App usage patterns and preferences\n'
                  '• Service history and bookings\n'
                  '• Reviews and ratings\n'
                  '• Device information and identifiers',
            ),
            _buildSection(
              context,
              '2. How We Use Your Information',
              'We use the collected information to:\n\n'
                  '• Facilitate service bookings and connections\n'
                  '• Process payments and transactions\n'
                  '• Verify user identity and prevent fraud\n'
                  '• Send important notifications and updates\n'
                  '• Improve our services and user experience\n'
                  '• Provide customer support\n'
                  '• Ensure safety through location tracking during active bookings',
            ),
            _buildSection(
              context,
              '3. Location Data',
              'We collect location data to:\n\n'
                  '• Connect you with nearby service providers\n'
                  '• Provide accurate service delivery\n'
                  '• Track worker location during active bookings for safety\n'
                  '• Enable the SOS feature for emergencies\n\n'
                  'You can control location permissions through your device settings.',
            ),
            _buildSection(
              context,
              '4. Information Sharing',
              'We may share your information with:\n\n'
                  '• Service providers to fulfill your bookings\n'
                  '• Payment processors for transactions\n'
                  '• Law enforcement when required by law\n'
                  '• Third-party analytics services (anonymized data)\n\n'
                  'We do NOT sell your personal information to third parties.',
            ),
            _buildSection(
              context,
              '5. Data Security',
              'We implement appropriate security measures including:\n\n'
                  '• Encryption of sensitive data\n'
                  '• Secure authentication protocols\n'
                  '• Regular security audits\n'
                  '• Access controls for employee data access\n'
                  '• Secure data storage infrastructure',
            ),
            _buildSection(
              context,
              '6. Data Retention',
              '• Active account data is retained while your account is active\n'
                  '• Transaction records are kept for 7 years for legal compliance\n'
                  '• Deleted account data is removed within 90 days\n'
                  '• Anonymized data may be retained for analytics purposes',
            ),
            _buildSection(
              context,
              '7. Your Rights',
              'You have the right to:\n\n'
                  '• Access your personal data\n'
                  '• Correct inaccurate information\n'
                  '• Delete your account and data\n'
                  '• Opt-out of marketing communications\n'
                  '• Export your data\n\n'
                  'Contact us to exercise these rights.',
            ),
            _buildSection(
              context,
              '8. Cookies and Tracking',
              'We use cookies and similar technologies to:\n\n'
                  '• Remember your preferences\n'
                  '• Analyze app usage\n'
                  '• Improve performance\n'
                  '• Deliver personalized content',
            ),
            _buildSection(
              context,
              '9. Children\'s Privacy',
              'HandyGo is not intended for users under 18 years of age. '
                  'We do not knowingly collect information from children.',
            ),
            _buildSection(
              context,
              '10. Changes to This Policy',
              'We may update this Privacy Policy periodically. '
                  'We will notify you of significant changes through the app or email.',
            ),
            _buildSection(
              context,
              '11. Contact Us',
              'For privacy-related inquiries, please contact:\n\n'
                  'Email: privacy@handygo.com\n'
                  'Phone: +92 300 1234567\n\n'
                  'Data Protection Officer:\n'
                  'dpo@handygo.com',
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Last updated: January 2026',
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
