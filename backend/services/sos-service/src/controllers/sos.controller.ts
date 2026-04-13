import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  successResponse,
  createdResponse,
  errorResponse,
  paginatedResponse,
  notFoundResponse,
  forbiddenResponse,
  asyncHandler,
  logger,
  SOS,
  Booking,
  User,
  Customer,
  Worker,
  USER_ROLES_OBJ,
  SOS_PRIORITY_OBJ,
  UserRole,
} from '@handy-go/shared';
import { assessPriority, detectPotentialFalseAlarm } from '../algorithms/priority-assessor.js';
import notificationService from '../services/notification.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Trigger SOS emergency
 * POST /api/sos/trigger
 */
export const triggerSOS = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { bookingId, reason, description, location, evidence } = req.body;

  // Determine user type
  const userType = userRole === USER_ROLES_OBJ.CUSTOMER ? 'CUSTOMER' : 'WORKER';

  // Get user's previous SOS history
  const previousSOSCount = await SOS.countDocuments({ 'initiatedBy.userId': userId });
  const validSOSCount = await SOS.countDocuments({
    'initiatedBy.userId': userId,
    status: { $in: ['RESOLVED', 'ESCALATED'] },
  });

  // AI priority assessment
  const assessment = assessPriority(description, {
    timeOfDay: new Date(),
    hasActiveBooking: !!bookingId,
    userHistory: { previousSOS: previousSOSCount, validSOS: validSOSCount },
  });

  // Check for potential false alarm
  let bookingContext;
  if (bookingId) {
    const booking = await Booking.findById(bookingId);
    if (booking) {
      bookingContext = {
        bookingStatus: booking.status,
        timeSinceBookingStart: booking.timeline.find(t => t.status === 'IN_PROGRESS')
          ? Math.floor((Date.now() - new Date(booking.timeline.find(t => t.status === 'IN_PROGRESS')!.timestamp).getTime()) / 60000)
          : undefined,
      };
    }
  }

  const falseAlarmCheck = detectPotentialFalseAlarm(description, bookingContext);

  // Create SOS record
  const sos = await SOS.create({
    booking: bookingId || undefined,
    initiatedBy: {
      userType,
      userId,
    },
    priority: assessment.priority,
    aiAssessedPriority: assessment.priority,
    reason,
    description,
    location: {
      type: 'Point',
      coordinates: [location.lng, location.lat],
    },
    evidence: evidence || {},
    status: 'ACTIVE',
    timeline: [
      {
        action: 'SOS_TRIGGERED',
        performedBy: userId,
        timestamp: new Date(),
      },
    ],
  });

  // Get all available admins
  const admins = await User.find({ role: USER_ROLES_OBJ.ADMIN, isActive: true }).select('_id');
  const adminIds = admins.map(a => a._id.toString());

  // Get booking details if available
  let bookingNumber;
  if (bookingId) {
    const booking = await Booking.findById(bookingId).select('bookingNumber');
    bookingNumber = booking?.bookingNumber;
  }

  // Send alerts to admins
  await notificationService.sendSOSAlertToAdmins(adminIds, {
    sosId: sos._id.toString(),
    bookingNumber,
    priority: assessment.priority,
    description,
    location,
  });

  // Send confirmation to user
  await notificationService.sendSOSConfirmation(
    userId,
    sos._id.toString(),
    assessment.priority
  );

  logger.info('SOS triggered', {
    sosId: sos._id,
    userId,
    priority: assessment.priority,
    potentialFalseAlarm: falseAlarmCheck.isSuspicious,
  });

  return createdResponse(
    res,
    {
      sosId: sos._id,
      priority: assessment.priority,
      assessmentReasons: assessment.reasons,
      isSuspiciousActivity: falseAlarmCheck.isSuspicious,
      emergencyContacts: {
        police: '15',
        ambulance: '115',
        helpline: '1166',
      },
    },
    'SOS triggered successfully. Help is on the way.'
  );
});

/**
 * Get SOS details
 * GET /api/sos/:sosId
 */
export const getSOSDetails = asyncHandler(async (req: Request, res: Response) => {
  const { sosId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const sos = await SOS.findById(sosId)
    .populate('booking', 'bookingNumber serviceCategory status')
    .populate('initiatedBy.userId', 'phone')
    .populate('assignedAdmin', 'phone');

  if (!sos) {
    return notFoundResponse(res, 'SOS not found');
  }

  // Check authorization - user can only see their own SOS, admins can see all
  if (userRole !== USER_ROLES_OBJ.ADMIN && sos.initiatedBy.userId.toString() !== userId) {
    return forbiddenResponse(res, 'Not authorized to view this SOS');
  }

  return successResponse(res, sos, 'SOS details retrieved');
});

/**
 * Update SOS with additional information
 * PUT /api/sos/:sosId/update
 */
export const updateSOS = asyncHandler(async (req: Request, res: Response) => {
  const { sosId } = req.params;
  const userId = req.user!.id;
  const { description, evidence } = req.body;

  const sos = await SOS.findOne({
    _id: sosId,
    'initiatedBy.userId': userId,
    status: 'ACTIVE',
  });

  if (!sos) {
    return notFoundResponse(res, 'SOS not found or not active');
  }

  // Update fields
  if (description) {
    sos.description = `${sos.description}\n\n[Update]: ${description}`;
  }

  if (evidence) {
    if (evidence.images) {
      sos.evidence.images = [...(sos.evidence.images || []), ...evidence.images];
    }
    if (evidence.audioRecording) {
      sos.evidence.audioRecording = evidence.audioRecording;
    }
  }

  // Add to timeline
  sos.timeline.push({
    action: 'SOS_UPDATED',
    performedBy: new mongoose.Types.ObjectId(userId),
    timestamp: new Date(),
  });

  await sos.save();

  return successResponse(res, sos, 'SOS updated successfully');
});

// ==================== Admin Endpoints ====================

/**
 * Get all active SOS sorted by priority
 * GET /api/sos/admin/active
 */
export const getActiveSOSList = asyncHandler(async (req: Request, res: Response) => {
  const { priority, page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const query: any = { status: 'ACTIVE' };
  if (priority) {
    query.priority = priority;
  }

  // Custom sort order for priority
  const priorityOrder: Record<string, number> = {
    [SOS_PRIORITY_OBJ.CRITICAL]: 0,
    [SOS_PRIORITY_OBJ.HIGH]: 1,
    [SOS_PRIORITY_OBJ.MEDIUM]: 2,
    [SOS_PRIORITY_OBJ.LOW]: 3,
  };

  const [sosList, total] = await Promise.all([
    SOS.find(query)
      .populate('booking', 'bookingNumber serviceCategory')
      .populate('initiatedBy.userId', 'phone')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    SOS.countDocuments(query),
  ]);

  // Sort by priority then by creation time
  const sortedList = sosList.sort((a, b) => {
    const priorityDiff = (priorityOrder[a.priority as string] ?? 3) -
                         (priorityOrder[b.priority as string] ?? 3);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return paginatedResponse(res, sortedList, pageNum, limitNum, total);
});

/**
 * Assign SOS to admin
 * POST /api/sos/admin/:sosId/assign
 */
export const assignSOS = asyncHandler(async (req: Request, res: Response) => {
  const { sosId } = req.params;
  const adminId = req.user!.id;

  const sos = await SOS.findOneAndUpdate(
    { _id: sosId, status: 'ACTIVE', assignedAdmin: { $exists: false } },
    {
      assignedAdmin: adminId,
      $push: {
        timeline: {
          action: 'ADMIN_ASSIGNED',
          performedBy: adminId,
          timestamp: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!sos) {
    return errorResponse(res, 'SOS not found, already resolved, or already assigned', 400);
  }

  logger.info('SOS assigned to admin', { sosId, adminId });

  return successResponse(res, sos, 'SOS assigned to you');
});

/**
 * Resolve SOS
 * POST /api/sos/admin/:sosId/resolve
 */
export const resolveSOS = asyncHandler(async (req: Request, res: Response) => {
  const sosId = req.params.sosId!;
  const adminId = req.user!.id;
  const { action, notes } = req.body;

  const sos = await SOS.findOne({ _id: sosId, status: 'ACTIVE' });

  if (!sos) {
    return notFoundResponse(res, 'SOS not found or already resolved');
  }

  // Update SOS
  sos.status = 'RESOLVED';
  sos.resolution = {
    action,
    resolvedBy: new mongoose.Types.ObjectId(adminId),
    resolvedAt: new Date(),
    notes,
  };
  sos.timeline.push({
    action: 'SOS_RESOLVED',
    performedBy: new mongoose.Types.ObjectId(adminId),
    timestamp: new Date(),
  });

  await sos.save();

  // Notify the user who triggered SOS
  await notificationService.sendSOSResolved(
    sos.initiatedBy.userId.toString(),
    sosId.toString(),
    action
  );

  logger.info('SOS resolved', { sosId, adminId, action });

  return successResponse(res, sos, 'SOS resolved successfully');
});

/**
 * Escalate SOS
 * POST /api/sos/admin/:sosId/escalate
 */
export const escalateSOS = asyncHandler(async (req: Request, res: Response) => {
  const sosId = req.params.sosId!;
  const adminId = req.user!.id;
  const { reason } = req.body;

  const sos = await SOS.findOne({ _id: sosId, status: 'ACTIVE' });

  if (!sos) {
    return notFoundResponse(res, 'SOS not found or already resolved');
  }

  // Determine new priority (escalate by one level)
  const priorityLevels = [SOS_PRIORITY_OBJ.LOW, SOS_PRIORITY_OBJ.MEDIUM, SOS_PRIORITY_OBJ.HIGH, SOS_PRIORITY_OBJ.CRITICAL];
  const currentIndex = priorityLevels.indexOf(sos.priority);
  const newPriority: string = (currentIndex < 3 && currentIndex >= 0 ? priorityLevels[currentIndex + 1] : undefined) ?? SOS_PRIORITY_OBJ.CRITICAL;

  const originalPriority = sos.priority;
  sos.priority = newPriority as typeof sos.priority;
  sos.status = 'ESCALATED';
  sos.timeline.push({
    action: `ESCALATED: ${reason}`,
    performedBy: new mongoose.Types.ObjectId(adminId),
    timestamp: new Date(),
  });

  await sos.save();

  // Notify senior admins (in a real system, you'd have a hierarchy)
  const seniorAdmins = await User.find({ role: USER_ROLES_OBJ.ADMIN, isActive: true }).select('_id');
  await notificationService.sendEscalationNotification(
    seniorAdmins.map(a => a._id.toString()),
    {
      sosId: sosId.toString(),
      originalPriority,
      newPriority,
      escalationReason: reason,
    }
  );

  logger.info('SOS escalated', { sosId, adminId, originalPriority, newPriority, reason });

  return successResponse(res, sos, 'SOS escalated successfully');
});

/**
 * Mark SOS as false alarm
 * POST /api/sos/admin/:sosId/false-alarm
 */
export const markFalseAlarm = asyncHandler(async (req: Request, res: Response) => {
  const { sosId } = req.params;
  const adminId = req.user!.id;
  const { reason, penalizeUser } = req.body;

  const sos = await SOS.findOne({ _id: sosId, status: { $in: ['ACTIVE', 'ESCALATED'] } });

  if (!sos) {
    return notFoundResponse(res, 'SOS not found or already resolved');
  }

  // Update SOS
  sos.status = 'FALSE_ALARM';
  sos.resolution = {
    action: `Marked as false alarm: ${reason}`,
    resolvedBy: new mongoose.Types.ObjectId(adminId),
    resolvedAt: new Date(),
    notes: penalizeUser ? 'User penalized for false alarm' : undefined,
  };
  sos.timeline.push({
    action: 'MARKED_FALSE_ALARM',
    performedBy: new mongoose.Types.ObjectId(adminId),
    timestamp: new Date(),
  });

  await sos.save();

  // TODO: If penalizeUser is true, update user's trust score or add warning

  logger.info('SOS marked as false alarm', { sosId, adminId, reason, penalizeUser });

  return successResponse(res, sos, 'SOS marked as false alarm');
});

/**
 * Get SOS statistics
 * GET /api/sos/admin/stats
 */
export const getSOSStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const dateFilter: any = {};
  if (startDate) {
    dateFilter.$gte = new Date(startDate as string);
  }
  if (endDate) {
    dateFilter.$lte = new Date(endDate as string);
  }

  const matchStage: any = {};
  if (Object.keys(dateFilter).length > 0) {
    matchStage.createdAt = dateFilter;
  }

  const [stats] = await SOS.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
        escalated: { $sum: { $cond: [{ $eq: ['$status', 'ESCALATED'] }, 1, 0] } },
        falseAlarms: { $sum: { $cond: [{ $eq: ['$status', 'FALSE_ALARM'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$priority', 'CRITICAL'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$priority', 'HIGH'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$priority', 'MEDIUM'] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ['$priority', 'LOW'] }, 1, 0] } },
      },
    },
  ]);

  // Calculate average response time for resolved SOS
  const responseTimeStats = await SOS.aggregate([
    {
      $match: {
        ...matchStage,
        status: 'RESOLVED',
        'resolution.resolvedAt': { $exists: true },
      },
    },
    {
      $project: {
        responseTime: {
          $divide: [
            { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
            60000, // Convert to minutes
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' },
      },
    },
  ]);

  return successResponse(
    res,
    {
      overview: stats || {
        total: 0,
        active: 0,
        resolved: 0,
        escalated: 0,
        falseAlarms: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      responseTime: responseTimeStats[0] || {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
      },
    },
    'SOS statistics retrieved'
  );
});
