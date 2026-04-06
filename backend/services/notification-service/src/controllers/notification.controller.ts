import { Request, Response, NextFunction } from 'express';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  notFoundResponse,
  asyncHandler,
  logger,
  Notification,
} from '@handy-go/shared';
import { DeviceToken } from '../models/DeviceToken.js';
import fcmService from '../services/fcm.service.js';
import smsService from '../services/sms.service.js';
import emailService from '../services/email.service.js';
import { renderTemplate, NotificationTemplateKey } from '../templates/index.js';
import mongoose from 'mongoose';

// Extend Request to include user
interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

/**
 * Send notification to a single user
 * POST /api/notifications/send
 */
export const sendNotification = asyncHandler(async (req: Request, res: Response) => {
  const { recipientId, type, title, body, data, channels } = req.body;

  // Create in-app notification
  let inAppNotification = null;
  if (channels.includes('inapp')) {
    inAppNotification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      body,
      data,
    });
  }

  // Send push notification
  if (channels.includes('push')) {
    await fcmService.sendToUser(recipientId, { title, body, data });
  }

  // Send SMS (requires phone number in data)
  if (channels.includes('sms') && data?.phone) {
    await smsService.sendSMS(data.phone, `${title}: ${body}`);
  }

  // Send email (requires email in data)
  if (channels.includes('email') && data?.email) {
    await emailService.sendEmail({
      to: data.email,
      subject: title,
      text: body,
    });
  }

  logger.info(`Notification sent to user ${recipientId}`, { type, channels });

  return successResponse(res, { notificationId: inAppNotification?._id }, 'Notification sent successfully');
});

/**
 * Send templated notification
 * POST /api/notifications/send-templated
 */
export const sendTemplatedNotification = asyncHandler(async (req: Request, res: Response) => {
  const { recipientId, template, variables, channels, data } = req.body;

  // Render template
  const rendered = renderTemplate(template as NotificationTemplateKey, variables);

  // Create in-app notification
  let inAppNotification = null;
  if (channels.includes('inapp')) {
    inAppNotification = await Notification.create({
      recipient: recipientId,
      type: rendered.type,
      title: rendered.title,
      body: rendered.body,
      data,
    });
  }

  // Send push notification
  if (channels.includes('push')) {
    await fcmService.sendToUser(recipientId, {
      title: rendered.title,
      body: rendered.body,
      data,
    });
  }

  logger.info(`Templated notification sent to user ${recipientId}`, { template, channels });

  return successResponse(res, { notificationId: inAppNotification?._id }, 'Notification sent successfully');
});

/**
 * Send bulk notification to multiple users
 * POST /api/notifications/send-bulk
 */
export const sendBulkNotification = asyncHandler(async (req: Request, res: Response) => {
  const { recipientIds, type, title, body, data, channels } = req.body;

  // Create in-app notifications for all recipients
  if (channels.includes('inapp')) {
    const notifications = recipientIds.map((recipientId: string) => ({
      recipient: recipientId,
      type,
      title,
      body,
      data,
    }));
    await Notification.insertMany(notifications);
  }

  // Send push notifications
  if (channels.includes('push')) {
    // Get all device tokens for recipients
    const deviceTokens = await DeviceToken.find({
      user: { $in: recipientIds },
      isActive: true,
    }).select('token');

    const tokens = deviceTokens.map(dt => dt.token);
    if (tokens.length > 0) {
      await fcmService.sendToDevices(tokens, { title, body, data });
    }
  }

  logger.info(`Bulk notification sent to ${recipientIds.length} users`, { type, channels });

  return successResponse(res, { recipientCount: recipientIds.length }, 'Bulk notification sent successfully');
});

/**
 * Get user's notifications
 * GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const query: any = { recipient: userId };
  if (String(unreadOnly) === 'true') {
    query.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Notification.countDocuments(query),
  ]);

  return paginatedResponse(res, notifications, pageNum, limitNum, total);
});

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return successResponse(res, { count }, 'Unread count retrieved');
});

/**
 * Mark notification as read
 * PUT /api/notifications/:notificationId/read
 */
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { notificationId } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    return notFoundResponse(res, 'Notification not found');
  }

  return successResponse(res, notification, 'Notification marked as read');
});

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return successResponse(res, { updatedCount: result.modifiedCount }, 'All notifications marked as read');
});

/**
 * Register device token for push notifications
 * POST /api/notifications/register-device
 */
export const registerDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { deviceToken, platform } = req.body;

  // Upsert device token
  await DeviceToken.findOneAndUpdate(
    { user: userId, token: deviceToken },
    {
      user: userId,
      token: deviceToken,
      platform,
      isActive: true,
      lastUsed: new Date(),
    },
    { upsert: true, new: true }
  );

  logger.info(`Device registered for user ${userId}`, { platform });

  return successResponse(res, null, 'Device registered successfully');
});

/**
 * Unregister device token
 * DELETE /api/notifications/unregister-device
 */
export const unregisterDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { deviceToken } = req.body;

  await DeviceToken.findOneAndUpdate(
    { user: userId, token: deviceToken },
    { isActive: false }
  );

  logger.info(`Device unregistered for user ${userId}`);

  return successResponse(res, null, 'Device unregistered successfully');
});

/**
 * Delete a notification
 * DELETE /api/notifications/:notificationId
 */
export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { notificationId } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    return notFoundResponse(res, 'Notification not found');
  }

  return successResponse(res, null, 'Notification deleted successfully');
});
