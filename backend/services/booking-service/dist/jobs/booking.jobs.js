import cron from 'node-cron';
import { Booking, logger, } from '@handy-go/shared';
import { config } from '../config/index.js';
import notificationService from '../services/notification.service.js';
import matchingService from '../services/matching.service.js';
/**
 * Initialize background jobs for the booking service
 */
export const initializeBackgroundJobs = () => {
    // Job 1: Check for booking timeouts (worker acceptance)
    // Runs every minute
    cron.schedule('* * * * *', async () => {
        try {
            const timeoutThreshold = new Date(Date.now() - config.booking.workerAcceptanceTimeout * 1000);
            // Find bookings where worker is assigned but not accepted within timeout
            const timedOutBookings = await Booking.find({
                status: 'PENDING',
                worker: { $exists: true, $ne: null },
                updatedAt: { $lt: timeoutThreshold },
            }).populate('worker', 'user firstName lastName')
                .populate('customer', 'user');
            for (const booking of timedOutBookings) {
                logger.info(`Booking ${booking.bookingNumber} timed out for worker acceptance`);
                const rejectedWorkerId = booking.worker?._id?.toString();
                // Remove current worker
                booking.worker = undefined;
                booking.timeline.push({
                    status: 'WORKER_TIMEOUT',
                    timestamp: new Date(),
                    note: 'Worker did not respond within time limit',
                });
                await booking.save();
                // Try to auto-replace
                if (rejectedWorkerId) {
                    const replacementResult = await matchingService.autoReplaceWorker(booking._id.toString(), [rejectedWorkerId]);
                    if (!replacementResult.success) {
                        // Notify customer
                        await notificationService.sendNotification({
                            recipientId: booking.customer.user.toString(),
                            type: 'BOOKING',
                            title: 'Worker Unavailable',
                            body: 'Your assigned worker did not respond. Please select another worker.',
                            data: { bookingNumber: booking.bookingNumber, action: 'SELECT_WORKER' },
                        });
                    }
                }
            }
        }
        catch (error) {
            logger.error('Error in booking timeout checker:', error);
        }
    });
    // Job 2: Send booking reminders
    // Runs every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            const reminderTime = new Date(Date.now() + config.booking.reminderBeforeMinutes * 60 * 1000);
            const reminderWindowStart = new Date(Date.now() + (config.booking.reminderBeforeMinutes - 5) * 60 * 1000);
            // Find bookings scheduled within reminder window that haven't been reminded
            const upcomingBookings = await Booking.find({
                status: 'ACCEPTED',
                scheduledDateTime: { $gte: reminderWindowStart, $lte: reminderTime },
                'timeline.status': { $ne: 'REMINDED' },
            })
                .populate('worker', 'user')
                .populate('customer', 'user');
            for (const booking of upcomingBookings) {
                const scheduledTime = booking.scheduledDateTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
                // Notify customer
                await notificationService.notifyBookingReminder(booking.customer.user.toString(), booking.bookingNumber, scheduledTime, false);
                // Notify worker
                if (booking.worker) {
                    await notificationService.notifyBookingReminder(booking.worker.user.toString(), booking.bookingNumber, scheduledTime, true);
                }
                // Mark as reminded
                booking.timeline.push({
                    status: 'REMINDED',
                    timestamp: new Date(),
                    note: 'Reminder sent',
                });
                await booking.save();
                logger.info(`Reminder sent for booking ${booking.bookingNumber}`);
            }
        }
        catch (error) {
            logger.error('Error in booking reminder job:', error);
        }
    });
    // Job 3: Auto-cancel stale pending bookings
    // Runs every hour
    cron.schedule('0 * * * *', async () => {
        try {
            const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
            // Find bookings that have been pending without a worker for too long
            const staleBookings = await Booking.find({
                status: 'PENDING',
                worker: { $exists: false },
                createdAt: { $lt: staleThreshold },
            }).populate('customer', 'user');
            for (const booking of staleBookings) {
                booking.status = 'CANCELLED';
                booking.cancellation = {
                    cancelledBy: 'SYSTEM',
                    reason: 'No worker available within 24 hours',
                    timestamp: new Date(),
                };
                booking.timeline.push({
                    status: 'CANCELLED',
                    timestamp: new Date(),
                    note: 'Auto-cancelled: No worker available',
                });
                await booking.save();
                // Notify customer
                await notificationService.sendNotification({
                    recipientId: booking.customer.user.toString(),
                    type: 'BOOKING',
                    title: 'Booking Cancelled',
                    body: 'Your booking was cancelled as no workers were available. Please try again.',
                    data: { bookingNumber: booking.bookingNumber },
                });
                logger.info(`Auto-cancelled stale booking ${booking.bookingNumber}`);
            }
        }
        catch (error) {
            logger.error('Error in stale booking cleanup:', error);
        }
    });
    logger.info('Background jobs initialized');
};
export default { initializeBackgroundJobs };
//# sourceMappingURL=booking.jobs.js.map