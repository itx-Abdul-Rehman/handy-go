import { Booking, Worker, asyncHandler, successResponse, errorResponse, notFoundResponse, paginatedResponse, HTTP_STATUS, DEFAULTS, } from '@handy-go/shared';
/**
 * Get all bookings (admin)
 * GET /api/bookings/admin
 */
export const getAllBookings = asyncHandler(async (req, res) => {
    const { status, serviceCategory, startDate, endDate, page = '1', limit = '20', } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), DEFAULTS.MAX_PAGINATION_LIMIT);
    const skip = (pageNum - 1) * limitNum;
    // Build filter
    const filter = {};
    if (status)
        filter.status = status;
    if (serviceCategory)
        filter.serviceCategory = serviceCategory;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    const [bookings, total] = await Promise.all([
        Booking.find(filter)
            .populate('customer', 'firstName lastName')
            .populate('worker', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum),
        Booking.countDocuments(filter),
    ]);
    return paginatedResponse(res, bookings, pageNum, limitNum, total, 'Bookings retrieved');
});
/**
 * Get booking statistics
 * GET /api/bookings/admin/stats
 */
export const getBookingStats = asyncHandler(async (req, res) => {
    const { period = 'week' } = req.query;
    // Calculate date range
    let startDate;
    const endDate = new Date();
    switch (period) {
        case 'day':
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'month':
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        default:
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
    }
    // Aggregate booking statistics
    const [stats] = await Booking.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                completedBookings: {
                    $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
                },
                cancelledBookings: {
                    $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] },
                },
                pendingBookings: {
                    $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] },
                },
                inProgressBookings: {
                    $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] },
                },
                totalRevenue: {
                    $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$pricing.finalPrice', 0] },
                },
                totalPlatformFees: {
                    $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$pricing.platformFee', 0] },
                },
                averageRating: { $avg: '$rating.score' },
            },
        },
    ]);
    // Category breakdown
    const categoryBreakdown = await Booking.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: '$serviceCategory',
                count: { $sum: 1 },
                revenue: {
                    $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$pricing.finalPrice', 0] },
                },
            },
        },
        {
            $sort: { count: -1 },
        },
    ]);
    // Daily breakdown
    const dailyBreakdown = await Booking.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                bookings: { $sum: 1 },
                completed: {
                    $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
                },
                revenue: {
                    $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$pricing.finalPrice', 0] },
                },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);
    return successResponse(res, {
        period,
        startDate,
        endDate,
        summary: stats || {
            totalBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            pendingBookings: 0,
            inProgressBookings: 0,
            totalRevenue: 0,
            totalPlatformFees: 0,
            averageRating: null,
        },
        categoryBreakdown,
        dailyBreakdown,
    }, 'Statistics retrieved');
});
/**
 * Update booking (admin)
 * PUT /api/bookings/admin/:bookingId
 */
export const updateBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { status, notes } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        return notFoundResponse(res, 'Booking not found');
    }
    // Update status if provided
    if (status) {
        booking.status = status;
        booking.timeline.push({
            status,
            timestamp: new Date(),
            note: notes || `Status updated to ${status} by admin`,
        });
    }
    await booking.save();
    return successResponse(res, booking, 'Booking updated successfully');
});
/**
 * Get booking by ID (admin)
 * GET /api/bookings/admin/:bookingId
 */
export const getBookingById = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
        .populate('customer')
        .populate('worker');
    if (!booking) {
        return notFoundResponse(res, 'Booking not found');
    }
    return successResponse(res, booking, 'Booking retrieved');
});
/**
 * Reassign worker to booking (admin)
 * PUT /api/bookings/admin/:bookingId/reassign
 */
export const reassignWorker = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { workerId, reason } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        return notFoundResponse(res, 'Booking not found');
    }
    if (!['PENDING', 'ACCEPTED'].includes(booking.status)) {
        return errorResponse(res, 'Booking cannot be reassigned in current status', HTTP_STATUS.BAD_REQUEST);
    }
    const newWorker = await Worker.findById(workerId);
    if (!newWorker || newWorker.status !== 'ACTIVE') {
        return errorResponse(res, 'Worker not found or not active', HTTP_STATUS.BAD_REQUEST);
    }
    const previousWorkerId = booking.worker;
    booking.worker = newWorker._id;
    booking.status = 'PENDING';
    booking.timeline.push({
        status: 'REASSIGNED',
        timestamp: new Date(),
        note: reason || 'Worker reassigned by admin',
    });
    await booking.save();
    return successResponse(res, booking, 'Worker reassigned successfully');
});
//# sourceMappingURL=admin.controller.js.map