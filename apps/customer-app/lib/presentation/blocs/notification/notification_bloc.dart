import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/utils/error_mapper.dart';
import '../../../domain/repositories/notification_repository.dart';
import '../../../data/models/notification_model.dart';
import 'notification_event.dart';
import 'notification_state.dart';

/// BLoC for managing notification state
class NotificationBloc extends Bloc<NotificationEvent, NotificationState> {
  final NotificationRepository _notificationRepository;

  List<NotificationModel> _cachedNotifications = [];
  int _cachedUnreadCount = 0;
  int _currentPage = 1;
  int _totalPages = 1;

  NotificationBloc({required NotificationRepository notificationRepository})
    : _notificationRepository = notificationRepository,
      super(const NotificationInitial()) {
    on<LoadNotificationsRequested>(_onLoadNotifications);
    on<RefreshNotificationsRequested>(_onRefreshNotifications);
    on<LoadMoreNotificationsRequested>(_onLoadMoreNotifications);
    on<LoadUnreadCountRequested>(_onLoadUnreadCount);
    on<MarkNotificationAsReadRequested>(_onMarkNotificationAsRead);
    on<MarkAllNotificationsAsReadRequested>(_onMarkAllNotificationsAsRead);
    on<RegisterDeviceRequested>(_onRegisterDevice);
    on<UnregisterDeviceRequested>(_onUnregisterDevice);
    on<ClearNotificationStateRequested>(_onClearState);
  }

  Future<void> _onLoadNotifications(
    LoadNotificationsRequested event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      if (event.refresh) {
        emit(const NotificationLoading());
        _currentPage = 1;
      }

      final response = await _notificationRepository.getNotifications(
        page: event.page,
        limit: event.limit,
        unreadOnly: event.unreadOnly,
      );

      _cachedNotifications = response.notifications;
      _currentPage = response.page;
      _totalPages = response.totalPages;

      // Also get unread count
      _cachedUnreadCount = await _notificationRepository.getUnreadCount();

      emit(
        NotificationLoaded(
          notifications: _cachedNotifications,
          unreadCount: _cachedUnreadCount,
          currentPage: _currentPage,
          totalPages: _totalPages,
          hasMore: _currentPage < _totalPages,
        ),
      );
    } catch (e) {
      emit(NotificationError(ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onRefreshNotifications(
    RefreshNotificationsRequested event,
    Emitter<NotificationState> emit,
  ) async {
    // Inline the logic instead of dispatching a new event (anti-pattern)
    try {
      emit(const NotificationLoading());
      _currentPage = 1;

      final response = await _notificationRepository.getNotifications(
        page: 1,
        limit: 20,
      );

      _cachedNotifications = response.notifications;
      _currentPage = response.page;
      _totalPages = response.totalPages;
      _cachedUnreadCount = await _notificationRepository.getUnreadCount();

      emit(
        NotificationLoaded(
          notifications: _cachedNotifications,
          unreadCount: _cachedUnreadCount,
          currentPage: _currentPage,
          totalPages: _totalPages,
          hasMore: _currentPage < _totalPages,
        ),
      );
    } catch (e) {
      emit(NotificationError(ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onLoadMoreNotifications(
    LoadMoreNotificationsRequested event,
    Emitter<NotificationState> emit,
  ) async {
    if (state is NotificationLoaded) {
      final currentState = state as NotificationLoaded;
      if (!currentState.hasMore || currentState.isLoadingMore) return;

      emit(currentState.copyWith(isLoadingMore: true));

      try {
        final response = await _notificationRepository.getNotifications(
          page: _currentPage + 1,
          limit: 20,
        );

        _cachedNotifications = [
          ..._cachedNotifications,
          ...response.notifications,
        ];
        _currentPage = response.page;
        _totalPages = response.totalPages;

        emit(
          NotificationLoaded(
            notifications: _cachedNotifications,
            unreadCount: _cachedUnreadCount,
            currentPage: _currentPage,
            totalPages: _totalPages,
            hasMore: _currentPage < _totalPages,
            isLoadingMore: false,
          ),
        );
      } catch (e) {
        emit(currentState.copyWith(isLoadingMore: false));
      }
    }
  }

  Future<void> _onLoadUnreadCount(
    LoadUnreadCountRequested event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      _cachedUnreadCount = await _notificationRepository.getUnreadCount();

      if (state is NotificationLoaded) {
        emit(
          (state as NotificationLoaded).copyWith(
            unreadCount: _cachedUnreadCount,
          ),
        );
      }
    } catch (e) {
      // Silently fail for unread count
    }
  }

  Future<void> _onMarkNotificationAsRead(
    MarkNotificationAsReadRequested event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      await _notificationRepository.markAsRead(event.notificationId);

      // Update local cache
      final index = _cachedNotifications.indexWhere(
        (n) => n.id == event.notificationId,
      );
      if (index != -1 && !_cachedNotifications[index].isRead) {
        _cachedNotifications[index] = _cachedNotifications[index].copyWith(
          isRead: true,
          readAt: DateTime.now(),
        );
        if (_cachedUnreadCount > 0) _cachedUnreadCount--;
      }

      emit(
        NotificationActionSuccess(
          message: 'Notification marked as read',
          notifications: _cachedNotifications,
          unreadCount: _cachedUnreadCount,
        ),
      );

      // Emit loaded state with updated data
      emit(
        NotificationLoaded(
          notifications: _cachedNotifications,
          unreadCount: _cachedUnreadCount,
          currentPage: _currentPage,
          totalPages: _totalPages,
          hasMore: _currentPage < _totalPages,
        ),
      );
    } catch (e) {
      emit(NotificationError(ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onMarkAllNotificationsAsRead(
    MarkAllNotificationsAsReadRequested event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      await _notificationRepository.markAllAsRead();

      // Update local cache
      _cachedNotifications = _cachedNotifications
          .map((n) => n.copyWith(isRead: true, readAt: DateTime.now()))
          .toList();
      _cachedUnreadCount = 0;

      emit(
        NotificationActionSuccess(
          message: 'All notifications marked as read',
          notifications: _cachedNotifications,
          unreadCount: 0,
        ),
      );

      // Emit loaded state with updated data
      emit(
        NotificationLoaded(
          notifications: _cachedNotifications,
          unreadCount: 0,
          currentPage: _currentPage,
          totalPages: _totalPages,
          hasMore: _currentPage < _totalPages,
        ),
      );
    } catch (e) {
      emit(NotificationError(ErrorMapper.toUserMessage(e)));
    }
  }

  Future<void> _onRegisterDevice(
    RegisterDeviceRequested event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      await _notificationRepository.registerDevice(
        deviceToken: event.deviceToken,
        platform: event.platform,
      );
    } catch (e) {
      // Silently fail for device registration
    }
  }

  Future<void> _onUnregisterDevice(
    UnregisterDeviceRequested event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      await _notificationRepository.unregisterDevice(event.deviceToken);
    } catch (e) {
      // Silently fail for device unregistration
    }
  }

  void _onClearState(
    ClearNotificationStateRequested event,
    Emitter<NotificationState> emit,
  ) {
    _cachedNotifications = [];
    _cachedUnreadCount = 0;
    _currentPage = 1;
    _totalPages = 1;
    emit(const NotificationInitial());
  }
}
