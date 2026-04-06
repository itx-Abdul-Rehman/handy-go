import Joi from 'joi';
export const sendNotificationSchema = Joi.object({
    recipientId: Joi.string().required(),
    type: Joi.string().valid('BOOKING', 'PAYMENT', 'SOS', 'SYSTEM', 'PROMOTION').required(),
    title: Joi.string().required(),
    body: Joi.string().required(),
    data: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    channels: Joi.array().items(Joi.string().valid('push', 'sms', 'inapp', 'email')).default(['push', 'inapp']),
});
export const sendTemplatedNotificationSchema = Joi.object({
    recipientId: Joi.string().required(),
    template: Joi.string().required(),
    variables: Joi.object().pattern(Joi.string(), Joi.string()).default({}),
    channels: Joi.array().items(Joi.string().valid('push', 'sms', 'inapp', 'email')).default(['push', 'inapp']),
    data: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
});
export const sendBulkNotificationSchema = Joi.object({
    recipientIds: Joi.array().items(Joi.string()).min(1).required(),
    type: Joi.string().valid('BOOKING', 'PAYMENT', 'SOS', 'SYSTEM', 'PROMOTION').required(),
    title: Joi.string().required(),
    body: Joi.string().required(),
    data: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    channels: Joi.array().items(Joi.string().valid('push', 'sms', 'inapp', 'email')).default(['push', 'inapp']),
});
export const registerDeviceSchema = Joi.object({
    deviceToken: Joi.string().required(),
    platform: Joi.string().valid('android', 'ios', 'web').required(),
});
export const unregisterDeviceSchema = Joi.object({
    deviceToken: Joi.string().required(),
});
export const getNotificationsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    unreadOnly: Joi.boolean().default(false),
});
export const markReadSchema = Joi.object({
    notificationIds: Joi.array().items(Joi.string()).min(1).optional(),
});
//# sourceMappingURL=notification.validators.js.map