import 'package:appwrite/appwrite.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../data/datasources/appwrite/appwrite_booking_datasource.dart';
import '../../../data/models/booking_model.dart';
import '../../blocs/booking/booking_bloc.dart';
import '../../blocs/booking/booking_event.dart';
import '../../blocs/booking/booking_state.dart';

/// Booking tracking screen with real-time status updates
class BookingTrackingScreen extends StatefulWidget {
  const BookingTrackingScreen({super.key});

  @override
  State<BookingTrackingScreen> createState() => _BookingTrackingScreenState();
}

class _BookingTrackingScreenState extends State<BookingTrackingScreen> {
  String _bookingId = '';
  BookingModel? _booking;
  final _cancelReasonController = TextEditingController();

  // Realtime subscriptions (replace polling)
  final AppwriteBookingDataSource _datasource = AppwriteBookingDataSource();
  RealtimeSubscription? _bookingSub;
  RealtimeSubscription? _locationSub;
  double? _workerLat;
  double? _workerLng;
  GoogleMapController? _mapController;

  static const List<_TrackingStatus> _statusFlow = [
    _TrackingStatus.pending,
    _TrackingStatus.accepted,
    _TrackingStatus.inProgress,
    _TrackingStatus.completed,
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    String? id;
    if (args is Map<String, dynamic>) {
      id = args['bookingId'] as String?;
    } else if (args is String) {
      id = args;
    }
    if (id != null && id.isNotEmpty && id != _bookingId) {
      _bookingId = id;
      _fetchBookingDetails();
      _subscribeToRealtime();
    }
  }

  @override
  void dispose() {
    _mapController?.dispose();
    _bookingSub?.close();
    _locationSub?.close();
    _cancelReasonController.dispose();
    super.dispose();
  }

  void _fetchBookingDetails() {
    if (_bookingId.isNotEmpty) {
      context.read<BookingBloc>().add(
        LoadBookingDetailsRequested(bookingId: _bookingId),
      );
    }
  }

  /// Subscribe to Appwrite Realtime for booking status changes and worker location
  void _subscribeToRealtime() {
    // Subscribe to booking document changes (status updates, worker assignment, etc.)
    _bookingSub?.close();
    _bookingSub = _datasource.subscribeToBooking(_bookingId, (data) {
      if (mounted) {
        // Re-fetch the full booking details when any change occurs
        _fetchBookingDetails();
      }
    });

    // Subscribe to worker location updates for this booking
    _locationSub?.close();
    _locationSub = _datasource.subscribeToWorkerLocation(_bookingId, (
      lat,
      lng,
    ) {
      if (mounted) {
        setState(() {
          _workerLat = lat;
          _workerLng = lng;
        });
      }
    });
  }

  _TrackingStatus _mapStatus(BookingStatus? status) {
    switch (status) {
      case BookingStatus.pending:
        return _TrackingStatus.pending;
      case BookingStatus.accepted:
        return _TrackingStatus.accepted;
      case BookingStatus.inProgress:
        return _TrackingStatus.inProgress;
      case BookingStatus.completed:
        return _TrackingStatus.completed;
      case BookingStatus.cancelled:
        return _TrackingStatus.cancelled;
      case BookingStatus.disputed:
        return _TrackingStatus.inProgress;
      case null:
        return _TrackingStatus.pending;
    }
  }

  void _callWorker() async {
    final phone = _booking?.worker?.phone;
    if (phone != null && phone.isNotEmpty) {
      final uri = Uri.parse('tel:$phone');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Worker phone number not available. Use in-app chat.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _chatWithWorker() {
    Navigator.pushNamed(
      context,
      AppRoutes.chat,
      arguments: {
        'bookingId': _bookingId,
        'workerName': _booking?.worker?.fullName ?? 'Worker',
        'workerPhone': _booking?.worker?.phone ?? '',
      },
    );
  }

  void _triggerSOS() {
    Navigator.pushNamed(
      context,
      AppRoutes.sos,
      arguments: {
        'bookingId': _bookingId,
        'workerName': _booking?.worker?.fullName ?? 'Worker',
      },
    );
  }

  void _cancelBooking() {
    _cancelReasonController.clear();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Cancel Booking?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Are you sure you want to cancel this booking? '
              'Cancellation fees may apply.',
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _cancelReasonController,
              decoration: const InputDecoration(
                labelText: 'Reason for cancellation',
                hintText: 'Please provide a reason (optional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Keep Booking'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              _confirmCancellation();
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }

  void _confirmCancellation() {
    final reason = _cancelReasonController.text.isNotEmpty
        ? _cancelReasonController.text
        : 'No reason provided';

    context.read<BookingBloc>().add(
      CancelBookingRequested(bookingId: _bookingId, reason: reason),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<BookingBloc, BookingState>(
      listener: (context, state) {
        if (state is BookingDetailsLoaded) {
          setState(() {
            _booking = state.booking;
          });
        } else if (state is BookingCancelled) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.success,
            ),
          );
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (context.mounted) {
              Navigator.of(context).popUntil(
                (route) =>
                    route.settings.name == AppRoutes.main || route.isFirst,
              );
            }
          });
        } else if (state is BookingError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      builder: (context, state) {
        final currentStatus = _mapStatus(_booking?.status);

        if (_booking == null && state is BookingLoading) {
          return Scaffold(
            appBar: AppBar(title: const Text('Track Booking')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: const Text('Track Booking'),
            actions: [
              if (currentStatus == _TrackingStatus.pending ||
                  currentStatus == _TrackingStatus.accepted)
                TextButton(
                  onPressed: _cancelBooking,
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: AppColors.error),
                  ),
                ),
            ],
          ),
          body: Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  children: [
                    _buildBookingInfoCard(currentStatus),
                    const SizedBox(height: AppSpacing.lg),
                    // Show a banner when PENDING with no worker (worker rejected or timed out)
                    if (currentStatus == _TrackingStatus.pending &&
                        _booking != null &&
                        _booking!.workerId == null &&
                        _booking!.worker == null)
                      _buildWorkerDeclinedBanner(),
                    _buildStatusTimeline(currentStatus),
                    const SizedBox(height: AppSpacing.lg),
                    if (currentStatus == _TrackingStatus.accepted ||
                        currentStatus == _TrackingStatus.inProgress)
                      _buildMapCard(),
                    const SizedBox(height: AppSpacing.lg),
                    if (currentStatus.index >= _TrackingStatus.accepted.index)
                      _buildWorkerCard(),
                    if (currentStatus == _TrackingStatus.completed) ...[
                      const SizedBox(height: AppSpacing.lg),
                      _buildCompletedActions(),
                    ],
                    const SizedBox(height: 100),
                  ],
                ),
              ),
              if (currentStatus.index >= _TrackingStatus.accepted.index &&
                  currentStatus.index < _TrackingStatus.completed.index)
                Positioned(
                  bottom: AppSpacing.lg,
                  right: AppSpacing.md,
                  child: FloatingActionButton.extended(
                    onPressed: _triggerSOS,
                    backgroundColor: AppColors.error,
                    icon: const Icon(Icons.sos),
                    label: const Text('SOS'),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBookingInfoCard(_TrackingStatus currentStatus) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final bookingNumber = _booking?.bookingNumber ?? _bookingId;
    final service = _booking?.serviceCategory ?? 'Service';
    final address = _booking?.address.full ?? '';

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withValues(alpha: 0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Booking #$bookingNumber',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              _buildStatusBadge(currentStatus),
            ],
          ),
          const Divider(height: AppSpacing.lg),
          Row(
            children: [
              const Icon(Icons.build, size: 20, color: AppColors.primary),
              const SizedBox(width: AppSpacing.sm),
              Text(service, style: TextStyle(color: colorScheme.onSurface)),
            ],
          ),
          if (address.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Icon(
                  Icons.location_on,
                  size: 20,
                  color: colorScheme.onSurface.withValues(alpha: 0.7),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    address,
                    style: TextStyle(
                      color: colorScheme.onSurface.withValues(alpha: 0.7),
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ],
          // Pricing info
          if (_booking?.pricing != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Icon(
                  Icons.payments_outlined,
                  size: 20,
                  color: colorScheme.onSurface.withValues(alpha: 0.7),
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  _booking!.pricing.finalPrice != null &&
                          _booking!.pricing.finalPrice! > 0
                      ? 'Rs. ${_booking!.pricing.finalPrice!.toStringAsFixed(0)}'
                      : _booking!.pricing.estimatedPrice != null &&
                            _booking!.pricing.estimatedPrice! > 0
                      ? 'Est. Rs. ${_booking!.pricing.estimatedPrice!.toStringAsFixed(0)}'
                      : 'Price TBD',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildWorkerDeclinedBanner() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: AppColors.warning, size: 28),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Worker Unavailable',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.warning,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'The assigned worker is no longer available. '
                  'You can cancel and rebook, or wait for a new worker to be assigned.',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(_TrackingStatus status) {
    Color color;
    String text;

    switch (status) {
      case _TrackingStatus.pending:
        color = AppColors.warning;
        text = 'Pending';
        break;
      case _TrackingStatus.accepted:
        color = AppColors.primary;
        text = 'Accepted';
        break;
      case _TrackingStatus.inProgress:
        color = AppColors.secondary;
        text = 'In Progress';
        break;
      case _TrackingStatus.completed:
        color = AppColors.success;
        text = 'Completed';
        break;
      case _TrackingStatus.cancelled:
        color = AppColors.error;
        text = 'Cancelled';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppSpacing.radiusXs),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildStatusTimeline(_TrackingStatus currentStatus) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withValues(alpha: 0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Status Timeline',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          ..._buildTimelineItems(currentStatus),
        ],
      ),
    );
  }

  List<Widget> _buildTimelineItems(_TrackingStatus currentStatus) {
    final colorScheme = Theme.of(context).colorScheme;
    final items = <Widget>[];
    final displayStatuses = _statusFlow.toList();

    for (var i = 0; i < displayStatuses.length; i++) {
      final status = displayStatuses[i];
      final isCompleted = status.index <= currentStatus.index;
      final isCurrent = status == currentStatus;
      final isLast = i == displayStatuses.length - 1;

      items.add(
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: isCompleted ? AppColors.primary : AppColors.border,
                    shape: BoxShape.circle,
                  ),
                  child: isCompleted
                      ? const Icon(
                          Icons.check,
                          size: 14,
                          color: AppColors.textOnPrimary,
                        )
                      : null,
                ),
                if (!isLast)
                  Container(
                    width: 2,
                    height: 40,
                    color: isCompleted ? AppColors.primary : AppColors.border,
                  ),
              ],
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getStatusTitle(status),
                      style: TextStyle(
                        fontWeight: isCurrent
                            ? FontWeight.w600
                            : FontWeight.normal,
                        color: isCompleted
                            ? colorScheme.onSurface
                            : colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
                    ),
                    if (isCompleted)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          _getStatusTime(status),
                          style: TextStyle(
                            fontSize: 12,
                            color: colorScheme.onSurface.withValues(alpha: 0.7),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    return items;
  }

  String _getStatusTitle(_TrackingStatus status) {
    switch (status) {
      case _TrackingStatus.pending:
        return 'Booking Placed';
      case _TrackingStatus.accepted:
        return 'Worker Accepted';
      case _TrackingStatus.inProgress:
        return 'Job In Progress';
      case _TrackingStatus.completed:
        return 'Completed';
      case _TrackingStatus.cancelled:
        return 'Cancelled';
    }
  }

  String _getStatusTime(_TrackingStatus status) {
    // Try to get real timestamps from booking timeline
    if (_booking != null && _booking!.timeline.isNotEmpty) {
      final matchingKey = _trackingStatusToBookingKey(status);
      for (final entry in _booking!.timeline) {
        if (entry.status.toUpperCase() == matchingKey) {
          final t = entry.timestamp;
          return '${t.hour}:${t.minute.toString().padLeft(2, '0')}';
        }
      }
    }
    return '--:--';
  }

  String _trackingStatusToBookingKey(_TrackingStatus status) {
    switch (status) {
      case _TrackingStatus.pending:
        return 'PENDING';
      case _TrackingStatus.accepted:
        return 'ACCEPTED';
      case _TrackingStatus.inProgress:
        return 'IN_PROGRESS';
      case _TrackingStatus.completed:
        return 'COMPLETED';
      case _TrackingStatus.cancelled:
        return 'CANCELLED';
    }
  }

  Widget _buildMapCard() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final hasWorkerLocation = _workerLat != null && _workerLng != null;
    final bookingCoords = _booking?.address.coordinates;

    // Default center: worker location > booking address > Lahore
    final centerLat = _workerLat ?? bookingCoords?.lat ?? 31.5204;
    final centerLng = _workerLng ?? bookingCoords?.lng ?? 74.3587;

    // Build markers
    final markers = <Marker>{};
    if (hasWorkerLocation) {
      markers.add(
        Marker(
          markerId: const MarkerId('worker'),
          position: LatLng(_workerLat!, _workerLng!),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueAzure,
          ),
          infoWindow: InfoWindow(
            title: _booking?.worker?.firstName ?? 'Worker',
            snippet: 'Worker location',
          ),
        ),
      );
    }
    if (bookingCoords != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('destination'),
          position: LatLng(bookingCoords.lat, bookingCoords.lng),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
          infoWindow: const InfoWindow(title: 'Service Location'),
        ),
      );
    }

    // Animate camera to worker location when available
    if (hasWorkerLocation && _mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newLatLng(LatLng(_workerLat!, _workerLng!)),
      );
    }

    return Container(
      height: 250,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withValues(alpha: 0.1),
            blurRadius: 10,
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: LatLng(centerLat, centerLng),
              zoom: 14,
            ),
            markers: markers,
            myLocationEnabled: false,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            onMapCreated: (controller) {
              _mapController = controller;
              // If both markers exist, fit bounds to show both
              if (hasWorkerLocation && bookingCoords != null) {
                _fitBounds(controller);
              }
            },
          ),
          // ETA overlay
          Positioned(
            top: AppSpacing.md,
            left: AppSpacing.md,
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
              decoration: BoxDecoration(
                color: colorScheme.surface,
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 5)],
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.access_time,
                    size: 16,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'ETA: ${_booking?.estimatedDuration ?? '--'} min',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Realtime indicator
          if (hasWorkerLocation)
            Positioned(
              top: AppSpacing.md,
              right: AppSpacing.md,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.success,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusXs),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.circle, size: 8, color: AppColors.textOnPrimary),
                    SizedBox(width: 4),
                    Text(
                      'LIVE',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textOnPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          // Re-center button
          if (hasWorkerLocation)
            Positioned(
              bottom: AppSpacing.md,
              right: AppSpacing.md,
              child: FloatingActionButton.small(
                heroTag: 'recenter',
                onPressed: () {
                  if (bookingCoords != null) {
                    _fitBounds(_mapController!);
                  } else {
                    _mapController?.animateCamera(
                      CameraUpdate.newLatLng(LatLng(_workerLat!, _workerLng!)),
                    );
                  }
                },
                backgroundColor: colorScheme.surface,
                child: Icon(
                  Icons.center_focus_strong,
                  color: colorScheme.onSurface,
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// Fit the map to show both worker and destination markers
  void _fitBounds(GoogleMapController controller) {
    final workerLat = _workerLat;
    final workerLng = _workerLng;
    final bookingCoords = _booking?.address.coordinates;
    if (workerLat == null || workerLng == null || bookingCoords == null) return;

    final bounds = LatLngBounds(
      southwest: LatLng(
        workerLat < bookingCoords.lat ? workerLat : bookingCoords.lat,
        workerLng < bookingCoords.lng ? workerLng : bookingCoords.lng,
      ),
      northeast: LatLng(
        workerLat > bookingCoords.lat ? workerLat : bookingCoords.lat,
        workerLng > bookingCoords.lng ? workerLng : bookingCoords.lng,
      ),
    );
    controller.animateCamera(CameraUpdate.newLatLngBounds(bounds, 60));
  }

  Widget _buildWorkerCard() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final worker = _booking?.worker;
    final workerName = worker?.fullName ?? 'Assigned Worker';
    final initials = workerName
        .split(' ')
        .map((e) => e.isNotEmpty ? e[0] : '')
        .take(2)
        .join()
        .toUpperCase();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withValues(alpha: 0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your Worker',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Stack(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    child: Text(
                      initials,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: colorScheme.surface,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.verified,
                        color: AppColors.secondary,
                        size: 16,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      workerName,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    if (worker != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.star,
                            color: AppColors.ratingStar,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            worker.rating.toStringAsFixed(1),
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              IconButton(
                onPressed: _callWorker,
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.secondary.withValues(alpha: 0.1),
                ),
                icon: const Icon(Icons.phone, color: AppColors.secondary),
              ),
              const SizedBox(width: AppSpacing.sm),
              IconButton(
                onPressed: _chatWithWorker,
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                ),
                icon: const Icon(
                  Icons.chat_bubble_outline,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCompletedActions() {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.check_circle, color: AppColors.success, size: 48),
          const SizedBox(height: AppSpacing.md),
          const Text(
            'Job Completed!',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.success,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Please rate your experience',
            style: TextStyle(
              color: colorScheme.onSurface.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pushNamed(
                AppRoutes.rating,
                arguments: {
                  'bookingId': _bookingId,
                  'workerName': _booking?.worker?.fullName ?? 'Worker',
                  'serviceType': _booking?.serviceCategory ?? '',
                  'bookingNumber': _booking?.bookingNumber ?? '',
                  'booking': _booking,
                },
              );
            },
            child: const Text('Rate & Review'),
          ),
        ],
      ),
    );
  }
}

enum _TrackingStatus { pending, accepted, inProgress, completed, cancelled }
