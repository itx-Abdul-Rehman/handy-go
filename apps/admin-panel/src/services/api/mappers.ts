/**
 * Helper mappers — convert flat Appwrite docs to the shape the
 * existing admin pages expect (matching the REST API responses).
 */
import type { AppwriteDocBase, Worker, WorkerStatus, Booking, BookingStatus } from '../../types';

export function mapWorkerDoc(doc: AppwriteDocBase): Worker {
  return {
    _id: (doc.$id || doc.userId) as string,
    firstName: (doc.firstName as string) ?? '',
    lastName: (doc.lastName as string) ?? '',
    profileImage: doc.profileImage as string | undefined,
    phone: (doc.phone as string) ?? '',
    cnic: (doc.cnic as string) ?? '',
    cnicVerified: (doc.cnicVerified as boolean) ?? false,
    skills: [], // Fetched from worker_skills collection if needed
    rating: {
      average: (doc.ratingAverage as number) ?? 0,
      count: (doc.ratingCount as number) ?? 0,
    },
    trustScore: (doc.trustScore as number) ?? 50,
    totalJobsCompleted: (doc.totalJobsCompleted as number) ?? 0,
    totalEarnings: (doc.totalEarnings as number) ?? 0,
    status: (doc.status as WorkerStatus) ?? 'PENDING_VERIFICATION',
    createdAt: doc.$createdAt,
  };
}

export function mapBookingDoc(doc: AppwriteDocBase): Booking {
  return {
    _id: doc.$id,
    bookingNumber: (doc.bookingNumber as string) ?? '',
    customer: {
      firstName: (doc.customerFirstName as string) ?? '',
      lastName: (doc.customerLastName as string) ?? '',
      phone: (doc.customerPhone as string) ?? '',
    },
    worker: doc.workerId
      ? {
          firstName: (doc.workerFirstName as string) ?? '',
          lastName: (doc.workerLastName as string) ?? '',
          phone: (doc.workerPhone as string) ?? '',
        }
      : undefined,
    serviceCategory: (doc.serviceCategory as string) ?? '',
    problemDescription: (doc.problemDescription as string) ?? '',
    address: {
      full: (doc.addressFull as string) ?? '',
      city: (doc.addressCity as string) ?? '',
    },
    scheduledDateTime: (doc.scheduledDateTime as string) ?? '',
    isUrgent: (doc.isUrgent as boolean) ?? false,
    status: (doc.status as BookingStatus) ?? 'PENDING',
    pricing: {
      estimatedPrice: (doc.estimatedPrice as number) ?? 0,
      finalPrice: (doc.finalPrice as number) ?? 0,
    },
    timeline: [],
    createdAt: doc.$createdAt,
  };
}
