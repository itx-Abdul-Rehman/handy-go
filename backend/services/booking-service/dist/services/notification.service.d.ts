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
export declare const sendNotification: (payload: NotificationPayload) => Promise<boolean>;
export declare const notifyWorkerAssigned: (customerId: string, workerName: string, bookingNumber: string) => Promise<boolean>;
export declare const notifyWorkerAccepted: (customerId: string, workerName: string, bookingNumber: string, eta?: number) => Promise<boolean>;
export declare const notifyNewBookingRequest: (workerId: string, serviceCategory: string, bookingNumber: string) => Promise<boolean>;
export declare const notifyWorkerOnTheWay: (customerId: string, workerName: string, eta: number, bookingNumber: string) => Promise<boolean>;
export declare const notifyJobStarted: (customerId: string, serviceCategory: string, bookingNumber: string) => Promise<boolean>;
export declare const notifyJobCompleted: (customerId: string, finalPrice: number, bookingNumber: string) => Promise<boolean>;
export declare const notifyBookingCancelled: (recipientId: string, cancelledBy: string, bookingNumber: string) => Promise<boolean>;
export declare const notifyRatingReceived: (workerId: string, rating: number, bookingNumber: string) => Promise<boolean>;
export declare const notifyBookingReminder: (recipientId: string, bookingNumber: string, scheduledTime: string, isWorker: boolean) => Promise<boolean>;
declare const _default: {
    sendNotification: (payload: NotificationPayload) => Promise<boolean>;
    notifyWorkerAssigned: (customerId: string, workerName: string, bookingNumber: string) => Promise<boolean>;
    notifyWorkerAccepted: (customerId: string, workerName: string, bookingNumber: string, eta?: number) => Promise<boolean>;
    notifyNewBookingRequest: (workerId: string, serviceCategory: string, bookingNumber: string) => Promise<boolean>;
    notifyWorkerOnTheWay: (customerId: string, workerName: string, eta: number, bookingNumber: string) => Promise<boolean>;
    notifyJobStarted: (customerId: string, serviceCategory: string, bookingNumber: string) => Promise<boolean>;
    notifyJobCompleted: (customerId: string, finalPrice: number, bookingNumber: string) => Promise<boolean>;
    notifyBookingCancelled: (recipientId: string, cancelledBy: string, bookingNumber: string) => Promise<boolean>;
    notifyRatingReceived: (workerId: string, rating: number, bookingNumber: string) => Promise<boolean>;
    notifyBookingReminder: (recipientId: string, bookingNumber: string, scheduledTime: string, isWorker: boolean) => Promise<boolean>;
};
export default _default;
//# sourceMappingURL=notification.service.d.ts.map