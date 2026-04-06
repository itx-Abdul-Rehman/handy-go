import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../routes/app_routes.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../data/models/worker_model.dart';
import '../../../data/models/booking_model.dart';
import '../../../core/appwrite/appwrite_client.dart';
import '../../../core/appwrite/appwrite_config.dart';
import '../../../data/repositories/appwrite_booking_repository.dart';
import '../../../data/repositories/appwrite_worker_repository.dart';
import '../earnings/earnings_screen.dart';
import '../profile/profile_screen.dart';
import '../../../core/services/location_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  bool _isAvailable = false;
  WorkerModel? _worker;
  List<BookingModel> _availableJobs = [];
  List<BookingModel> _activeJobs = [];
  bool _isLoading = true;
  int _unreadNotificationCount = 0;

  final AppwriteBookingRepository _bookingRepository =
      AppwriteBookingRepository();
  final AppwriteWorkerRepository _workerRepository = AppwriteWorkerRepository();

  // Realtime subscriptions for live updates
  StreamSubscription? _bookingsSub;
  StreamSubscription? _notificationsSub;
  StreamSubscription? _workerProfileSub;
  StreamSubscription? _newBookingAlertSub;

  final LocationService _locationService = LocationService();

  @override
  void initState() {
    super.initState();
    _loadData();
    _subscribeToRealtimeUpdates();
  }

  @override
  void dispose() {
    _bookingsSub?.cancel();
    _notificationsSub?.cancel();
    _workerProfileSub?.cancel();
    _newBookingAlertSub?.cancel();
    // Don't stop location tracking on dispose — the service is a singleton
    // and should keep tracking even when navigating away from home screen.
    super.dispose();
  }

  /// Subscribe to realtime channels for bookings, notifications, and worker
  /// profile changes so the home screen stays up-to-date without polling.
  void _subscribeToRealtimeUpdates() {
    try {
      // 1. Bookings collection — new jobs + status changes on active jobs
      final bookingsSub = AppwriteClient.realtime.subscribe([
        'tablesdb.${AppwriteConfig.databaseId}.tables.${AppwriteConfig.bookingsCollection}.rows',
      ]);
      _bookingsSub = bookingsSub.stream.listen((_) {
        if (mounted) _refreshBookings();
      });

      // 2. Notifications collection — live unread count badge
      final notifSub = AppwriteClient.realtime.subscribe([
        'tablesdb.${AppwriteConfig.databaseId}.tables.${AppwriteConfig.notificationsCollection}.rows',
      ]);
      _notificationsSub = notifSub.stream.listen((event) {
        // Only refresh count if the notification is for this user
        _refreshNotificationCount();
      });

      // 3. Worker profile — stats, verification status, trust score changes
      final workerId = _worker?.id;
      if (workerId != null && workerId.isNotEmpty) {
        _subscribeToWorkerProfile(workerId);
      }
    } catch (e) {
      // Realtime is nice-to-have; don't crash if unavailable
    }
  }

  void _subscribeToWorkerProfile(String workerId) {
    _workerProfileSub?.cancel();
    try {
      final sub = AppwriteClient.realtime.subscribe([
        'tablesdb.${AppwriteConfig.databaseId}.tables.${AppwriteConfig.workersCollection}.rows.$workerId',
      ]);
      _workerProfileSub = sub.stream.listen((_) async {
        if (mounted) {
          // Refresh AuthBloc so profile screen & home stats update together
          context.read<AuthBloc>().add(RefreshProfile());
          // Also reload local _worker so home screen stats update instantly
          try {
            final worker = await _workerRepository.getProfile();
            if (mounted) {
              setState(() {
                _worker = worker;
                _isAvailable = worker.availability.isAvailable;
              });
            }
          } catch (_) {}
        }
      });
    } catch (_) {}
  }

  /// Subscribe to new bookings assigned to this worker and show an alert popup
  void _subscribeToNewBookingAlerts(String workerId) {
    _newBookingAlertSub?.cancel();
    try {
      _newBookingAlertSub = _bookingRepository
          .subscribeToNewBookings(workerId)
          .listen((payload) {
            if (!mounted) return;
            _showNewBookingAlert(payload);
          });
    } catch (_) {}
  }

  void _showNewBookingAlert(Map<String, dynamic> bookingData) {
    final category = bookingData['serviceCategory'] ?? 'Service';
    final description = bookingData['problemDescription'] ?? '';
    final bookingId = bookingData['\$id'] ?? '';
    final isUrgent = bookingData['isUrgent'] == true;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(context).colorScheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
        ),
        title: Row(
          children: [
            Icon(
              isUrgent ? Icons.priority_high : Icons.work_outline,
              color: isUrgent ? AppColors.error : AppColors.primary,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                isUrgent ? 'Urgent Job Request!' : 'New Job Request',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppSpacing.radiusSM),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.category,
                    size: 18,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      category,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (description.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.md),
              Text(
                description,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.8),
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
            },
            child: const Text('Dismiss'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              if (bookingId.isNotEmpty) {
                Navigator.of(
                  context,
                ).pushNamed(AppRoutes.bookingDetails, arguments: bookingId);
              }
            },
            child: const Text('View Details'),
          ),
        ],
      ),
    );
  }

  /// Lightweight refresh — only reloads bookings, not entire profile
  Future<void> _refreshBookings() async {
    try {
      final available = await _bookingRepository.getAvailableBookings();
      final active = await _bookingRepository.getWorkerBookings(
        status: 'IN_PROGRESS',
      );
      if (mounted) {
        setState(() {
          _availableJobs = available;
          _activeJobs = active;
        });
      }
    } catch (_) {}
  }

  /// Refresh only the unread notification count badge
  Future<void> _refreshNotificationCount() async {
    try {
      final user = await AppwriteClient.account.get();
      final result = await AppwriteClient.tablesDB.listRows(
        databaseId: AppwriteConfig.databaseId,
        tableId: AppwriteConfig.notificationsCollection,
        queries: [
          'equal("recipientId", "${user.$id}")',
          'equal("isRead", false)',
          'limit(1)',
        ],
      );
      if (mounted) {
        setState(() {
          _unreadNotificationCount = result.total;
        });
      }
    } catch (_) {}
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final worker = await _workerRepository.getProfile();
      final available = await _bookingRepository.getAvailableBookings();
      final active = await _bookingRepository.getWorkerBookings(
        status: 'IN_PROGRESS',
      );

      // Load unread notification count
      int unreadCount = 0;
      try {
        final user = await AppwriteClient.account.get();
        final notifResult = await AppwriteClient.tablesDB.listRows(
          databaseId: AppwriteConfig.databaseId,
          tableId: AppwriteConfig.notificationsCollection,
          queries: [
            'equal("recipientId", "${user.$id}")',
            'equal("isRead", false)',
            'limit(1)',
          ],
        );
        unreadCount = notifResult.total;
      } catch (_) {
        // Notifications count is best-effort
      }

      setState(() {
        _worker = worker;
        _isAvailable = worker.availability.isAvailable;
        _availableJobs = available;
        _activeJobs = active;
        _unreadNotificationCount = unreadCount;
        _isLoading = false;
      });

      // Start location tracking if worker is available and not on an active job
      if (_isAvailable && _locationService.activeBookingId == null) {
        _locationService.startIdleTracking();
      }

      // Subscribe to worker profile realtime once we have the ID
      if (_workerProfileSub == null && worker.id.isNotEmpty) {
        _subscribeToWorkerProfile(worker.id);
      }

      // Subscribe to new booking alerts targeted at this worker
      if (_newBookingAlertSub == null && worker.id.isNotEmpty) {
        _subscribeToNewBookingAlerts(worker.id);
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleAvailability() async {
    try {
      // Prevent going offline if there's an active job in progress
      if (_isAvailable && _activeJobs.isNotEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Cannot go offline while you have an active job in progress',
              ),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }

      // Request location permission before going online
      if (!_isAvailable) {
        final hasPermission = await _locationService.requestPermission();
        if (!hasPermission && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Location permission is required to go online'),
              backgroundColor: AppColors.warning,
            ),
          );
          // Still allow toggling — location is best-effort
        }
      }

      final newStatus = await _workerRepository.updateAvailability(
        !_isAvailable,
      );
      setState(() {
        _isAvailable = newStatus;
      });

      // Start or stop idle location tracking
      if (newStatus) {
        _locationService.startIdleTracking();
      } else {
        _locationService.stopIdleTracking();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to update availability'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is Authenticated) {
          setState(() {
            _worker = state.worker;
            _isAvailable = state.worker.availability.isAvailable;
          });
        }
      },
      child: Scaffold(
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : IndexedStack(
                index: _currentIndex,
                children: [
                  _buildHomeTab(),
                  _buildJobsTab(),
                  _buildEarningsTab(),
                  _buildProfileTab(),
                ],
              ),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.work_outline),
              activeIcon: Icon(Icons.work),
              label: 'Jobs',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet_outlined),
              activeIcon: Icon(Icons.account_balance_wallet),
              label: 'Earnings',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHomeTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            floating: true,
            backgroundColor: Theme.of(context).colorScheme.surface,
            title: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.primaryDark,
                  child: Text(
                    _worker?.firstName.substring(0, 1).toUpperCase() ?? 'W',
                    style: const TextStyle(
                      color: AppColors.textOnPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hello, ${_worker?.firstName ?? 'Worker'}!',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    Text(
                      _isAvailable ? 'Available' : 'Offline',
                      style: TextStyle(
                        fontSize: 12,
                        color: _isAvailable
                            ? AppColors.success
                            : AppColors.error,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: Stack(
                  children: [
                    const Icon(Icons.notifications_outlined),
                    if (_unreadNotificationCount > 0)
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.error,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                  ],
                ),
                onPressed: () async {
                  await Navigator.pushNamed(context, AppRoutes.notifications);
                  // Refresh count when returning from notifications
                  _loadData();
                },
              ),
            ],
          ),

          // Availability Toggle Card
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(AppSpacing.md),
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                gradient: _isAvailable
                    ? AppColors.primaryGradient
                    : const LinearGradient(
                        colors: [Color(0xFF555555), Color(0xFF757575)],
                      ),
                borderRadius: BorderRadius.circular(AppSpacing.radiusLG),
                boxShadow: [
                  BoxShadow(
                    color:
                        (_isAvailable
                                ? AppColors.primary
                                : Theme.of(context).colorScheme.onSurface
                                      .withValues(alpha: 0.7))
                            .withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isAvailable ? 'You are Online' : 'You are Offline',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textOnPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _isAvailable
                              ? 'Ready to receive job requests'
                              : 'Toggle to start receiving jobs',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppColors.textOnPrimary.withValues(
                              alpha: 0.9,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: _isAvailable,
                    onChanged: (_) => _toggleAvailability(),
                    activeThumbColor: AppColors.textOnPrimary,
                    activeTrackColor: AppColors.textOnPrimary.withValues(
                      alpha: 0.3,
                    ),
                    inactiveThumbColor: AppColors.textOnPrimary,
                    inactiveTrackColor: AppColors.textOnPrimary.withValues(
                      alpha: 0.3,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Stats Cards – single combined card
          SliverToBoxAdapter(
            child: Padding(
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
                    _buildCompactStat(
                      Icons.star,
                      _worker?.rating.average.toStringAsFixed(1) ?? '0.0',
                      'Rating',
                      AppColors.starActive,
                    ),
                    Container(width: 1, height: 36, color: AppColors.border),
                    _buildCompactStat(
                      Icons.check_circle,
                      '${_worker?.totalJobsCompleted ?? 0}',
                      'Jobs',
                      AppColors.success,
                    ),
                    Container(width: 1, height: 36, color: AppColors.border),
                    _buildCompactStat(
                      Icons.verified_user,
                      '${_worker?.trustScore ?? 50}',
                      'Trust',
                      AppColors.info,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Active Jobs Section
          if (_activeJobs.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Active Jobs',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    TextButton(
                      onPressed: () => setState(() => _currentIndex = 1),
                      child: const Text('View All'),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 200,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                  ),
                  itemCount: _activeJobs.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.md),
                      child: _buildActiveJobCard(_activeJobs[index]),
                    );
                  },
                ),
              ),
            ),
          ],

          // Available Jobs Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Available Jobs',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    '${_availableJobs.length} jobs',
                    style: TextStyle(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (_availableJobs.isEmpty)
            SliverToBoxAdapter(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Column(
                    children: [
                      Icon(
                        Icons.work_off_outlined,
                        size: 64,
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.5),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        'No jobs available right now',
                        style: TextStyle(
                          fontSize: 16,
                          color: Theme.of(
                            context,
                          ).colorScheme.onSurface.withValues(alpha: 0.7),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Stay online to receive new job requests',
                        style: TextStyle(
                          fontSize: 14,
                          color: Theme.of(
                            context,
                          ).colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.xs,
                  ),
                  child: _buildJobCard(_availableJobs[index]),
                ),
                childCount: _availableJobs.length,
              ),
            ),

          // Bottom Spacing
          const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xl)),
        ],
      ),
    );
  }

  Widget _buildCompactStat(
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

  Widget _buildActiveJobCard(BookingModel booking) {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(
          context,
          AppRoutes.activeJob,
          arguments: booking.id,
        );
      },
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
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.end,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              booking.serviceCategory.replaceAll('_', ' '),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.xs),
            Flexible(
              child: Text(
                booking.problemDescription,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: 16,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.7),
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    booking.address.city,
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
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

  Widget _buildJobCard(BookingModel booking) {
    return Card(
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(
            context,
            AppRoutes.bookingDetails,
            arguments: booking.id,
          );
        },
        borderRadius: BorderRadius.circular(AppSpacing.radiusMD),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
                      _getServiceIcon(booking.serviceCategory),
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
                          style: TextStyle(
                            fontSize: 14,
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurface.withValues(alpha: 0.7),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (booking.isUrgent)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        borderRadius: BorderRadius.circular(
                          AppSpacing.radiusSM,
                        ),
                      ),
                      child: const Text(
                        'URGENT',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textOnPrimary,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                booking.problemDescription,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 14,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    size: 16,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      booking.address.full,
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
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

  IconData _getServiceIcon(String category) {
    switch (category) {
      case 'PLUMBING':
        return Icons.plumbing;
      case 'ELECTRICAL':
        return Icons.electrical_services;
      case 'CLEANING':
        return Icons.cleaning_services;
      case 'AC_REPAIR':
        return Icons.ac_unit;
      case 'CARPENTER':
        return Icons.carpenter;
      case 'PAINTING':
        return Icons.format_paint;
      case 'MECHANIC':
        return Icons.build;
      default:
        return Icons.handyman;
    }
  }

  Widget _buildJobsTab() {
    return _JobsTab(repository: _bookingRepository);
  }

  Widget _buildEarningsTab() {
    return const EarningsScreen();
  }

  Widget _buildProfileTab() {
    return const ProfileScreen();
  }
}

// ---------------------------------------------------------------------------
// Jobs Tab – shows booking history with status filter
// ---------------------------------------------------------------------------
class _JobsTab extends StatefulWidget {
  final AppwriteBookingRepository repository;
  const _JobsTab({required this.repository});

  @override
  State<_JobsTab> createState() => _JobsTabState();
}

class _JobsTabState extends State<_JobsTab>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final Map<String, List<BookingModel>> _bookings = {};
  final Map<String, bool> _loading = {};
  static const List<String> _filters = [
    'ALL',
    'PENDING',
    'ACCEPTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _filters.length, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        _loadIfNeeded(_filters[_tabController.index]);
      }
    });
    _loadIfNeeded('ALL');
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadIfNeeded(String filter) async {
    if (_bookings.containsKey(filter)) return;
    _loadBookings(filter);
  }

  Future<void> _loadBookings(String filter) async {
    setState(() => _loading[filter] = true);
    try {
      final status = filter == 'ALL' ? null : filter;
      final list = await widget.repository.getWorkerBookings(
        status: status,
        limit: 50,
      );
      if (mounted) setState(() => _bookings[filter] = list);
    } catch (_) {
      if (mounted) setState(() => _bookings[filter] = []);
    } finally {
      if (mounted) setState(() => _loading[filter] = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Jobs'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: _filters.map((f) => Tab(text: f.replaceAll('_', ' '))).toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _filters.map(_buildList).toList(),
      ),
    );
  }

  Widget _buildList(String filter) {
    final isLoading = _loading[filter] ?? false;
    final list = _bookings[filter];

    if (isLoading && list == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (list == null || list.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.work_off,
              size: 64,
              color: Theme.of(
                context,
              ).colorScheme.onSurface.withValues(alpha: 0.5),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'No ${filter == "ALL" ? "" : "${filter.replaceAll("_", " ").toLowerCase()} "}jobs found',
              style: TextStyle(
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadBookings(filter),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.sm),
        itemCount: list.length,
        itemBuilder: (context, index) => _buildBookingCard(list[index]),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final amPm = dt.hour >= 12 ? 'PM' : 'AM';
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}, $hour:${dt.minute.toString().padLeft(2, '0')} $amPm';
  }

  Widget _buildBookingCard(BookingModel booking) {
    Color statusColor;
    switch (booking.status) {
      case 'COMPLETED':
        statusColor = AppColors.success;
        break;
      case 'CANCELLED':
        statusColor = AppColors.error;
        break;
      case 'IN_PROGRESS':
        statusColor = AppColors.warning;
        break;
      case 'ACCEPTED':
        statusColor = AppColors.primary;
        break;
      default:
        statusColor = Theme.of(
          context,
        ).colorScheme.onSurface.withValues(alpha: 0.7);
    }

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          final isTerminal =
              booking.status == 'COMPLETED' || booking.status == 'CANCELLED';
          Navigator.pushNamed(
            context,
            isTerminal ? AppRoutes.bookingDetails : AppRoutes.activeJob,
            arguments: booking.id,
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      booking.serviceCategory.replaceAll('_', ' '),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      booking.status.replaceAll('_', ' '),
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              if (booking.problemDescription.isNotEmpty)
                Text(
                  booking.problemDescription,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              const SizedBox(height: AppSpacing.xs),
              Row(
                children: [
                  Icon(
                    Icons.access_time,
                    size: 14,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(booking.scheduledDateTime),
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                  const Spacer(),
                  if (booking.pricing.estimatedPrice != null)
                    Text(
                      'Rs. ${booking.pricing.estimatedPrice!.toStringAsFixed(0)}',
                      style: const TextStyle(
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
}
