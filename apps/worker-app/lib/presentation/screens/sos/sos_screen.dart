import 'dart:io';
import 'package:appwrite/appwrite.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/appwrite/appwrite_client.dart';
import '../../../core/appwrite/appwrite_config.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';

class SOSScreen extends StatefulWidget {
  final String? bookingId;
  final String? customerName;

  const SOSScreen({super.key, this.bookingId, this.customerName});

  @override
  State<SOSScreen> createState() => _SOSScreenState();
}

class _SOSScreenState extends State<SOSScreen> {
  bool _isSending = false;
  bool _sosSent = false;
  String? _sosId;
  final TextEditingController _descriptionController = TextEditingController();
  String _selectedReason = 'I feel unsafe';

  // Evidence images
  final ImagePicker _imagePicker = ImagePicker();
  final List<XFile> _evidenceImages = [];

  final List<String> _reasons = [
    'I feel unsafe',
    'Customer is aggressive',
    'Harassment',
    'Theft or robbery',
    'Customer not who they claim to be',
    'Dispute over payment',
    'Property damage',
    'Other emergency',
  ];

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _sendSOS() async {
    if (_isSending) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.warning, color: AppColors.error),
            SizedBox(width: 8),
            Text('Confirm SOS'),
          ],
        ),
        content: const Text(
          'This will send an emergency alert to the admin team. '
          'False alerts may result in account penalties.\n\n'
          'Are you sure you want to proceed?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Send SOS'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isSending = true);

    try {
      final tablesDB = AppwriteClient.tablesDB;
      final user = await AppwriteClient.account.get();

      // Get location (best-effort)
      double? lat;
      double? lng;
      try {
        final permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          await Geolocator.requestPermission();
        }
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        lat = position.latitude;
        lng = position.longitude;
      } catch (_) {
        // Location unavailable — proceed without it
      }

      // Create SOS record
      final sosData = <String, dynamic>{
        'reason': _selectedReason,
        'description': _descriptionController.text.trim(),
        'status': 'ACTIVE',
        'priority': 'HIGH',
        'initiatedByType': 'WORKER',
        'initiatedByUserId': user.$id,
      };

      if (lat != null && lng != null) {
        sosData['latitude'] = lat;
        sosData['longitude'] = lng;
      }

      if (widget.bookingId != null) {
        sosData['bookingId'] = widget.bookingId;
      }

      // Upload evidence images (best-effort, stored in SOS evidence bucket)
      final evidenceUrls = await _uploadEvidence();
      if (evidenceUrls.isNotEmpty) {
        sosData['evidenceImages'] = evidenceUrls.join(',');
      }

      final result = await tablesDB.createRow(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.sosCollection,
        rowId: ID.unique(),
        data: sosData,
      );

      _sosId = result.$id;

      // Try to call sos_analyzer function
      try {
        await AppwriteClient.functions.createExecution(
          functionId: AppwriteConfig.sosAnalyzerFunction,
          body:
              '{"sosId": "$_sosId", "reason": "$_selectedReason", "description": "${_descriptionController.text.trim()}"}',
        );
      } catch (_) {
        // Function may not be deployed yet - SOS record is still created
      }

      if (mounted) {
        setState(() {
          _sosSent = true;
          _isSending = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSending = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to send SOS: ${e.toString().replaceAll("Exception: ", "")}',
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _pickEvidence() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take Photo'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    try {
      final picked = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 80,
      );
      if (picked != null && _evidenceImages.length < 3) {
        setState(() => _evidenceImages.add(picked));
      }
    } catch (_) {
      // Image picker cancelled or errored
    }
  }

  void _removeEvidence(int index) {
    setState(() => _evidenceImages.removeAt(index));
  }

  Future<List<String>> _uploadEvidence() async {
    final urls = <String>[];
    final storage = AppwriteClient.storage;
    for (final image in _evidenceImages) {
      try {
        final ext = image.path.split('.').last.toLowerCase();
        final fileId = ID.unique();
        final file = await storage.createFile(
          bucketId: AppwriteConfig.sosEvidenceBucket,
          fileId: fileId,
          file: InputFile.fromPath(
            path: image.path,
            filename: 'sos_evidence_$fileId.$ext',
          ),
        );
        urls.add(
          '${AppwriteConfig.endpoint}/storage/buckets/${AppwriteConfig.sosEvidenceBucket}/files/${file.$id}/view?project=${AppwriteConfig.projectId}',
        );
      } catch (_) {
        // Upload failure should not block SOS
      }
    }
    return urls;
  }

  @override
  Widget build(BuildContext context) {
    if (_sosSent) return _buildSuccessView();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Emergency SOS'),
        backgroundColor: AppColors.error,
        foregroundColor: AppColors.textOnPrimary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Emergency banner
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                border: Border.all(
                  color: AppColors.error.withValues(alpha: 0.3),
                ),
              ),
              child: Column(
                children: [
                  const Icon(Icons.emergency, size: 48, color: AppColors.error),
                  const SizedBox(height: AppSpacing.sm),
                  const Text(
                    'Emergency Help',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.error,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Send an SOS alert to the admin team.\nThey will respond as quickly as possible.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Reason selection
            const Text(
              'What is happening?',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.sm),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: _reasons
                  .map(
                    (reason) => RadioListTile<String>(
                      title: Text(reason, style: const TextStyle(fontSize: 14)),
                      value: reason,
                      groupValue: _selectedReason,
                      onChanged: (String? value) {
                        if (value != null) {
                          setState(() => _selectedReason = value);
                        }
                      },
                      activeColor: AppColors.error,
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                    ),
                  )
                  .toList(),
            ),

            const SizedBox(height: AppSpacing.md),

            // Description
            const Text(
              'Additional details (optional)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Describe the situation...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusSM),
                ),
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Evidence upload section
            const Text(
              'Attach evidence (optional)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.sm),
            if (_evidenceImages.isNotEmpty) ...[
              SizedBox(
                height: 80,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _evidenceImages.length,
                  separatorBuilder: (_, i) =>
                      const SizedBox(width: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    return Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.file(
                            File(_evidenceImages[index].path),
                            width: 80,
                            height: 80,
                            fit: BoxFit.cover,
                            errorBuilder: (ctx, err, st) => Container(
                              width: 80,
                              height: 80,
                              color: Theme.of(
                                context,
                              ).colorScheme.surfaceContainerHighest,
                              child: Icon(
                                Icons.image,
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurface.withValues(alpha: 0.7),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 2,
                          right: 2,
                          child: GestureDetector(
                            onTap: () => _removeEvidence(index),
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: const BoxDecoration(
                                color: AppColors.error,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.close,
                                size: 14,
                                color: AppColors.textOnPrimary,
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
            ],
            if (_evidenceImages.length < 3)
              OutlinedButton.icon(
                onPressed: _pickEvidence,
                icon: const Icon(Icons.camera_alt, size: 18),
                label: Text(
                  _evidenceImages.isEmpty
                      ? 'Add photo evidence'
                      : 'Add more (${_evidenceImages.length}/3)',
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),

            const SizedBox(height: AppSpacing.lg),

            // Send SOS button
            SizedBox(
              height: 56,
              child: ElevatedButton.icon(
                onPressed: _isSending ? null : _sendSOS,
                icon: _isSending
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.textOnPrimary,
                        ),
                      )
                    : const Icon(Icons.sos, size: 24),
                label: Text(
                  _isSending ? 'Sending SOS...' : 'SEND SOS ALERT',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.error,
                  foregroundColor: AppColors.textOnPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
                  ),
                ),
              ),
            ),

            const SizedBox(height: AppSpacing.md),

            // Emergency contacts info
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Emergency Contacts',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    _buildEmergencyContact('Police', '15'),
                    _buildEmergencyContact('Ambulance', '1122'),
                    _buildEmergencyContact('Fire', '16'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessView() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SOS Sent'),
        backgroundColor: AppColors.error,
        foregroundColor: AppColors.textOnPrimary,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle,
                  size: 48,
                  color: AppColors.success,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              const Text(
                'SOS Alert Sent Successfully',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Alert ID: ${_sosId ?? "N/A"}',
                style: TextStyle(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Our admin team has been notified and will\nrespond as quickly as possible.\n\nStay safe and stay where you are if possible.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Back to App'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmergencyContact(String name, String number) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(
            Icons.phone,
            size: 16,
            color: Theme.of(
              context,
            ).colorScheme.onSurface.withValues(alpha: 0.7),
          ),
          const SizedBox(width: AppSpacing.sm),
          Text(name, style: const TextStyle(fontSize: 14)),
          const Spacer(),
          Text(
            number,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}
