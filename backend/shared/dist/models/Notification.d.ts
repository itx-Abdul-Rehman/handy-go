import mongoose, { Document, Model } from 'mongoose';
import { NotificationType } from '../constants/index.js';
/**
 * Notification Document Interface
 */
export interface INotification extends Document {
    _id: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    markAsRead(): Promise<INotification>;
}
/**
 * Notification Model Interface
 */
export interface INotificationModel extends Model<INotification> {
    getUnreadCount(recipientId: mongoose.Types.ObjectId | string): Promise<number>;
    markAllAsRead(recipientId: mongoose.Types.ObjectId | string): Promise<number>;
    getForRecipient(recipientId: mongoose.Types.ObjectId | string, options?: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
    }): Promise<INotification[]>;
}
/**
 * Notification Model
 */
export declare const Notification: INotificationModel;
export default Notification;
//# sourceMappingURL=Notification.d.ts.map