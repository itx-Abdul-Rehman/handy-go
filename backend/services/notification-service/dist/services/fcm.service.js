import admin from 'firebase-admin';
import { logger } from '@handy-go/shared';
import { config } from '../config/index.js';
import { DeviceToken } from '../models/DeviceToken.js';
// Initialize Firebase Admin SDK
let firebaseInitialized = false;
const initializeFirebase = () => {
    if (firebaseInitialized)
        return;
    try {
        // Check if Firebase credentials are properly configured
        if (config.firebase.projectId &&
            config.firebase.privateKey &&
            config.firebase.clientEmail &&
            config.firebase.privateKey !== 'your-firebase-private-key' &&
            config.firebase.privateKey.includes('BEGIN PRIVATE KEY')) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: config.firebase.projectId,
                    privateKey: config.firebase.privateKey,
                    clientEmail: config.firebase.clientEmail,
                }),
            });
            firebaseInitialized = true;
            logger.info('Firebase Admin SDK initialized');
        }
        else {
            logger.warn('Firebase credentials not configured - push notifications disabled');
        }
    }
    catch (error) {
        logger.warn('Firebase initialization failed - push notifications disabled', { error });
    }
};
// Initialize on module load
initializeFirebase();
/**
 * Send push notification to a single device
 */
export const sendToDevice = async (token, payload) => {
    if (!firebaseInitialized) {
        logger.warn('Firebase not initialized, skipping push notification');
        return false;
    }
    try {
        const message = {
            token,
            notification: {
                title: payload.title,
                body: payload.body,
                imageUrl: payload.imageUrl,
            },
            data: payload.data,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'handy_go_notifications',
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };
        await admin.messaging().send(message);
        return true;
    }
    catch (error) {
        logger.error('FCM send error:', error);
        // Handle invalid token errors
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            // Mark token as inactive
            await DeviceToken.updateOne({ token }, { isActive: false });
        }
        return false;
    }
};
/**
 * Send push notification to multiple devices
 */
export const sendToDevices = async (tokens, payload) => {
    if (!firebaseInitialized || tokens.length === 0) {
        return { successCount: 0, failureCount: tokens.length };
    }
    try {
        const message = {
            tokens,
            notification: {
                title: payload.title,
                body: payload.body,
                imageUrl: payload.imageUrl,
            },
            data: payload.data,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'handy_go_notifications',
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };
        const response = await admin.messaging().sendEachForMulticast(message);
        // Handle failed tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const error = resp.error;
                    if (error?.code === 'messaging/invalid-registration-token' ||
                        error?.code === 'messaging/registration-token-not-registered') {
                        const token = tokens[idx];
                        if (token) {
                            failedTokens.push(token);
                        }
                    }
                }
            });
            // Mark failed tokens as inactive
            if (failedTokens.length > 0) {
                await DeviceToken.updateMany({ token: { $in: failedTokens } }, { isActive: false });
            }
        }
        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
        };
    }
    catch (error) {
        logger.error('FCM multicast error:', error);
        return { successCount: 0, failureCount: tokens.length };
    }
};
/**
 * Send push notification to a user (all their devices)
 */
export const sendToUser = async (userId, payload) => {
    // Get user's active device tokens
    const deviceTokens = await DeviceToken.find({
        user: userId,
        isActive: true,
    }).select('token');
    if (deviceTokens.length === 0) {
        logger.debug(`No active device tokens for user ${userId}`);
        return { successCount: 0, failureCount: 0 };
    }
    const tokens = deviceTokens.map(dt => dt.token);
    return sendToDevices(tokens, payload);
};
export default {
    sendToDevice,
    sendToDevices,
    sendToUser,
};
//# sourceMappingURL=fcm.service.js.map