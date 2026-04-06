import mongoose, { Document, Model } from 'mongoose';
import { UserRole } from '../constants/index.js';
/**
 * User Document Interface
 */
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    role: UserRole;
    phone: string;
    email?: string;
    password: string;
    isVerified: boolean;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
/**
 * User Model Interface (for statics)
 */
export interface IUserModel extends Model<IUser> {
    findByPhone(phone: string): Promise<IUser | null>;
}
/**
 * User Model
 */
export declare const User: IUserModel;
export default User;
//# sourceMappingURL=User.d.ts.map