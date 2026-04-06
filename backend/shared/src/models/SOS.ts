import mongoose, { Document, Schema, Model } from 'mongoose';
import { SOS_PRIORITY, SOSPriority, SOS_STATUS, SOSStatus } from '../constants/index.js';

/**
 * Initiator Interface
 */
export interface IInitiator {
  userType: 'CUSTOMER' | 'WORKER';
  userId: mongoose.Types.ObjectId;
}

/**
 * Evidence Interface
 */
export interface IEvidence {
  images: string[];
  audioRecording?: string;
}

/**
 * Resolution Interface
 */
export interface IResolution {
  action: string;
  resolvedBy: mongoose.Types.ObjectId;
  resolvedAt: Date;
  notes?: string;
}

/**
 * SOS Timeline Entry Interface
 */
export interface ISOSTimelineEntry {
  action: string;
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
}

/**
 * GeoJSON Point Interface
 */
export interface ISOSLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * SOS Document Interface
 */
export interface ISOS extends Document {
  _id: mongoose.Types.ObjectId;
  booking?: mongoose.Types.ObjectId;
  initiatedBy: IInitiator;
  priority: SOSPriority;
  aiAssessedPriority?: SOSPriority;
  reason: string;
  description: string;
  location: ISOSLocation;
  evidence: IEvidence;
  status: SOSStatus;
  assignedAdmin?: mongoose.Types.ObjectId;
  resolution?: IResolution;
  timeline: ISOSTimelineEntry[];
  createdAt: Date;
  updatedAt: Date;

  // Methods
  addTimelineEntry(action: string, performedBy: mongoose.Types.ObjectId): Promise<ISOS>;
  resolve(
    action: string,
    resolvedBy: mongoose.Types.ObjectId,
    notes?: string
  ): Promise<ISOS>;
  escalate(performedBy: mongoose.Types.ObjectId): Promise<ISOS>;
}

/**
 * SOS Model Interface
 */
export interface ISOSModel extends Model<ISOS> {
  getActiveSOSByPriority(): Promise<ISOS[]>;
  findByBookingId(bookingId: mongoose.Types.ObjectId | string): Promise<ISOS[]>;
}

/**
 * SOS Location Sub-Schema
 */
const sosLocationSchema = new Schema<ISOSLocation>(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false }
);

/**
 * SOS Timeline Entry Sub-Schema
 */
const sosTimelineEntrySchema = new Schema<ISOSTimelineEntry>(
  {
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
  },
  { _id: false }
);

/**
 * SOS Schema
 */
const sosSchema = new Schema<ISOS, ISOSModel>(
  {
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
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const { __v, ...rest } = ret;
        return rest;
      },
    },
  }
);

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
sosSchema.methods.addTimelineEntry = async function (
  action: string,
  performedBy: mongoose.Types.ObjectId
): Promise<ISOS> {
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
sosSchema.methods.resolve = async function (
  action: string,
  resolvedBy: mongoose.Types.ObjectId,
  notes?: string
): Promise<ISOS> {
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
sosSchema.methods.escalate = async function (
  performedBy: mongoose.Types.ObjectId
): Promise<ISOS> {
  this.status = 'ESCALATED';
  // Increase priority if not already critical
  const priorities: SOSPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
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
sosSchema.statics.getActiveSOSByPriority = function (): Promise<ISOS[]> {
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
sosSchema.statics.findByBookingId = function (
  bookingId: mongoose.Types.ObjectId | string
): Promise<ISOS[]> {
  return this.find({ booking: bookingId }).sort({ createdAt: -1 });
};

/**
 * SOS Model
 */
export const SOS = mongoose.model<ISOS, ISOSModel>('SOS', sosSchema);

export default SOS;
