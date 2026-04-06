import mongoose, { Document, Model } from 'mongoose';
import { OTPPurpose } from '../constants/index.js';
/**
 * OTP Document Interface
 */
export interface IOTP extends Document {
    _id: mongoose.Types.ObjectId;
    phone: string;
    code: string;
    purpose: OTPPurpose;
    attempts: number;
    isUsed: boolean;
    expiresAt: Date;
    createdAt: Date;
    verify(code: string): boolean;
    markAsUsed(): Promise<IOTP>;
    incrementAttempts(): Promise<IOTP>;
}
/**
 * OTP Model Interface
 */
export interface IOTPModel extends Model<IOTP> {
    createOTP(phone: string, purpose: OTPPurpose): Promise<IOTP>;
    findValidOTP(phone: string, purpose: OTPPurpose): Promise<IOTP | null>;
    invalidateOTPs(phone: string, purpose: OTPPurpose): Promise<void>;
}
/**
 * OTP Model
 */
export declare const OTP: IOTPModel;
export default OTP;
//# sourceMappingURL=OTP.d.ts.map