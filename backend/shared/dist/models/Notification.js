import mongoose, { Schema } from 'mongoose';
import { NOTIFICATION_TYPES } from '../constants/index.js';
/**
 * Notification Schema
 */
const notificationSchema = new Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required'],
    },
    type: {
        type: String,
        enum: NOTIFICATION_TYPES,
        required: [true, 'Notification type is required'],
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    body: {
        type: String,
        required: [true, 'Body is required'],
        trim: true,
        maxlength: [500, 'Body cannot exceed 500 characters'],
    },
    data: {
        type: Schema.Types.Mixed,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
        transform: (_doc, ret) => {
            const { __v, ...rest } = ret;
            return rest;
        },
    },
});
// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
// TTL index - automatically delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
/**
 * Method to mark notification as read
 */
notificationSchema.methods.markAsRead = async function () {
    if (!this.isRead) {
        this.isRead = true;
        this.readAt = new Date();
        await this.save();
    }
    return this;
};
/**
 * Static method to get unread count for a recipient
 */
notificationSchema.statics.getUnreadCount = function (recipientId) {
    return this.countDocuments({ recipient: recipientId, isRead: false });
};
/**
 * Static method to mark all notifications as read for a recipient
 */
notificationSchema.statics.markAllAsRead = async function (recipientId) {
    const result = await this.updateMany({ recipient: recipientId, isRead: false }, { isRead: true, readAt: new Date() });
    return result.modifiedCount;
};
/**
 * Static method to get notifications for a recipient with pagination
 */
notificationSchema.statics.getForRecipient = function (recipientId, options = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;
    const query = { recipient: recipientId };
    if (unreadOnly) {
        query.isRead = false;
    }
    return this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
};
/**
 * Notification Model
 */
export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
//# sourceMappingURL=Notification.js.map