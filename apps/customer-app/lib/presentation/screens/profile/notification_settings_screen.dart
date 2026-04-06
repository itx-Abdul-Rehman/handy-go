import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';

/// Notification Settings screen
class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState
    extends State<NotificationSettingsScreen> {
  // Keys for SharedPreferences
  static const String _keyPushEnabled = 'notif_push_enabled';
  static const String _keySmsEnabled = 'notif_sms_enabled';
  static const String _keyEmailEnabled = 'notif_email_enabled';
  static const String _keyBookingUpdates = 'notif_booking_updates';
  static const String _keyWorkerArrival = 'notif_worker_arrival';
  static const String _keyPaymentAlerts = 'notif_payment_alerts';
  static const String _keyPromotions = 'notif_promotions';
  static const String _keySosAlerts = 'notif_sos_alerts';
  static const String _keyChatMessages = 'notif_chat_messages';
  static const String _keyQuietHoursEnabled = 'notif_quiet_hours_enabled';
  static const String _keyQuietStartHour = 'notif_quiet_start_hour';
  static const String _keyQuietStartMinute = 'notif_quiet_start_minute';
  static const String _keyQuietEndHour = 'notif_quiet_end_hour';
  static const String _keyQuietEndMinute = 'notif_quiet_end_minute';

  bool _isLoading = true;

  // Notification preferences
  bool _pushEnabled = true;
  bool _smsEnabled = true;
  bool _emailEnabled = false;

  // Notification types
  bool _bookingUpdates = true;
  bool _workerArrival = true;
  bool _paymentAlerts = true;
  bool _promotions = true;
  bool _sosAlerts = true;
  bool _chatMessages = true;

  // Quiet hours
  bool _quietHoursEnabled = false;
  TimeOfDay _quietStart = const TimeOfDay(hour: 22, minute: 0);
  TimeOfDay _quietEnd = const TimeOfDay(hour: 7, minute: 0);

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _pushEnabled = prefs.getBool(_keyPushEnabled) ?? true;
      _smsEnabled = prefs.getBool(_keySmsEnabled) ?? true;
      _emailEnabled = prefs.getBool(_keyEmailEnabled) ?? false;
      _bookingUpdates = prefs.getBool(_keyBookingUpdates) ?? true;
      _workerArrival = prefs.getBool(_keyWorkerArrival) ?? true;
      _paymentAlerts = prefs.getBool(_keyPaymentAlerts) ?? true;
      _promotions = prefs.getBool(_keyPromotions) ?? true;
      _sosAlerts = prefs.getBool(_keySosAlerts) ?? true;
      _chatMessages = prefs.getBool(_keyChatMessages) ?? true;
      _quietHoursEnabled = prefs.getBool(_keyQuietHoursEnabled) ?? false;
      _quietStart = TimeOfDay(
        hour: prefs.getInt(_keyQuietStartHour) ?? 22,
        minute: prefs.getInt(_keyQuietStartMinute) ?? 0,
      );
      _quietEnd = TimeOfDay(
        hour: prefs.getInt(_keyQuietEndHour) ?? 7,
        minute: prefs.getInt(_keyQuietEndMinute) ?? 0,
      );
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Notification Settings')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Notification Settings')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Notification channels
            _buildSectionTitle('Notification Channels'),
            _buildSettingsCard([
              _buildSwitchTile(
                icon: Icons.notifications,
                title: 'Push Notifications',
                subtitle: 'Receive push notifications on your device',
                value: _pushEnabled,
                onChanged: (value) => setState(() => _pushEnabled = value),
              ),
              const Divider(height: 1, indent: 56),
              _buildSwitchTile(
                icon: Icons.sms,
                title: 'SMS Notifications',
                subtitle: 'Receive text messages for important updates',
                value: _smsEnabled,
                onChanged: (value) => setState(() => _smsEnabled = value),
              ),
              const Divider(height: 1, indent: 56),
              _buildSwitchTile(
                icon: Icons.email,
                title: 'Email Notifications',
                subtitle: 'Receive email for receipts and summaries',
                value: _emailEnabled,
                onChanged: (value) => setState(() => _emailEnabled = value),
              ),
            ]),

            const SizedBox(height: AppSpacing.lg),

            // Notification types
            _buildSectionTitle('Notification Types'),
            _buildSettingsCard([
              _buildSwitchTile(
                icon: Icons.calendar_today,
                title: 'Booking Updates',
                subtitle: 'Status changes, confirmations, and reminders',
                value: _bookingUpdates,
                onChanged: (value) => setState(() => _bookingUpdates = value),
              ),
              const Divider(height: 1, indent: 56),
              _buildSwitchTile(
                icon: Icons.directions_walk,
                title: 'Worker Arrival',
                subtitle: 'Get notified when worker is on the way',
                value: _workerArrival,
                onChanged: (value) => setState(() => _workerArrival = value),
              ),
              const Divider(height: 1, indent: 56),
              _buildSwitchTile(
                icon: Icons.payment,
                title: 'Payment Alerts',
                subtitle: 'Payment confirmations and wallet updates',
                value: _paymentAlerts,
                onChanged: (value) => setState(() => _paymentAlerts = value),
              ),
              const Divider(height: 1, indent: 56),
              _buildSwitchTile(
                icon: Icons.local_offer,
                title: 'Promotions & Offers',
                subtitle: 'Discounts, deals, and special offers',
                value: _promotions,
                onChanged: (value) => setState(() => _promotions = value),
              ),
              const Divider(height: 1, indent: 56),
              _buildSwitchTile(
                icon: Icons.warning,
                title: 'SOS Alerts',
                subtitle: 'Emergency and safety notifications (recommended)',
                value: _sosAlerts,
                onChanged: (value) => setState(() => _sosAlerts = value),
                isImportant: true,
              ),
              const Divider(height: 1, indent: 56),
              _buildSwitchTile(
                icon: Icons.chat,
                title: 'Chat Messages',
                subtitle: 'Messages from workers',
                value: _chatMessages,
                onChanged: (value) => setState(() => _chatMessages = value),
              ),
            ]),

            const SizedBox(height: AppSpacing.lg),

            // Quiet hours
            _buildSectionTitle('Quiet Hours'),
            _buildSettingsCard([
              _buildSwitchTile(
                icon: Icons.do_not_disturb,
                title: 'Enable Quiet Hours',
                subtitle: 'Mute non-urgent notifications during set times',
                value: _quietHoursEnabled,
                onChanged: (value) =>
                    setState(() => _quietHoursEnabled = value),
              ),
              if (_quietHoursEnabled) ...[
                const Divider(height: 1, indent: 56),
                _buildTimeTile(
                  icon: Icons.nightlight,
                  title: 'Start Time',
                  time: _quietStart,
                  onTap: () => _selectTime(context, true),
                ),
                const Divider(height: 1, indent: 56),
                _buildTimeTile(
                  icon: Icons.wb_sunny,
                  title: 'End Time',
                  time: _quietEnd,
                  onTap: () => _selectTime(context, false),
                ),
              ],
            ]),

            const SizedBox(height: AppSpacing.lg),

            // Info text
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.info.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                border: Border.all(
                  color: AppColors.info.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: AppColors.info),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      'SOS alerts will always be delivered regardless of your notification settings',
                      style: TextStyle(fontSize: 13, color: AppColors.info),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Save button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saveSettings,
                child: const Text('Save Settings'),
              ),
            ),

            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(
        left: AppSpacing.sm,
        bottom: AppSpacing.sm,
      ),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: colorScheme.onSurface.withValues(alpha: 0.7),
        ),
      ),
    );
  }

  Widget _buildSettingsCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 5),
        ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
    bool isImportant = false,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: (isImportant ? AppColors.warning : AppColors.primary)
              .withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Icon(
          icon,
          color: isImportant ? AppColors.warning : AppColors.primary,
          size: 20,
        ),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w500,
          color: colorScheme.onSurface,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          fontSize: 12,
          color: colorScheme.onSurface.withValues(alpha: 0.7),
        ),
      ),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeTrackColor: AppColors.primary.withValues(alpha: 0.5),
        thumbColor: WidgetStateProperty.resolveWith(
          (states) =>
              states.contains(WidgetState.selected) ? AppColors.primary : null,
        ),
      ),
    );
  }

  Widget _buildTimeTile({
    required IconData icon,
    required String title,
    required TimeOfDay time,
    required VoidCallback onTap,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Icon(icon, color: AppColors.primary, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w500,
          color: colorScheme.onSurface,
        ),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            time.format(context),
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurface.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(width: 4),
          Icon(
            Icons.chevron_right,
            color: colorScheme.onSurface.withValues(alpha: 0.5),
          ),
        ],
      ),
    );
  }

  Future<void> _selectTime(BuildContext context, bool isStart) async {
    final initialTime = isStart ? _quietStart : _quietEnd;

    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );

    if (picked != null) {
      setState(() {
        if (isStart) {
          _quietStart = picked;
        } else {
          _quietEnd = picked;
        }
      });
    }
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();

    // Save all settings
    await prefs.setBool(_keyPushEnabled, _pushEnabled);
    await prefs.setBool(_keySmsEnabled, _smsEnabled);
    await prefs.setBool(_keyEmailEnabled, _emailEnabled);
    await prefs.setBool(_keyBookingUpdates, _bookingUpdates);
    await prefs.setBool(_keyWorkerArrival, _workerArrival);
    await prefs.setBool(_keyPaymentAlerts, _paymentAlerts);
    await prefs.setBool(_keyPromotions, _promotions);
    await prefs.setBool(_keySosAlerts, _sosAlerts);
    await prefs.setBool(_keyChatMessages, _chatMessages);
    await prefs.setBool(_keyQuietHoursEnabled, _quietHoursEnabled);
    await prefs.setInt(_keyQuietStartHour, _quietStart.hour);
    await prefs.setInt(_keyQuietStartMinute, _quietStart.minute);
    await prefs.setInt(_keyQuietEndHour, _quietEnd.hour);
    await prefs.setInt(_keyQuietEndMinute, _quietEnd.minute);

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Notification settings saved'),
        backgroundColor: AppColors.success,
        duration: Duration(seconds: 1),
      ),
    );
    Navigator.pop(context);
  }
}
