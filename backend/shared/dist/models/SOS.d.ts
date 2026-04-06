import mongoose, { Document, Model } from 'mongoose';
import { SOSPriority, SOSStatus } from '../constants/index.js';
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
    coordinates: [number, number];
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
    addTimelineEntry(action: string, performedBy: mongoose.Types.ObjectId): Promise<ISOS>;
    resolve(action: string, resolvedBy: mongoose.Types.ObjectId, notes?: string): Promise<ISOS>;
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
 * SOS Model
 */
export declare const SOS: ISOSModel;
export default SOS;
//# sourceMappingURL=SOS.d.ts.map