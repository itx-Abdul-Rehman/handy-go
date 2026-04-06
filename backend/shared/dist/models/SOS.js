import mongoose, { Schema } from 'mongoose';
import { SOS_PRIORITY, SOS_STATUS } from '../constants/index.js';
/**
 * SOS Location Sub-Schema
 */
const sosLocationSchema = new Schema({
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
    },
    coordinates: {
        type: [Number],
        required: true,
    },
}, { _id: false });
/**
 * SOS Timeline Entry Sub-Schema
 */
const sosTimelineEntrySchema = new Schema({
    action: {
        type: String,
        required: true,
    },
    performedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });
/**
 * SOS Schema
 */
const sosSchema = new Schema({
    booking: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
    },
    initiatedBy: {
        userType: {
            type: String,
            enum: ['CUSTOMER', 'WORKER'],
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    priority: {
        type: String,
        enum: SOS_PRIORITY,
        required: true,
        default: 'MEDIUM',
    },
    aiAssessedPriority: {
        type: String,
        enum: SOS_PRIORITY,
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
        trim: true,
        maxlength: [200, 'Reason cannot exceed 200 characters'],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    location: {
        type: sosLocationSchema,
        required: true,
        index: '2dsphere',
    },
    evidence: {
        images: {
            type: [String],
            default: [],
        },
        audioRecording: String,
    },
    status: {
        type: String,
        enum: SOS_STATUS,
        default: 'ACTIVE',
    },
    assignedAdmin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    resolution: {
        action: String,
        resolvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        resolvedAt: Date,
        notes: String,
    },
    timeline: {
        type: [sosTimelineEntrySchema],
        default: [],
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            const { __v, ...rest } = ret;
            return rest;
        },
    },
});
// Indexes - Note: location 2dsphere index is created via schema inline index
sosSchema.index({ status: 1, priority: -1 });
sosSchema.index({ 'initiatedBy.userId': 1 });
sosSchema.index({ assignedAdmin: 1, status: 1 });
/**
 * Pre-save hook to add initial timeline entry
 */
sosSchema.pre('save', function (next) {
    if (this.isNew) {
        this.timeline.push({
            action: 'SOS_CREATED',
            performedBy: this.initiatedBy.userId,
            timestamp: new Date(),
        });
    }
    next();
});
/**
 * Method to add timeline entry
 */
sosSchema.methods.addTimelineEntry = async function (action, performedBy) {
    this.timeline.push({
        action,
        performedBy,
        timestamp: new Date(),
    });
    return this.save();
};
/**
 * Method to resolve SOS
 */
sosSchema.methods.resolve = async function (action, resolvedBy, notes) {
    this.status = 'RESOLVED';
    this.resolution = {
        action,
        resolvedBy,
        resolvedAt: new Date(),
        notes,
    };
    this.timeline.push({
        action: 'SOS_RESOLVED',
        performedBy: resolvedBy,
        timestamp: new Date(),
    });
    return this.save();
};
/**
 * Method to escalate SOS
 */
sosSchema.methods.escalate = async function (performedBy) {
    this.status = 'ESCALATED';
    // Increase priority if not already critical
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const currentIndex = priorities.indexOf(this.priority);
    if (currentIndex < priorities.length - 1) {
        this.priority = priorities[currentIndex + 1];
    }
    this.timeline.push({
        action: 'SOS_ESCALATED',
        performedBy,
        timestamp: new Date(),
    });
    return this.save();
};
/**
 * Static method to get active SOS sorted by priority
 */
sosSchema.statics.getActiveSOSByPriority = function () {
    const priorityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
    return this.find({ status: { $in: ['ACTIVE', 'ESCALATED'] } })
        .populate('initiatedBy.userId', 'phone')
        .populate('booking')
        .populate('assignedAdmin', 'email')
        .sort({ priority: 1, createdAt: 1 });
};
/**
 * Static method to find SOS by booking ID
 */
sosSchema.statics.findByBookingId = function (bookingId) {
    return this.find({ booking: bookingId }).sort({ createdAt: -1 });
};
/**
 * SOS Model
 */
export const SOS = mongoose.model('SOS', sosSchema);
export default SOS;
//# sourceMappingURL=SOS.js.map