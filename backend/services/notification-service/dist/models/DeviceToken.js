import mongoose, { Schema } from 'mongoose';
const deviceTokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    token: {
        type: String,
        required: true,
    },
    platform: {
        type: String,
        enum: ['android', 'ios', 'web'],
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastUsed: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Compound index for user + token uniqueness
deviceTokenSchema.index({ user: 1, token: 1 }, { unique: true });
// Index for finding active tokens
deviceTokenSchema.index({ user: 1, isActive: 1 });
export const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);
//# sourceMappingURL=DeviceToken.js.map