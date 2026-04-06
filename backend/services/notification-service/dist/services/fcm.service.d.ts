export interface PushNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}
/**
 * Send push notification to a single device
 */
export declare const sendToDevice: (token: string, payload: PushNotificationPayload) => Promise<boolean>;
/**
 * Send push notification to multiple devices
 */
export declare const sendToDevices: (tokens: string[], payload: PushNotificationPayload) => Promise<{
    successCount: number;
    failureCount: number;
}>;
/**
 * Send push notification to a user (all their devices)
 */
export declare const sendToUser: (userId: string, payload: PushNotificationPayload) => Promise<{
    successCount: number;
    failureCount: number;
}>;
declare const _default: {
    sendToDevice: (token: string, payload: PushNotificationPayload) => Promise<boolean>;
    sendToDevices: (tokens: string[], payload: PushNotificationPayload) => Promise<{
        successCount: number;
        failureCount: number;
    }>;
    sendToUser: (userId: string, payload: PushNotificationPayload) => Promise<{
        successCount: number;
        failureCount: number;
    }>;
};
export default _default;
//# sourceMappingURL=fcm.service.d.ts.map