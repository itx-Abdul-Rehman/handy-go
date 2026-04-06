import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';

/// Payment Methods screen for managing payment options
class PaymentMethodsScreen extends StatefulWidget {
  const PaymentMethodsScreen({super.key});

  @override
  State<PaymentMethodsScreen> createState() => _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends State<PaymentMethodsScreen> {
  static const _prefKey = 'default_payment_method';
  final List<PaymentMethod> _savedCards = [];
  String _defaultPaymentMethod = 'cash';

  @override
  void initState() {
    super.initState();
    _loadDefaultMethod();
  }

  Future<void> _loadDefaultMethod() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_prefKey);
    if (saved != null && mounted) {
      setState(() => _defaultPaymentMethod = saved);
    }
  }

  Future<void> _setDefaultMethod(String method) async {
    setState(() => _defaultPaymentMethod = method);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, method);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Payment Methods')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Default payment method
            _buildSectionTitle('Default Payment Method'),
            _buildPaymentOptions(),

            const SizedBox(height: AppSpacing.lg),

            // Saved cards
            _buildSectionTitle('Saved Cards'),
            _buildSavedCards(),

            const SizedBox(height: AppSpacing.lg),

            // Add new card
            _buildAddCardButton(),

            const SizedBox(height: AppSpacing.lg),

            // Other payment methods
            _buildSectionTitle('Other Payment Methods'),
            _buildOtherPaymentMethods(),

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

  Widget _buildPaymentOptions() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 5),
        ],
      ),
      child: Column(
        children: [
          _buildPaymentOptionTile(
            icon: Icons.money,
            title: 'Cash on Delivery',
            subtitle: 'Pay when service is complete',
            value: 'cash',
            color: AppColors.success,
          ),
          const Divider(height: 1, indent: 56),
          _buildPaymentOptionTile(
            icon: Icons.account_balance_wallet,
            title: 'Wallet',
            subtitle: 'Pay from your HandyGo wallet',
            value: 'wallet',
            color: AppColors.primary,
          ),
          const Divider(height: 1, indent: 56),
          _buildPaymentOptionTile(
            icon: Icons.credit_card,
            title: 'Card',
            subtitle: 'Pay with credit/debit card',
            value: 'card',
            color: AppColors.info,
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentOptionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required String value,
    required Color color,
  }) {
    final colorScheme = Theme.of(context).colorScheme;

    return ListTile(
      onTap: () => _setDefaultMethod(value),
      leading: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Icon(icon, color: color, size: 20),
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
      trailing: Radio<String>(
        value: value,
        groupValue: _defaultPaymentMethod,
        activeColor: AppColors.primary,
        onChanged: (v) => _setDefaultMethod(v!),
      ),
    );
  }

  Widget _buildSavedCards() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (_savedCards.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
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
          children: [
            Icon(
              Icons.credit_card_off,
              size: 48,
              color: colorScheme.onSurface.withValues(alpha: 0.5),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'No saved cards',
              style: TextStyle(
                fontSize: 14,
                color: colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Add a card for faster payments',
              style: TextStyle(
                fontSize: 12,
                color: colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
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
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _savedCards.length,
        separatorBuilder: (_, _) => const Divider(height: 1, indent: 56),
        itemBuilder: (context, index) {
          final card = _savedCards[index];
          return _buildCardTile(card);
        },
      ),
    );
  }

  Widget _buildCardTile(PaymentMethod card) {
    final colorScheme = Theme.of(context).colorScheme;

    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Icon(
          _getCardIcon(card.cardType),
          color: AppColors.primary,
          size: 20,
        ),
      ),
      title: Text(
        '**** **** **** ${card.lastFourDigits}',
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w500,
          color: colorScheme.onSurface,
          fontFamily: 'monospace',
        ),
      ),
      subtitle: Text(
        'Expires ${card.expiryDate}',
        style: TextStyle(
          fontSize: 12,
          color: colorScheme.onSurface.withValues(alpha: 0.7),
        ),
      ),
      trailing: PopupMenuButton<String>(
        icon: Icon(
          Icons.more_vert,
          color: colorScheme.onSurface.withValues(alpha: 0.7),
        ),
        onSelected: (value) {
          if (value == 'delete') {
            _deleteCard(card);
          }
        },
        itemBuilder: (context) => [
          const PopupMenuItem(
            value: 'delete',
            child: Row(
              children: [
                Icon(Icons.delete_outline, color: AppColors.error),
                SizedBox(width: 8),
                Text('Delete', style: TextStyle(color: AppColors.error)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _getCardIcon(String cardType) {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return Icons.credit_card;
      case 'mastercard':
        return Icons.credit_card;
      default:
        return Icons.credit_card;
    }
  }

  Widget _buildAddCardButton() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return GestureDetector(
      onTap: () => _showAddCardDialog(),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: AppColors.primary,
            style: BorderStyle.solid,
          ),
          boxShadow: [
            BoxShadow(
              color: theme.shadowColor.withValues(alpha: 0.1),
              blurRadius: 5,
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_circle_outline, color: AppColors.primary),
            const SizedBox(width: AppSpacing.sm),
            Text(
              'Add New Card',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOtherPaymentMethods() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
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
        children: [
          _buildOtherMethodTile(
            icon: Icons.account_balance,
            title: 'JazzCash',
            subtitle: 'Connect your JazzCash account',
            onTap: () => _connectMobileWallet('JazzCash'),
          ),
          const Divider(height: 1, indent: 56),
          _buildOtherMethodTile(
            icon: Icons.account_balance,
            title: 'Easypaisa',
            subtitle: 'Connect your Easypaisa account',
            onTap: () => _connectMobileWallet('Easypaisa'),
          ),
        ],
      ),
    );
  }

  Widget _buildOtherMethodTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    final colorScheme = Theme.of(context).colorScheme;

    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Icon(icon, color: AppColors.success, size: 20),
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
      trailing: Icon(
        Icons.chevron_right,
        color: colorScheme.onSurface.withValues(alpha: 0.5),
      ),
    );
  }

  void _showAddCardDialog() {
    // TODO: Integrate card tokenisation SDK (Stripe, HBL PayFast, etc.)
    // 1. Show card input form (card number, expiry, CVV)
    // 2. Tokenise via gateway SDK — never store raw card data
    // 3. Save token + last4 + brand to user's saved cards collection
    // 4. Example (Stripe):
    //    final paymentMethod = await Stripe.instance.createPaymentMethod(
    //      PaymentMethodParams.card(paymentMethodData: ...));
    //    Save paymentMethod.id to Appwrite
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Card'),
        content: const Text(
          'Card tokenisation requires a payment gateway SDK.\n\n'
          'Configure Stripe or HBL PayFast credentials, then '
          'this dialog will collect and tokenise card details securely.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _deleteCard(PaymentMethod card) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Card'),
        content: Text(
          'Are you sure you want to remove the card ending in ${card.lastFourDigits}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _savedCards.remove(card);
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Card removed'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _connectMobileWallet(String provider) {
    // TODO: Integrate JazzCash / Easypaisa SDKs
    // 1. Open provider's linking flow (redirect or in-app webview)
    // 2. On success, store linked account token in Appwrite
    // 3. Allow selecting linked account as payment method at booking time
    // Example (JazzCash):
    //   final result = await JazzCashSdk.linkAccount(phone: userPhone);
    //   if (result.success) saveLinkedAccount(provider, result.token);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '$provider linking requires gateway SDK configuration. '
          'See TODO in payment_methods_screen.dart.',
        ),
      ),
    );
  }
}

class PaymentMethod {
  final String id;
  final String cardType;
  final String lastFourDigits;
  final String expiryDate;

  PaymentMethod({
    required this.id,
    required this.cardType,
    required this.lastFourDigits,
    required this.expiryDate,
  });
}
