import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IDeviceToken extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  platform: 'android' | 'ios' | 'web';
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
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
  },
  {
    timestamps: true,
  }
);

// Compound index for user + token uniqueness
deviceTokenSchema.index({ user: 1, token: 1 }, { unique: true });

// Index for finding active tokens
deviceTokenSchema.index({ user: 1, isActive: 1 });

export const DeviceToken: Model<IDeviceToken> = mongoose.model<IDeviceToken>('DeviceToken', deviceTokenSchema);
