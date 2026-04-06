import mongoose, { Document, Model } from 'mongoose';
export interface IDeviceToken extends Document {
    user: mongoose.Types.ObjectId;
    token: string;
    platform: 'android' | 'ios' | 'web';
    isActive: boolean;
    lastUsed: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DeviceToken: Model<IDeviceToken>;
//# sourceMappingURL=DeviceToken.d.ts.map