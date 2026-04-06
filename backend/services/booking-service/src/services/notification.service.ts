import axios from 'axios';
import { logger } from '@handy-go/shared';
import { config } from '../config/index.js';

const notificationClient = axios.create({
  baseURL: config.services.notification,
  timeout: 10000,
});

export type NotificationType = 'BOOKING' | 'PAYMENT' | 'SOS' | 'SYSTEM' | 'PROMOTION';
export type NotificationChannel = 'push' | 'sms' | 'inapp';

interface NotificationPayload {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
}

/**
 * Send notification to a user
 */
export const sendNotification = async (payload: NotificationPayload): Promise<boolean> => {
  try {
    await notificationClient.post('/api/notifications/send', {
      ...payload,
      channels: payload.channels || ['push', 'inapp'],
    });
    return true;
  } catch (error) {
    logger.error('Error sending notification:', error);
    return false;
  }
};

// Booking notification templates
export const notifyWorkerAssigned = async (
  customerId: string,
  workerName: string,
  bookingNumber: string
): Promise<boolean> => {
  return sendNotification({
    recipientId: customerId,
    type: 'BOOKING',
    title: 'Worker Assigned',
    body: `${workerName} has been assigned to your booking`,
    data: { bookingNumber, action: 'VIEW_BOOKING' },
  });
};

export const notifyWorkerAccepted = async (
  customerId: string,
  workerName: string,
  bookingNumber: string,
  eta?: number
): Promise<boolean> => {
  const etaText = eta ? ` ETA: ${eta} minutes.` : '';
  return sendNotification({
    recipientId: customerId,
    type: 'BOOKING',
    title: 'Booking Accepted',
    body: `${workerName} has accepted your booking.${etaText}`,
    data: { bookingNumber, action: 'TRACK_BOOKING' },
  });
};

export const notifyNewBookingRequest = async (
  workerId: string,
  serviceCategory: string,
  bookingNumber: string
): Promise<boolean> => {
  return sendNotification({
    recipientId: workerId,
    type: 'BOOKING',
    title: 'New Booking Request',
    body: `You have a new ${serviceCategory} booking request`,
    data: { bookingNumber, action: 'VIEW_BOOKING_REQUEST' },
    channels: ['push', 'sms', 'inapp'],
  });
};

export const notifyWorkerOnTheWay = async (
  customerId: string,
  workerName: string,
  eta: number,
  bookingNumber: string
): Promise<boolean> => {
  return sendNotification({
    recipientId: customerId,
    type: 'BOOKING',
    title: 'Worker On The Way',
    body: `${workerName} is arriving in ${eta} minutes`,
    data: { bookingNumber, action: 'TRACK_WORKER' },
  });
};

export const notifyJobStarted = async (
  customerId: string,
  serviceCategory: string,
  bookingNumber: string
): Promise<boolean> => {
  return sendNotification({
    recipientId: customerId,
    type: 'BOOKING',
    title: 'Job Started',
    body: `Your ${serviceCategory} job has started`,
    data: { bookingNumber, action: 'VIEW_BOOKING' },
  });
};

export const notifyJobCompleted = async (
  customerId: string,
  finalPrice: number,
  bookingNumber: string
): Promise<boolean> => {
  return sendNotification({
    recipientId: customerId,
    type: 'BOOKING',
    title: 'Job Completed',
    body: `Your job is complete. Total: Rs. ${finalPrice}. Please rate your experience.`,
    data: { bookingNumber, action: 'RATE_BOOKING' },
  });
};

export const notifyBookingCancelled = async (
  recipientId: string,
  cancelledBy: string,
  bookingNumber: string
): Promise<boolean> => {
  return sendNotification({
    recipientId,
    type: 'BOOKING',
    title: 'Booking Cancelled',
    body: `Your booking has been cancelled by ${cancelledBy}`,
    data: { bookingNumber },
  });
};

export const notifyRatingReceived = async (
  workerId: string,
  rating: number,
  bookingNumber: string
): Promise<boolean> => {
  return sendNotification({
    recipientId: workerId,
    type: 'BOOKING',
    title: 'New Rating Received',
    body: `You received a ${rating}-star rating. Keep up the good work!`,
    data: { bookingNumber },
  });
};

export const notifyBookingReminder = async (
  recipientId: string,
  bookingNumber: string,
  scheduledTime: string,
  isWorker: boolean
): Promise<boolean> => {
  return sendNotification({
    recipientId,
    type: 'BOOKING',
    title: 'Booking Reminder',
    body: isWorker
      ? `Reminder: You have a job scheduled at ${scheduledTime}`
      : `Reminder: Your service is scheduled at ${scheduledTime}`,
    data: { bookingNumber, action: 'VIEW_BOOKING' },
  });
};

export default {
  sendNotification,
  notifyWorkerAssigned,
  notifyWorkerAccepted,
  notifyNewBookingRequest,
  notifyWorkerOnTheWay,
  notifyJobStarted,
  notifyJobCompleted,
  notifyBookingCancelled,
  notifyRatingReceived,
  notifyBookingReminder,
};
