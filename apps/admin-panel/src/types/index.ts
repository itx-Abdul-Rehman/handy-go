/**
 * Shared TypeScript types for the Handy Go admin panel.
 *
 * All domain entities, API response shapes, and statistics interfaces
 * are defined here so that pages, API modules, and stores can import
 * from a single authoritative source.
 */

// ─── Appwrite document base ────────────────────────────────────────
export interface AppwriteDocBase {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  [key: string]: unknown;
}

// ─── Generic paginated wrapper ─────────────────────────────────────
export interface PaginatedResponse<T> {
  success: boolean;
  total: number;
  page?: number;
  limit?: number;
  data: T[];
}

// ─── Auth ──────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'CUSTOMER' | 'WORKER';

export interface User {
  _id: string;
  phone: string;
  email?: string;
  role: UserRole;
  name?: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ─── Customer ──────────────────────────────────────────────────────
export interface CustomerAddress {
  label: string;
  address: string;
  city: string;
  isDefault: boolean;
}

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  phone: string;
  email?: string;
  addresses: CustomerAddress[];
  totalBookings: number;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerStats {
  total: number;
  active: number;
  totalBookings: number;
  newThisMonth: number;
}

// ─── Worker ────────────────────────────────────────────────────────
export type WorkerStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface WorkerSkill {
  category: string;
  experience: number;
  hourlyRate: number;
  isVerified: boolean;
}

export interface Worker {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  phone: string;
  cnic: string;
  cnicVerified: boolean;
  skills: WorkerSkill[];
  rating: { average: number; count: number };
  trustScore: number;
  totalJobsCompleted: number;
  totalEarnings: number;
  status: WorkerStatus;
  createdAt: string;
}

export interface WorkerStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
}

// ─── Booking ───────────────────────────────────────────────────────
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface BookingTimelineEntry {
  status: string;
  timestamp: string;
  note?: string;
}

export interface Booking {
  _id: string;
  bookingNumber: string;
  customer: { firstName: string; lastName: string; phone: string };
  worker?: { firstName: string; lastName: string; phone: string };
  serviceCategory: string;
  problemDescription: string;
  address: { full: string; city: string };
  scheduledDateTime: string;
  isUrgent: boolean;
  status: BookingStatus;
  pricing: { estimatedPrice: number; finalPrice?: number };
  timeline: BookingTimelineEntry[];
  createdAt: string;
}

export interface BookingStatusCounts {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export interface BookingStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageRating: number;
  totalRevenue: number;
  categoryBreakdown: Record<string, number>;
  totalCustomers: number;
  activeWorkers: number;
  dailyBookings: Array<{ date: string; dayName: string; bookings: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  categoryDistribution: Array<{ name: string; value: number; color: string }>;
  recentBookings: Array<{ id: string; customer: string; service: string; status: string; amount: number }>;
}

// ─── SOS ───────────────────────────────────────────────────────────
export type SOSPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SOSStatus = 'ACTIVE' | 'RESOLVED' | 'ESCALATED' | 'FALSE_ALARM';

export interface SOS {
  _id: string;
  booking?: { bookingNumber: string; serviceCategory: string };
  initiatedBy: {
    userType: 'CUSTOMER' | 'WORKER';
    userId: string;
    name: string;
    phone: string;
  };
  priority: SOSPriority;
  aiAssessedPriority?: string;
  reason: string;
  description: string;
  location: {
    coordinates: [number, number];
    address?: string;
  };
  evidence: {
    images: string[];
    audioRecording?: string;
  };
  status: SOSStatus;
  assignedAdmin?: string;
  resolution?: {
    action: string;
    resolvedBy: string;
    resolvedAt: string;
    notes: string;
  } | null;
  createdAt: string;
}

// ─── Payment / Transaction ─────────────────────────────────────────
export type TransactionType =
  | 'TOP_UP'
  | 'BOOKING_DEBIT'
  | 'EARNING'
  | 'WITHDRAWAL'
  | 'REFUND'
  | 'PLATFORM_FEE';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  bookingId: string | null;
  paymentMethod: string | null;
  description: string;
  gatewayReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  _id: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'FROZEN';
  lastTopUpAt: string | null;
  lastWithdrawalAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionStats {
  total: number;
  topUps: number;
  bookingPayments: number;
  earnings: number;
  withdrawals: number;
  refunds: number;
  completed: number;
  totalRevenue: number;
}

// ─── Settings ──────────────────────────────────────────────────────
export interface GeneralSettings {
  appName: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  [key: string]: unknown;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  [key: string]: unknown;
}

export interface PlatformRateSettings {
  platformFeePercent: number;
  minBookingAmount: number;
  maxBookingAmount: number;
  [key: string]: unknown;
}

export interface SecuritySettings {
  maxLoginAttempts: number;
  otpExpiryMinutes: number;
  sessionTimeoutMinutes: number;
  [key: string]: unknown;
}

export interface PlatformSettings {
  general: GeneralSettings;
  notifications: NotificationSettings;
  platform: PlatformRateSettings;
  security: SecuritySettings;
}

// ─── Notification ──────────────────────────────────────────────────
export type NotificationType = 'BOOKING' | 'PAYMENT' | 'SOS' | 'SYSTEM' | 'PROMOTION';

export interface Notification {
  _id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
