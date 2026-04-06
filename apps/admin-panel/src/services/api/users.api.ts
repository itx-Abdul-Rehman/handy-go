/**
 * Users API — Customer & worker management for admin panel.
 */
import { Query } from 'appwrite';
import { databases, functions } from '../appwrite-client';
import { appwriteConfig } from '../appwrite-config';
import { mapWorkerDoc } from './mappers';

const { databaseId, collections, functions: fnIds } = appwriteConfig;

export const usersApi = {
  /** Paginated customer list */
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

    const result = await databases.listDocuments(databaseId, collections.customers, queries);
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

  /** Paginated worker list */
  getWorkers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
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
    if (params?.search) {
      queries.push(Query.search('firstName', params.search));
    }

    const result = await databases.listDocuments(databaseId, collections.workers, queries);
    return {
      success: true,
      workers: result.documents.map((doc) => mapWorkerDoc(doc)),
      total: result.total,
      page,
      limit,
    };
  },

  /** Workers awaiting admin verification */
  getPendingWorkers: async () => {
    const result = await databases.listDocuments(databaseId, collections.workers, [
      Query.equal('status', 'PENDING_VERIFICATION'),
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ]);
    return {
      success: true,
      workers: result.documents.map((doc) => mapWorkerDoc(doc)),
    };
  },

  /** Approve or reject a worker */
  verifyWorker: async (
    workerId: string,
    data: { status: string; notes?: string },
  ) => {
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

    return { success: true, worker: mapWorkerDoc(doc) };
  },

  /** Toggle active / suspended flag on any user */
  updateUserStatus: async (
    userId: string,
    data: { isActive: boolean; reason?: string },
  ) => {
    // Try updating worker document first
    try {
      await databases.updateDocument(databaseId, collections.workers, userId, {
        status: data.isActive ? 'ACTIVE' : 'SUSPENDED',
      });
    } catch {
      // Try customer
      try {
        await databases.updateDocument(databaseId, collections.customers, userId, {
          isActive: data.isActive,
        });
      } catch {
        throw new Error('User not found');
      }
    }
    return { success: true };
  },

  /** Aggregate stats for Workers page */
  getWorkerStats: async () => {
    const total = await databases.listDocuments(databaseId, collections.workers, [Query.limit(1)]);
    const active = await databases.listDocuments(databaseId, collections.workers, [
      Query.equal('status', 'ACTIVE'), Query.limit(1),
    ]);
    const pending = await databases.listDocuments(databaseId, collections.workers, [
      Query.equal('status', 'PENDING_VERIFICATION'), Query.limit(1),
    ]);
    const suspended = await databases.listDocuments(databaseId, collections.workers, [
      Query.equal('status', 'SUSPENDED'), Query.limit(1),
    ]);
    return { total: total.total, active: active.total, pending: pending.total, suspended: suspended.total };
  },

  /** Aggregate stats for Customers page */
  getCustomerStats: async () => {
    const total = await databases.listDocuments(databaseId, collections.customers, [Query.limit(1)]);

    // New this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const newThisMonth = await databases.listDocuments(databaseId, collections.customers, [
      Query.greaterThanEqual('$createdAt', startOfMonth),
      Query.limit(1),
    ]);

    // Total bookings across all customers
    const allBookings = await databases.listDocuments(databaseId, collections.bookings, [
      Query.limit(1),
    ]);

    // Active = total minus explicitly inactive
    const inactive = await databases.listDocuments(databaseId, collections.customers, [
      Query.equal('isActive', false),
      Query.limit(1),
    ]);

    return {
      total: total.total,
      active: total.total - inactive.total,
      totalBookings: allBookings.total,
      newThisMonth: newThisMonth.total,
    };
  },
};
