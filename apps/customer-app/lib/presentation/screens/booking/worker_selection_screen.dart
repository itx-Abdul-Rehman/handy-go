import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../data/models/booking_model.dart';
import '../../../data/models/user_model.dart';
import '../../../data/models/worker_model.dart';
import '../../blocs/booking/booking_bloc.dart';
import '../../blocs/booking/booking_event.dart';
import '../../blocs/booking/booking_state.dart';

/// Worker selection screen for booking
class WorkerSelectionScreen extends StatefulWidget {
  const WorkerSelectionScreen({super.key});

  @override
  State<WorkerSelectionScreen> createState() => _WorkerSelectionScreenState();
}

class _WorkerSelectionScreenState extends State<WorkerSelectionScreen> {
  int? _selectedWorkerIndex;
  bool _letUsChoose = false;
  Map<String, dynamic> _bookingContext = {};
  bool _hasDispatched = false;
  bool _isCreatingBooking = false;

  // Cache workers so we don't lose them when BLoC emits BookingLoading/BookingCreated
  List<MatchedWorkerModel>? _cachedWorkers;
  PriceEstimate? _cachedPriceEstimate;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null && !_hasDispatched) {
      _bookingContext = Map<String, dynamic>.from(args);
      _hasDispatched = true;
      _dispatchFindWorkers();
    }
  }

  void _dispatchFindWorkers() {
    final category = _bookingContext['category'] as String? ?? '';
    final lat = (_bookingContext['latitude'] as num?)?.toDouble() ?? 0.0;
    final lng = (_bookingContext['longitude'] as num?)?.toDouble() ?? 0.0;
    final scheduledDateTimeStr =
        _bookingContext['scheduledDateTime'] as String?;
    final isUrgent = _bookingContext['isUrgent'] as bool? ?? false;

    DateTime scheduledDateTime;
    if (scheduledDateTimeStr != null) {
      scheduledDateTime = DateTime.parse(scheduledDateTimeStr);
    } else {
      scheduledDateTime = DateTime.now().add(const Duration(hours: 1));
    }

    context.read<BookingBloc>().add(
      FindWorkersRequested(
        serviceCategory: category,
        lat: lat,
        lng: lng,
        scheduledDateTime: scheduledDateTime,
        isUrgent: isUrgent,
      ),
    );
  }

  Future<String> _getDefaultPaymentMethod() async {
    final prefs = await SharedPreferences.getInstance();
    final method = prefs.getString('default_payment_method') ?? 'cash';
    return method.toUpperCase(); // Appwrite enum: CASH, WALLET, CARD
  }

  void _confirmBooking(List<MatchedWorkerModel> workers) async {
    if (!_letUsChoose && _selectedWorkerIndex == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a worker or let us choose'),
        ),
      );
      return;
    }

    // Build the BookingCreateRequest from accumulated context
    final category = _bookingContext['category'] as String? ?? '';
    final problemDescription =
        _bookingContext['problemDescription'] as String? ?? '';
    final address = _bookingContext['address'] as String? ?? '';
    final city = _bookingContext['city'] as String? ?? '';
    final lat = (_bookingContext['latitude'] as num?)?.toDouble();
    final lng = (_bookingContext['longitude'] as num?)?.toDouble();
    final scheduledDateTimeStr =
        _bookingContext['scheduledDateTime'] as String?;
    final isUrgent = _bookingContext['isUrgent'] as bool? ?? false;
    final images = (_bookingContext['images'] as List?)
        ?.map((e) => e.toString())
        .toList();

    DateTime scheduledDateTime;
    if (scheduledDateTimeStr != null) {
      scheduledDateTime = DateTime.parse(scheduledDateTimeStr);
    } else {
      scheduledDateTime = DateTime.now().add(const Duration(hours: 1));
    }

    CoordinatesModel? coordinates;
    if (lat != null && lng != null) {
      coordinates = CoordinatesModel(lat: lat, lng: lng);
    }

    final request = BookingCreateRequest(
      serviceCategory: category,
      problemDescription: problemDescription,
      address: BookingAddress(
        full: address,
        city: city,
        coordinates: coordinates,
      ),
      scheduledDateTime: scheduledDateTime,
      isUrgent: isUrgent,
      images: images != null && images.isNotEmpty ? images : null,
      paymentMethod: await _getDefaultPaymentMethod(),
    );

    // Store the selected worker for after booking is created
    final selectedWorker = _letUsChoose
        ? (workers.isNotEmpty ? workers.first : null)
        : (_selectedWorkerIndex != null
              ? workers[_selectedWorkerIndex!]
              : null);

    if (selectedWorker != null) {
      _bookingContext['_selectedWorkerId'] = selectedWorker.workerId;
    }

    if (!mounted) return;
    setState(() {
      _isCreatingBooking = true;
    });
    context.read<BookingBloc>().add(CreateBookingRequested(request: request));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Select Worker')),
      body: BlocConsumer<BookingBloc, BookingState>(
        listener: (context, state) {
          if (state is BookingCreated) {
            setState(() {
              _isCreatingBooking = false;
            });
            final selectedWorkerId =
                _bookingContext['_selectedWorkerId'] as String?;
            if (selectedWorkerId != null) {
              context.read<BookingBloc>().add(
                SelectWorkerRequested(
                  bookingId: state.booking.id,
                  workerId: selectedWorkerId,
                ),
              );
            }
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (context.mounted) {
                Navigator.of(context).pushNamed(
                  AppRoutes.bookingConfirmation,
                  arguments: {
                    'bookingId': state.booking.id,
                    'bookingNumber': state.booking.bookingNumber,
                    'serviceCategory': state.booking.serviceCategory,
                    'scheduledDateTime': state.booking.scheduledDateTime
                        .toIso8601String(),
                    'address': state.booking.address.full,
                    'workerName': _letUsChoose
                        ? 'Auto-assigning best match...'
                        : (state.matchedWorkers.isNotEmpty &&
                              _selectedWorkerIndex != null &&
                              _selectedWorkerIndex! <
                                  state.matchedWorkers.length)
                        ? state.matchedWorkers[_selectedWorkerIndex!].name
                        : 'Assigning...',
                    'estimatedPrice': _cachedPriceEstimate != null
                        ? 'Rs. ${_cachedPriceEstimate!.min.toStringAsFixed(0)} - ${_cachedPriceEstimate!.max.toStringAsFixed(0)}'
                        : (state.booking.pricing.estimatedPrice != null
                              ? 'Rs. ${state.booking.pricing.estimatedPrice!.toStringAsFixed(0)}'
                              : ''),
                  },
                );
              }
            });
          } else if (state is BookingError) {
            setState(() {
              _isCreatingBooking = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          } else if (state is WorkersFound) {
            // Cache workers so we can display them during booking creation
            _cachedWorkers = state.workers;
            _cachedPriceEstimate = state.priceEstimate;
          }
        },
        buildWhen: (previous, current) {
          // Don't rebuild when creating a booking — keep the worker list visible
          if (_isCreatingBooking) return false;
          return true;
        },
        builder: (context, state) {
          if (state is BookingLoading && !_isCreatingBooking) {
            return _buildLoadingState(state.message);
          }
          if (state is WorkersFound) {
            return _buildContentWithOverlay(state.workers, state.priceEstimate);
          }
          if (state is BookingError && !_isCreatingBooking) {
            // If we already found workers and the error is from booking creation,
            // show the worker list again so the user can retry
            if (_cachedWorkers != null && _cachedWorkers!.isNotEmpty) {
              return _buildContentWithOverlay(
                _cachedWorkers!,
                _cachedPriceEstimate,
              );
            }
            return _buildErrorState(state.message);
          }
          // If we have cached workers (e.g., during booking creation), show them
          if (_cachedWorkers != null) {
            return _buildContentWithOverlay(
              _cachedWorkers!,
              _cachedPriceEstimate,
            );
          }
          return _buildLoadingState('Finding best workers for you...');
        },
      ),
    );
  }

  Widget _buildLoadingState(String? message) {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          const SizedBox(height: AppSpacing.lg),
          Text(
            message ?? 'Finding best workers for you...',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Matching based on skills, ratings & location',
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurface.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String message) {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Unable to find workers',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            ElevatedButton.icon(
              onPressed: () {
                _hasDispatched = false;
                _dispatchFindWorkers();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContentWithOverlay(
    List<MatchedWorkerModel> workers,
    PriceEstimate? priceEstimate,
  ) {
    return Stack(
      children: [
        _buildContent(workers, priceEstimate),
        if (_isCreatingBooking)
          Container(
            color: Colors.black.withValues(alpha: 0.3),
            child: Center(
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
                child: const Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: AppColors.primary),
                    SizedBox(height: AppSpacing.md),
                    Text(
                      'Creating your booking...',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildContent(
    List<MatchedWorkerModel> workers,
    PriceEstimate? priceEstimate,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (priceEstimate != null)
                  _buildEstimatedPriceCard(priceEstimate),
                const SizedBox(height: AppSpacing.lg),
                _buildLetUsChooseCard(),
                const SizedBox(height: AppSpacing.lg),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Available Workers',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    Text(
                      '${workers.length} found',
                      style: TextStyle(
                        fontSize: 14,
                        color: colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                if (workers.isEmpty)
                  _buildNoWorkersCard()
                else
                  Column(
                    children: workers.asMap().entries.map((entry) {
                      return _buildWorkerCard(entry.key, entry.value);
                    }).toList(),
                  ),
              ],
            ),
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (priceEstimate != null) _buildPriceSummary(priceEstimate),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: workers.isNotEmpty
                        ? () => _confirmBooking(workers)
                        : null,
                    child: const Text('Confirm Booking'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNoWorkersCard() {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Icon(
            Icons.person_search,
            size: 48,
            color: colorScheme.onSurface.withValues(alpha: 0.7),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'No workers available right now',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Try adjusting your schedule or check back later.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurface.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEstimatedPriceCard(PriceEstimate estimate) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.price_check, color: AppColors.textOnPrimary, size: 24),
              SizedBox(width: AppSpacing.sm),
              Text(
                'Estimated Price',
                style: TextStyle(fontSize: 14, color: AppColors.textOnPrimary),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Rs. ${estimate.min.toStringAsFixed(0)} - ${estimate.max.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textOnPrimary,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              const Text(
                '(approx)',
                style: TextStyle(fontSize: 12, color: AppColors.textOnPrimary),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const Divider(color: AppColors.textOnPrimary),
          const SizedBox(height: AppSpacing.sm),
          _buildPriceBreakdownRow(
            'Labor Cost',
            'Rs. ${estimate.laborCostMin.toStringAsFixed(0)} - ${estimate.laborCostMax.toStringAsFixed(0)}',
          ),
          _buildPriceBreakdownRow(
            'Materials (est.)',
            'Rs. ${estimate.estimatedMaterialsMin.toStringAsFixed(0)} - ${estimate.estimatedMaterialsMax.toStringAsFixed(0)}',
          ),
          _buildPriceBreakdownRow(
            'Platform Fee',
            'Rs. ${estimate.platformFee.toStringAsFixed(0)}',
          ),
        ],
      ),
    );
  }

  Widget _buildPriceBreakdownRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textOnPrimary,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppColors.textOnPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLetUsChooseCard() {
    final colorScheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: () {
        setState(() {
          _letUsChoose = !_letUsChoose;
          if (_letUsChoose) {
            _selectedWorkerIndex = null;
          }
        });
      },
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: _letUsChoose
              ? AppColors.secondary.withValues(alpha: 0.1)
              : colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: _letUsChoose ? AppColors.secondary : AppColors.border,
            width: _letUsChoose ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: _letUsChoose
                    ? AppColors.secondary.withValues(alpha: 0.2)
                    : colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.auto_awesome,
                color: _letUsChoose
                    ? AppColors.secondary
                    : colorScheme.onSurface.withValues(alpha: 0.7),
                size: 24,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Let us choose the best',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: _letUsChoose
                          ? AppColors.secondary
                          : colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'We\'ll assign the most suitable worker based on ratings, skills and availability',
                    style: TextStyle(
                      fontSize: 12,
                      color: colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
            Checkbox(
              value: _letUsChoose,
              onChanged: (value) {
                setState(() {
                  _letUsChoose = value ?? false;
                  if (_letUsChoose) {
                    _selectedWorkerIndex = null;
                  }
                });
              },
              activeColor: AppColors.secondary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWorkerCard(int index, MatchedWorkerModel worker) {
    final isSelected = _selectedWorkerIndex == index;
    final colorScheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedWorkerIndex = index;
          _letUsChoose = false;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.05)
              : colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                      backgroundImage: worker.profileImage != null
                          ? NetworkImage(worker.profileImage!)
                          : null,
                      child: worker.profileImage == null
                          ? Text(
                              worker.name
                                  .split(' ')
                                  .map((e) => e.isNotEmpty ? e[0] : '')
                                  .take(2)
                                  .join(),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            )
                          : null,
                    ),
                    if (worker.trustScore >= 60)
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
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              worker.name,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: colorScheme.onSurface,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          _buildTrustBadge(worker.trustScore),
                        ],
                      ),
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
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: colorScheme.onSurface,
                            ),
                          ),
                          Text(
                            ' (${worker.ratingCount} reviews)',
                            style: TextStyle(
                              fontSize: 12,
                              color: colorScheme.onSurface.withValues(
                                alpha: 0.7,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _buildInfoChip(
                            Icons.location_on_outlined,
                            '${worker.distance.toStringAsFixed(1)} km',
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          _buildInfoChip(
                            Icons.access_time,
                            '${worker.estimatedArrival} min',
                          ),
                        ],
                      ),
                      if (worker.skills.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 4,
                          runSpacing: 4,
                          children: worker.skills.take(3).map((skill) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(
                                  alpha: 0.08,
                                ),
                                borderRadius: BorderRadius.circular(
                                  AppSpacing.radiusXs,
                                ),
                              ),
                              child: Text(
                                skill,
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: AppColors.primary,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.monetization_on_outlined,
                        size: 18,
                        color: colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Rs. ${worker.hourlyRate.toStringAsFixed(0)}/hr',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ],
                  ),
                  Radio<int>(
                    value: index,
                    groupValue: _selectedWorkerIndex,
                    activeColor: AppColors.primary,
                    onChanged: (int? value) {
                      setState(() {
                        _selectedWorkerIndex = value;
                        _letUsChoose = false;
                      });
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrustBadge(int score) {
    String label;
    Color color;

    if (score >= 80) {
      label = 'Highly Trusted';
      color = AppColors.secondary;
    } else if (score >= 60) {
      label = 'Trusted';
      color = AppColors.primary;
    } else if (score >= 40) {
      label = 'Verified';
      color = AppColors.info;
    } else {
      label = 'New';
      color = AppColors.warning;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppSpacing.radiusXs),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.shield, color: color, size: 12),
          const SizedBox(width: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 14,
          color: colorScheme.onSurface.withValues(alpha: 0.7),
        ),
        const SizedBox(width: 2),
        Text(
          text,
          style: TextStyle(
            fontSize: 12,
            color: colorScheme.onSurface.withValues(alpha: 0.7),
          ),
        ),
      ],
    );
  }

  Widget _buildPriceSummary(PriceEstimate estimate) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Estimated Total',
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurface.withValues(alpha: 0.7),
            ),
          ),
          Text(
            'Rs. ${estimate.min.toStringAsFixed(0)} - ${estimate.max.toStringAsFixed(0)}',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}
