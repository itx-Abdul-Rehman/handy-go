/**
 * Payments API — Transaction & wallet management for admin panel.
 */
import { Query } from 'appwrite';
import { databases } from '../appwrite-client';
import { appwriteConfig } from '../appwrite-config';

const { databaseId, collections } = appwriteConfig;

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
