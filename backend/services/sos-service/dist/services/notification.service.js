import axios from 'axios';
import { logger } from '@handy-go/shared';
import { config } from '../config/index.js';
const notificationClient = axios.create({
    baseURL: config.notificationServiceUrl,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'x-service-key': config.serviceKey,
    },
});
/**
 * Send notification to a user
 */
export const sendNotification = async (recipientId, notification, channels = ['push', 'inapp']) => {
    try {
        await notificationClient.post('/api/notifications/send', {
            recipientId,
            ...notification,
            channels,
        });
        return true;
    }
    catch (error) {
        logger.error('Failed to send notification:', error);
        return false;
    }
};
/**
 * Send SOS alert to all admins
 */
export const sendSOSAlertToAdmins = async (adminIds, sosDetails) => {
    const notification = {
        type: 'SOS',
        title: `🚨 SOS Alert - ${sosDetails.priority}`,
        body: sosDetails.bookingNumber
            ? `Emergency reported for booking ${sosDetails.bookingNumber}. ${sosDetails.description.substring(0, 50)}...`
            : `Emergency reported: ${sosDetails.description.substring(0, 80)}...`,
        data: {
            sosId: sosDetails.sosId,
            priority: sosDetails.priority,
            ...(sosDetails.bookingNumber && { bookingNumber: sosDetails.bookingNumber }),
            ...(sosDetails.location && {
                lat: sosDetails.location.lat.toString(),
                lng: sosDetails.location.lng.toString(),
            }),
        },
    };
    // Send to all admins in parallel
    await Promise.allSettled(adminIds.map(adminId => sendNotification(adminId, notification, ['push', 'inapp', 'sms'])));
};
/**
 * Send SOS confirmation to the user who triggered it
 */
export const sendSOSConfirmation = async (userId, sosId, priority) => {
    await sendNotification(userId, {
        type: 'SOS',
        title: 'SOS Received',
        body: 'Your emergency has been received. Our team is being notified and will respond shortly.',
        data: { sosId, priority },
    });
};
/**
 * Send SOS resolved notification
 */
export const sendSOSResolved = async (userId, sosId, resolution) => {
    await sendNotification(userId, {
        type: 'SOS',
        title: 'Emergency Resolved',
        body: `Your emergency report has been resolved. ${resolution}`,
        data: { sosId },
    });
};
/**
 * Send escalation notification
 */
export const sendEscalationNotification = async (seniorAdminIds, sosDetails) => {
    const notification = {
        type: 'SOS',
        title: `⚠️ SOS Escalated to ${sosDetails.newPriority}`,
        body: `SOS ${sosDetails.sosId} escalated: ${sosDetails.escalationReason}`,
        data: {
            sosId: sosDetails.sosId,
            priority: sosDetails.newPriority,
        },
    };
    await Promise.allSettled(seniorAdminIds.map(adminId => sendNotification(adminId, notification, ['push', 'inapp', 'sms'])));
};
export default {
    sendNotification,
    sendSOSAlertToAdmins,
    sendSOSConfirmation,
    sendSOSResolved,
    sendEscalationNotification,
};
//# sourceMappingURL=notification.service.js.map