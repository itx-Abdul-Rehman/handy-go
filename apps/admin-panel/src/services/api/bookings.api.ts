/**
 * Bookings API — Booking management for admin panel.
 */
import { Query, ID } from 'appwrite';
import { databases } from '../appwrite-client';
import { appwriteConfig } from '../appwrite-config';
import { mapBookingDoc } from './mappers';

const { databaseId, collections } = appwriteConfig;

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
      bookings: result.documents.map((doc) => mapBookingDoc(doc)),
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

    return { success: true, booking: mapBookingDoc(doc) };
  },
};
