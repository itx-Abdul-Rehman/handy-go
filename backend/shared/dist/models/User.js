import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../constants/index.js';
/**
 * User Schema
 */
const userSchema = new Schema({
    role: {
        type: String,
        enum: USER_ROLES,
        required: [true, 'User role is required'],
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false, // Don't include password by default in queries
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            const { password, __v, ...rest } = ret;
            return rest;
        },
    },
});
// Indexes - Note: phone and email indexes are created via schema options (unique/sparse)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
/**
 * Pre-save hook to hash password
 */
userSchema.pre('save', async function (next) {
    // Only hash password if it has been modified
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
/**
 * Method to compare passwords
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
/**
 * Static method to find user by phone
 */
userSchema.statics.findByPhone = function (phone) {
    return this.findOne({ phone }).select('+password');
};
/**
 * User Model
 */
export const User = mongoose.model('User', userSchema);
export default User;
//# sourceMappingURL=User.js.map