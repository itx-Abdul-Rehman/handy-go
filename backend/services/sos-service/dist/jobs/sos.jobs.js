import cron from 'node-cron';
import mongoose from 'mongoose';
import { logger, SOS, User, USER_ROLES_OBJ, SOS_PRIORITY_OBJ } from '@handy-go/shared';
import notificationService from '../services/notification.service.js';
/**
 * Auto-escalate unassigned SOS based on time and priority
 * Runs every 2 minutes
 */
export const startAutoEscalationJob = () => {
    cron.schedule('*/2 * * * *', async () => {
        try {
            logger.debug('Running SOS auto-escalation job...');
            const now = new Date();
            // Define escalation thresholds (in milliseconds)
            const escalationThresholds = {
                [SOS_PRIORITY_OBJ.CRITICAL]: 2 * 60 * 1000, // 2 minutes
                [SOS_PRIORITY_OBJ.HIGH]: 5 * 60 * 1000, // 5 minutes
                [SOS_PRIORITY_OBJ.MEDIUM]: 10 * 60 * 1000, // 10 minutes
                [SOS_PRIORITY_OBJ.LOW]: 15 * 60 * 1000, // 15 minutes
            };
            // Find unassigned active SOS
            const unassignedSOS = await SOS.find({
                status: 'ACTIVE',
                assignedAdmin: { $exists: false },
            });
            for (const sos of unassignedSOS) {
                const timeSinceCreation = now.getTime() - new Date(sos.createdAt).getTime();
                const threshold = escalationThresholds[sos.priority] ?? 15 * 60 * 1000;
                if (timeSinceCreation > threshold) {
                    // Escalate priority
                    const priorityLevels = [SOS_PRIORITY_OBJ.LOW, SOS_PRIORITY_OBJ.MEDIUM, SOS_PRIORITY_OBJ.HIGH, SOS_PRIORITY_OBJ.CRITICAL];
                    const currentIndex = priorityLevels.indexOf(sos.priority);
                    if (currentIndex < 3 && currentIndex >= 0) {
                        const newPriority = priorityLevels[currentIndex + 1] ?? SOS_PRIORITY_OBJ.CRITICAL;
                        const originalPriority = sos.priority;
                        await SOS.updateOne({ _id: sos._id }, {
                            $set: { priority: newPriority },
                            $push: {
                                timeline: {
                                    action: `AUTO_ESCALATED: No admin response within ${threshold / 60000} minutes`,
                                    performedBy: new mongoose.Types.ObjectId(), // System
                                    timestamp: now,
                                },
                            },
                        });
                        // Notify all admins about escalation
                        const admins = await User.find({ role: USER_ROLES_OBJ.ADMIN, isActive: true }).select('_id');
                        await notificationService.sendEscalationNotification(admins.map(a => a._id.toString()), {
                            sosId: sos._id.toString(),
                            originalPriority,
                            newPriority,
                            escalationReason: 'Auto-escalated due to no admin response',
                        });
                        logger.info('SOS auto-escalated', {
                            sosId: sos._id,
                            originalPriority,
                            newPriority,
                        });
                    }
                }
            }
        }
        catch (error) {
            logger.error('Error in SOS auto-escalation job:', error);
        }
    });
    logger.info('SOS auto-escalation job started');
};
/**
 * Send reminders for active SOS that haven't been resolved
 * Runs every 5 minutes
 */
export const startReminderJob = () => {
    cron.schedule('*/5 * * * *', async () => {
        try {
            logger.debug('Running SOS reminder job...');
            // Find critical and high priority SOS that are assigned but not resolved
            const activeHighPrioritySOS = await SOS.find({
                status: { $in: ['ACTIVE', 'ESCALATED'] },
                priority: { $in: [SOS_PRIORITY_OBJ.CRITICAL, SOS_PRIORITY_OBJ.HIGH] },
                assignedAdmin: { $exists: true },
                createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) }, // More than 5 minutes old
            }).populate('assignedAdmin', '_id');
            for (const sos of activeHighPrioritySOS) {
                if (sos.assignedAdmin) {
                    await notificationService.sendNotification(sos.assignedAdmin._id.toString(), {
                        type: 'SOS',
                        title: `⚠️ Pending ${sos.priority} SOS`,
                        body: `SOS ${sos._id} still active. Please resolve or escalate.`,
                        data: { sosId: sos._id.toString() },
                    }, ['push', 'inapp']);
                }
            }
        }
        catch (error) {
            logger.error('Error in SOS reminder job:', error);
        }
    });
    logger.info('SOS reminder job started');
};
/**
 * Generate daily SOS summary report
 * Runs at midnight every day
 */
export const startDailySummaryJob = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            logger.debug('Generating daily SOS summary...');
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const [summary] = await SOS.aggregate([
                {
                    $match: {
                        createdAt: { $gte: yesterday, $lt: today },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
                        escalated: { $sum: { $cond: [{ $eq: ['$status', 'ESCALATED'] }, 1, 0] } },
                        falseAlarms: { $sum: { $cond: [{ $eq: ['$status', 'FALSE_ALARM'] }, 1, 0] } },
                        stillActive: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
                        byPriority: {
                            $push: '$priority',
                        },
                    },
                },
            ]);
            if (summary) {
                logger.info('Daily SOS Summary', {
                    date: yesterday.toISOString().split('T')[0],
                    total: summary.total,
                    resolved: summary.resolved,
                    escalated: summary.escalated,
                    falseAlarms: summary.falseAlarms,
                    stillActive: summary.stillActive,
                });
                // TODO: Send summary email to admin team
            }
        }
        catch (error) {
            logger.error('Error generating daily SOS summary:', error);
        }
    });
    logger.info('Daily SOS summary job scheduled');
};
// Start all background jobs
export const startAllJobs = () => {
    startAutoEscalationJob();
    startReminderJob();
    startDailySummaryJob();
};
export default {
    startAllJobs,
    startAutoEscalationJob,
    startReminderJob,
    startDailySummaryJob,
};
//# sourceMappingURL=sos.jobs.js.map