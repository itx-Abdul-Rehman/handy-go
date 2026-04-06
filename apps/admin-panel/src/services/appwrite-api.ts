/**
 * Appwrite-based API services for the Admin Panel.
 *
 * Drop-in replacement for api.ts — each exported object exposes the same
 * method signatures so page components work without modification.
 *
 * Usage: create a barrel file  `services/index.ts` that re-exports either
 * the Axios or Appwrite implementations depending on a build flag, or
 * simply swap imports in each page file.
 */
import { Query, ID } from 'appwrite';
import { account, databases, functions, client } from './appwrite-client';
import { appwriteConfig } from './appwrite-config';
import { useAuthStore } from '../store/authStore';

const { databaseId, collections, functions: fnIds } = appwriteConfig;

// ============================================================
// Auth API
// ============================================================
export const authApi = {
  /**
   * Login with phone + password.
   * Maps phone to a synthetic email for Appwrite email-password auth.
   */
  login: async (phone: string, password: string) => {
    await account.createEmailPasswordSession(
      `${phone}@handygo.app`,
      password,
    );
    const user = await account.get();

    // Verify admin role via Appwrite user labels
    if (!user.labels?.includes('admin')) {
      await account.deleteSession('current');
      throw new Error('This account does not have admin privileges');
    }

    const userData = {
      _id: user.$id,
      phone: user.phone || phone,
      email: user.email,
      role: 'ADMIN',
      isVerified: user.emailVerification,
      isActive: true,
    };

    return {
      success: true,
      user: userData,
      // Appwrite manages sessions — tokens kept for store compatibility
      accessToken: 'appwrite-session',
      refreshToken: 'appwrite-session',
    };
  },

  logout: async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // Session may already be expired
    }
    useAuthStore.getState().logout();
  },
};

// ============================================================
// Users API (Admin)
// ============================================================
export const usersApi = {
  getCustomers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    const queries: string[] = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];

    if (params?.search) {
      queries.push(Query.search('firstName', params.search));
    }

    const result = await databases.listDocuments(
      databaseId,
      collections.customers,
      queries,
    );

    return {
      success: true,
      customers: result.documents.map((doc) => ({
        _id: doc.$id,
        firstName: doc.firstName ?? '',
        lastName: doc.lastName ?? '',
        profileImage: doc.profileImage,
        phone: doc.phone ?? '',
        email: doc.email ?? '',
        addresses: doc.addresses ? (typeof doc.addresses === 'string' ? JSON.parse(doc.addresses) : doc.addresses) : [],
        totalBookings: doc.totalBookings ?? 0,
        isActive: doc.isActive !== false,
        createdAt: doc.$createdAt,
      })),
      total: result.total,
      page,
      limit,
    };
  },

  getWorkers: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    const queries: string[] = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];

    if (params?.status) {
      queries.push(Query.equal('status', params.status));
    }
    if (params?.search) {
      queries.push(Query.search('firstName', params.search));
    }

    const result = await databases.listDocuments(
      databaseId,
      collections.workers,
      queries,
    );

    return {
      success: true,
      workers: result.documents.map((doc) => _mapWorkerDoc(doc)),
      total: result.total,
      page,
      limit,
    };
  },

  getPendingWorkers: async () => {
    const result = await databases.listDocuments(
      databaseId,
      collections.workers,
      [
        Query.equal('status', 'PENDING_VERIFICATION'),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ],
    );

    return {
      success: true,
      workers: result.documents.map((doc) => _mapWorkerDoc(doc)),
    };
  },

  verifyWorker: async (workerId: string, data: { status: string; notes?: string }) => {
    const updateData: Record<string, unknown> = {
      status: data.status,
    };
    if (data.status === 'ACTIVE') {
      updateData.cnicVerified = true;
    }

    const doc = await databases.updateDocument(
      databaseId,
      collections.workers,
      workerId,
      updateData,
    );

    // Send notification to worker
    try {
      await functions.createExecution(
        fnIds.notificationSender,
        JSON.stringify({
          action: 'send_template',
          recipientId: doc.userId ?? workerId,
          template: 'worker_verification',
          variables: { status: data.status === 'ACTIVE' ? 'approved' : 'rejected' },
        }),
      );
    } catch {
      // Non-critical
    }

    return { success: true, worker: _mapWorkerDoc(doc) };
  },

  updateUserStatus: async (userId: string, data: { isActive: boolean; reason?: string }) => {
    // Try updating worker document
    try {
      await databases.updateDocument(
        databaseId,
        collections.workers,
        userId,
        { status: data.isActive ? 'ACTIVE' : 'SUSPENDED' },
      );
    } catch {
      // Try customer
      try {
        await databases.updateDocument(
          databaseId,
          collections.customers,
          userId,
          { isActive: data.isActive },
        );
      } catch {
        throw new Error('User not found');
      }
    }
    return { success: true };
  },

  /** Real stats for Workers page summary cards */
  getWorkerStats: async () => {
    const total = await databases.listDocuments(databaseId, collections.workers, [Query.limit(1)]);
    const pending = await databases.listDocuments(databaseId, collections.workers, [
      Query.equal('status', 'PENDING_VERIFICATION'), Query.limit(1),
    ]);
    const active = await databases.listDocuments(databaseId, collections.workers, [
      Query.equal('status', 'ACTIVE'), Query.limit(1),
    ]);
    const suspended = await databases.listDocuments(databaseId, collections.workers, [
      Query.equal('status', 'SUSPENDED'), Query.limit(1),
    ]);
    return { total: total.total, pending: pending.total, active: active.total, suspended: suspended.total };
  },

  /** Real stats for Customers page summary cards */
  getCustomerStats: async () => {
    const total = await databases.listDocuments(databaseId, collections.customers, [Query.limit(1)]);
    // Active vs inactive (isActive field may not exist on all docs, treat missing as active)
    let activeCount = total.total;
    try {
      const inactive = await databases.listDocuments(databaseId, collections.customers, [
        Query.equal('isActive', false), Query.limit(1),
      ]);
      activeCount = total.total - inactive.total;
    } catch { /* attribute may not be indexed */ }

    // Total bookings count
    const bookings = await databases.listDocuments(databaseId, collections.bookings, [Query.limit(1)]);

    // New this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const newThisMonth = await databases.listDocuments(databaseId, collections.customers, [
      Query.greaterThanEqual('$createdAt', monthStart.toISOString()), Query.limit(1),
    ]);

    return {
      total: total.total,
      active: activeCount,
      totalBookings: bookings.total,
      newThisMonth: newThisMonth.total,
    };
  },

};

// ============================================================
// Bookings API (Admin)
// ============================================================
export const bookingsApi = {
  /** Real stats for Bookings page summary cards */
  getBookingStatusCounts: async () => {
    const total = await databases.listDocuments(databaseId, collections.bookings, [Query.limit(1)]);
    const pending = await databases.listDocuments(databaseId, collections.bookings, [
      Query.equal('status', 'PENDING'), Query.limit(1),
    ]);
    const inProgress = await databases.listDocuments(databaseId, collections.bookings, [
      Query.equal('status', 'IN_PROGRESS'), Query.limit(1),
    ]);
    const completed = await databases.listDocuments(databaseId, collections.bookings, [
      Query.equal('status', 'COMPLETED'), Query.limit(1),
    ]);
    const cancelled = await databases.listDocuments(databaseId, collections.bookings, [
      Query.equal('status', 'CANCELLED'), Query.limit(1),
    ]);
    return { total: total.total, pending: pending.total, inProgress: inProgress.total, completed: completed.total, cancelled: cancelled.total };
  },
  getBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    serviceCategory?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    const queries: string[] = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];

    if (params?.status) {
      queries.push(Query.equal('status', params.status));
    }
    if (params?.serviceCategory) {
      queries.push(Query.equal('serviceCategory', params.serviceCategory));
    }
    if (params?.startDate) {
      queries.push(Query.greaterThanEqual('scheduledDateTime', params.startDate));
    }
    if (params?.endDate) {
      queries.push(Query.lessThanEqual('scheduledDateTime', params.endDate));
    }

    const result = await databases.listDocuments(
      databaseId,
      collections.bookings,
      queries,
    );

    return {
      success: true,
      bookings: result.documents.map((doc) => _mapBookingDoc(doc)),
      total: result.total,
      page,
      limit,
    };
  },

  getBookingStats: async (period: 'day' | 'week' | 'month') => {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Fetch all bookings in the period
    const all = await databases.listDocuments(databaseId, collections.bookings, [
      Query.greaterThanEqual('$createdAt', startDate.toISOString()),
      Query.limit(5000),
    ]);

    const docs = all.documents;
    const completed = docs.filter((d) => d.status === 'COMPLETED');
    const cancelled = docs.filter((d) => d.status === 'CANCELLED');
    const totalRevenue = completed.reduce((sum, d) => sum + (d.finalPrice || d.estimatedPrice || 0), 0);

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    for (const d of docs) {
      const cat = d.serviceCategory || 'OTHER';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    }

    // Average rating from reviews
    const reviews = await databases.listDocuments(databaseId, collections.reviews, [
      Query.greaterThanEqual('$createdAt', startDate.toISOString()),
      Query.limit(5000),
    ]);
    const avgRating =
      reviews.documents.length > 0
        ? reviews.documents.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.documents.length
        : 0;

    // Total customers + workers (not period-filtered — these are overall counts)
    let totalCustomers = 0;
    let activeWorkers = 0;
    try {
      const custResult = await databases.listDocuments(databaseId, collections.customers, [Query.limit(1)]);
      totalCustomers = custResult.total;
    } catch { /* ignore */ }
    try {
      const wrkResult = await databases.listDocuments(databaseId, collections.workers, [
        Query.equal('status', 'ACTIVE'),
        Query.limit(1),
      ]);
      activeWorkers = wrkResult.total;
    } catch { /* ignore */ }

    // Daily bookings for chart (last 7 days)
    const dailyBookings: Array<{ date: string; dayName: string; bookings: number }> = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const count = docs.filter(
        (b) => new Date(b.$createdAt) >= dayStart && new Date(b.$createdAt) < dayEnd,
      ).length;
      dailyBookings.push({
        date: dayStart.toISOString().slice(0, 10),
        dayName: dayNames[dayStart.getDay()],
        bookings: count,
      });
    }

    // Monthly revenue for chart (last 6 months)
    const monthlyRevenue: Array<{ month: string; revenue: number }> = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 1);
      // Revenue from ALL completed bookings in that month (broader query)
      let mRevenue = 0;
      try {
        const mBookings = await databases.listDocuments(databaseId, collections.bookings, [
          Query.equal('status', 'COMPLETED'),
          Query.greaterThanEqual('$createdAt', mDate.toISOString()),
          Query.lessThan('$createdAt', mEnd.toISOString()),
          Query.limit(5000),
        ]);
        mRevenue = mBookings.documents.reduce((s, b) => s + (b.finalPrice || b.estimatedPrice || 0), 0);
      } catch { /* ignore */ }
      monthlyRevenue.push({ month: monthNames[mDate.getMonth()], revenue: Math.round(mRevenue) });
    }

    // Category distribution as percentage
    const totalCat = Object.values(categoryBreakdown).reduce((s, v) => s + v, 0) || 1;
    const categoryColors: Record<string, string> = {
      PLUMBING: '#2196F3',
      ELECTRICAL: '#4CAF50',
      AC_REPAIR: '#FF9800',
      CLEANING: '#9C27B0',
      CARPENTER: '#795548',
      PAINTING: '#00BCD4',
      MECHANIC: '#F44336',
      GENERAL_HANDYMAN: '#607D8B',
    };
    const categoryDistribution = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: Math.round((value / totalCat) * 100),
        color: categoryColors[name] || '#607D8B',
      }));

    // Recent bookings (last 5)
    const recentDocs = await databases.listDocuments(databaseId, collections.bookings, [
      Query.orderDesc('$createdAt'),
      Query.limit(5),
    ]);
    const recentBookings = recentDocs.documents.map((doc) => ({
      id: doc.bookingNumber ?? doc.$id.slice(0, 12),
      customer: `${doc.customerFirstName ?? ''} ${doc.customerLastName ?? ''}`.trim() || 'Customer',
      service: (doc.serviceCategory ?? 'SERVICE').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      status: doc.status ?? 'PENDING',
      amount: doc.finalPrice || doc.estimatedPrice || 0,
    }));

    return {
      success: true,
      stats: {
        totalBookings: docs.length,
        completedBookings: completed.length,
        cancelledBookings: cancelled.length,
        averageRating: Math.round(avgRating * 10) / 10,
        totalRevenue: Math.round(totalRevenue),
        categoryBreakdown,
        // New fields for real dashboard data
        totalCustomers,
        activeWorkers,
        dailyBookings,
        monthlyRevenue,
        categoryDistribution,
        recentBookings,
      },
    };
  },

  updateBooking: async (bookingId: string, data: { status?: string; notes?: string }) => {
    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;

    const doc = await databases.updateDocument(
      databaseId,
      collections.bookings,
      bookingId,
      updateData,
    );

    // Add timeline entry
    if (data.status) {
      await databases.createDocument(
        databaseId,
        collections.bookingTimeline,
        ID.unique(),
        {
          bookingId,
          status: data.status,
          note: data.notes || `Admin updated status to ${data.status}`,
          timestamp: new Date().toISOString(),
        },
      );
    }

    return { success: true, booking: _mapBookingDoc(doc) };
  },
};

// ============================================================
// SOS API (Admin)
// ============================================================
export const sosApi = {
  getActiveSOS: async () => {
    const result = await databases.listDocuments(
      databaseId,
      collections.sosAlerts,
      [
        Query.notEqual('status', 'RESOLVED'),
        Query.orderDesc('priority'),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ],
    );

    return {
      success: true,
      alerts: result.documents.map((doc) => ({
        _id: doc.$id,
        booking: doc.bookingNumber
          ? { bookingNumber: doc.bookingNumber, serviceCategory: doc.serviceCategory ?? '' }
          : undefined,
        initiatedBy: {
          userType: doc.initiatedByType,
          userId: doc.initiatedByUserId,
          name: doc.initiatedByName ?? 'Unknown',
          phone: doc.initiatedByPhone ?? '',
        },
        priority: doc.priority,
        aiAssessedPriority: doc.aiAssessedPriority,
        reason: doc.reason,
        description: doc.description,
        location: {
          coordinates: doc.latitude != null
            ? [doc.longitude, doc.latitude] as [number, number]
            : [0, 0] as [number, number],
          address: doc.address ?? '',
        },
        evidence: {
          images: doc.evidenceImages ? JSON.parse(doc.evidenceImages) : [],
          audioRecording: doc.audioRecording,
        },
        status: doc.status,
        assignedAdmin: doc.assignedAdminId,
        resolution: doc.resolutionAction
          ? {
              action: doc.resolutionAction,
              resolvedBy: doc.resolvedById,
              resolvedAt: doc.resolvedAt,
              notes: doc.resolutionNotes,
            }
          : null,
        createdAt: doc.$createdAt,
      })),
    };
  },

  assignSOS: async (sosId: string) => {
    const user = await account.get();
    await databases.updateDocument(
      databaseId,
      collections.sosAlerts,
      sosId,
      { assignedAdminId: user.$id },
    );
    return { success: true };
  },

  resolveSOS: async (sosId: string, data: { action: string; notes: string }) => {
    const currentUser = await account.get();
    await functions.createExecution(
      fnIds.sosAnalyzer,
      JSON.stringify({
        action: 'resolve',
        sosId,
        resolutionAction: data.action,
        resolvedBy: currentUser.$id,
        notes: data.notes,
      }),
    );
    return { success: true };
  },

  escalateSOS: async (sosId: string, data: { reason: string }) => {
    const currentUser = await account.get();
    await functions.createExecution(
      fnIds.sosAnalyzer,
      JSON.stringify({
        action: 'escalate',
        sosId,
        reason: data.reason,
        escalatedBy: currentUser.$id,
      }),
    );
    return { success: true };
  },
};

// ============================================================
// Realtime subscriptions for admin dashboard
// ============================================================
export const appwriteRealtime = {
  /** Subscribe to new/updated SOS alerts (replaces polling) */
  subscribeToSOS: (callback: (payload: Record<string, unknown>) => void) => {
    return client.subscribe(
      [`databases.${databaseId}.collections.${collections.sosAlerts}.documents`],
      (response) => callback(response.payload as Record<string, unknown>),
    );
  },

  /** Subscribe to booking updates */
  subscribeToBookings: (callback: (payload: Record<string, unknown>) => void) => {
    return client.subscribe(
      [`databases.${databaseId}.collections.${collections.bookings}.documents`],
      (response) => callback(response.payload as Record<string, unknown>),
    );
  },
};

// ============================================================
// Helper mappers — convert flat Appwrite docs to the shape the
// existing admin pages expect (matching the REST API responses).
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _mapWorkerDoc(doc: any) {
  return {
    _id: doc.$id || doc.userId,
    firstName: doc.firstName ?? '',
    lastName: doc.lastName ?? '',
    profileImage: doc.profileImage,
    phone: doc.phone ?? '',
    cnic: doc.cnic ?? '',
    cnicVerified: doc.cnicVerified ?? false,
    skills: [], // Fetched from worker_skills collection if needed
    rating: {
      average: doc.ratingAverage ?? 0,
      count: doc.ratingCount ?? 0,
    },
    trustScore: doc.trustScore ?? 50,
    totalJobsCompleted: doc.totalJobsCompleted ?? 0,
    totalEarnings: doc.totalEarnings ?? 0,
    status: doc.status ?? 'PENDING_VERIFICATION',
    createdAt: doc.$createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _mapBookingDoc(doc: any) {
  return {
    _id: doc.$id,
    bookingNumber: doc.bookingNumber ?? '',
    customer: {
      firstName: doc.customerFirstName ?? '',
      lastName: doc.customerLastName ?? '',
      phone: doc.customerPhone ?? '',
    },
    worker: doc.workerId
      ? {
          firstName: doc.workerFirstName ?? '',
          lastName: doc.workerLastName ?? '',
          phone: doc.workerPhone ?? '',
        }
      : undefined,
    serviceCategory: doc.serviceCategory ?? '',
    problemDescription: doc.problemDescription ?? '',
    address: {
      full: doc.addressFull ?? '',
      city: doc.addressCity ?? '',
    },
    scheduledDateTime: doc.scheduledDateTime,
    isUrgent: doc.isUrgent ?? false,
    status: doc.status ?? 'PENDING',
    pricing: {
      estimatedPrice: doc.estimatedPrice ?? 0,
      finalPrice: doc.finalPrice ?? 0,
    },
    timeline: [],
    createdAt: doc.$createdAt,
  };
}

// ============================================================
// Settings API — persists to localStorage (+ Appwrite when collection exists)
// ============================================================
const SETTINGS_STORAGE_KEY = 'handygo_platform_settings';

export const settingsApi = {
  /**
   * Load all settings sections. Returns the 4 sections or defaults.
   */
  getSettings: async (): Promise<{
    general: Record<string, unknown>;
    notifications: Record<string, unknown>;
    platform: Record<string, unknown>;
    security: Record<string, unknown>;
  }> => {
    // Try Appwrite first (if collection exists)
    try {
      const doc = await databases.getDocument(databaseId, collections.platformSettings, 'settings');
      const data = {
        general: JSON.parse(doc.general ?? '{}'),
        notifications: JSON.parse(doc.notifications ?? '{}'),
        platform: JSON.parse(doc.platform ?? '{}'),
        security: JSON.parse(doc.security ?? '{}'),
      };
      // Cache locally
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
      return data;
    } catch {
      // Fallback to localStorage
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch { /* corrupted */ }
      }
      // Return empty — page will use its defaults
      return { general: {}, notifications: {}, platform: {}, security: {} };
    }
  },

  /**
   * Save a specific section of settings.
   */
  saveSettings: async (
    section: 'general' | 'notifications' | 'platform' | 'security',
    data: Record<string, unknown>,
  ): Promise<void> => {
    // Always save to localStorage
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    let all: Record<string, unknown> = {};
    try { all = stored ? JSON.parse(stored) : {}; } catch { /* */ }
    all[section] = data;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(all));

    // Try persisting to Appwrite (best-effort)
    try {
      const payload: Record<string, string> = {
        [section]: JSON.stringify(data),
      };
      try {
        await databases.updateDocument(databaseId, collections.platformSettings, 'settings', payload);
      } catch {
        // Document doesn't exist yet — create it
        await databases.createDocument(databaseId, collections.platformSettings, 'settings', payload);
      }
    } catch {
      // Collection may not exist — localStorage is our store
      console.warn('[Settings] Appwrite collection not available, using localStorage only');
    }
  },
};

// ============================================================
// Payments API (Admin)
// ============================================================
export const paymentsApi = {
  /**
   * Get aggregate transaction counts by type and a revenue summary.
   */
  getTransactionStats: async () => {
    const countFor = async (type?: string, status?: string) => {
      const q: string[] = [Query.limit(1)];
      if (type) q.push(Query.equal('type', type));
      if (status) q.push(Query.equal('status', status));
      const res = await databases.listDocuments(databaseId, collections.transactions, q);
      return res.total;
    };

    const [total, topUps, bookingPayments, earnings, withdrawals, refunds, completed] =
      await Promise.all([
        countFor(),
        countFor('TOP_UP'),
        countFor('BOOKING_DEBIT'),
        countFor('EARNING'),
        countFor('WITHDRAWAL'),
        countFor('REFUND'),
        countFor(undefined, 'COMPLETED'),
      ]);

    // Revenue: sum of platform_fee transactions (best-effort via listing recent)
    let totalRevenue = 0;
    try {
      const feeTxns = await databases.listDocuments(databaseId, collections.transactions, [
        Query.equal('type', 'PLATFORM_FEE'),
        Query.equal('status', 'COMPLETED'),
        Query.limit(5000),
      ]);
      totalRevenue = feeTxns.documents.reduce(
        (sum, d) => sum + (typeof d.amount === 'number' ? d.amount : 0),
        0,
      );
    } catch {
      // collection may not have PLATFORM_FEE rows yet
    }

    return { total, topUps, bookingPayments, earnings, withdrawals, refunds, completed, totalRevenue };
  },

  /**
   * List transactions with optional filters + pagination.
   */
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
  }) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    const queries: string[] = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];

    if (params?.type) queries.push(Query.equal('type', params.type));
    if (params?.status) queries.push(Query.equal('status', params.status));
    if (params?.search) queries.push(Query.search('description', params.search));

    const result = await databases.listDocuments(databaseId, collections.transactions, queries);

    return {
      success: true,
      transactions: result.documents.map((doc) => ({
        _id: doc.$id,
        userId: doc.userId ?? '',
        type: doc.type ?? '',
        amount: doc.amount ?? 0,
        status: doc.status ?? 'PENDING',
        bookingId: doc.bookingId ?? null,
        paymentMethod: doc.paymentMethod ?? null,
        description: doc.description ?? '',
        gatewayReference: doc.gatewayReference ?? null,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
      })),
      total: result.total,
    };
  },

  /**
   * List all wallets with optional pagination.
   */
  getWallets: async (params?: { page?: number; limit?: number; search?: string }) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    const queries: string[] = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$updatedAt'),
    ];

    if (params?.search) queries.push(Query.search('userId', params.search));

    const result = await databases.listDocuments(databaseId, collections.wallets, queries);

    return {
      success: true,
      wallets: result.documents.map((doc) => ({
        _id: doc.$id,
        userId: doc.userId ?? '',
        balance: doc.balance ?? 0,
        currency: doc.currency ?? 'PKR',
        status: doc.status ?? 'ACTIVE',
        lastTopUpAt: doc.lastTopUpAt ?? null,
        lastWithdrawalAt: doc.lastWithdrawalAt ?? null,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
      })),
      total: result.total,
    };
  },
};
