import { Worker, Booking } from '@handy-go/shared';
import { config } from '../config/index.js';
/**
 * Find and rank workers based on matching criteria
 */
export const findMatchingWorkers = async (criteria) => {
    const { serviceCategory, location, scheduledDateTime, isUrgent } = criteria;
    const maxDistance = config.matching.maxDistance;
    const minTrustScore = config.matching.minTrustScore;
    // Build the query to find eligible workers
    const baseQuery = {
        status: 'ACTIVE',
        'availability.isAvailable': true,
        trustScore: { $gte: minTrustScore },
        'skills.category': serviceCategory,
    };
    // Geospatial query to find workers within range
    const geoQuery = {
        ...baseQuery,
        currentLocation: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [location.lng, location.lat],
                },
                $maxDistance: maxDistance * 1000, // Convert km to meters
            },
        },
    };
    // Try geospatial query first
    let workers;
    try {
        workers = await Worker.find(geoQuery)
            .populate('user', 'isVerified')
            .limit(50); // Get more than needed for better filtering
    }
    catch (error) {
        // Fallback to non-geo query if index not available
        workers = await Worker.find(baseQuery)
            .populate('user', 'isVerified')
            .limit(50);
    }
    // Filter workers based on schedule availability
    const scheduledDate = new Date(scheduledDateTime);
    const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][scheduledDate.getDay()];
    const availableWorkers = workers.filter(worker => {
        // Check if worker has the skill
        const skill = worker.skills.find(s => s.category === serviceCategory);
        if (!skill || !skill.isVerified)
            return false;
        // Check schedule availability
        if (worker.availability.schedule && worker.availability.schedule.length > 0) {
            const daySchedule = worker.availability.schedule.find(s => s.day === dayOfWeek);
            if (daySchedule) {
                const scheduledTime = scheduledDate.getHours() * 60 + scheduledDate.getMinutes();
                const [startHour = 0, startMin = 0] = daySchedule.startTime.split(':').map(Number);
                const [endHour = 0, endMin = 0] = daySchedule.endTime.split(':').map(Number);
                const startTime = startHour * 60 + startMin;
                const endTime = endHour * 60 + endMin;
                if (scheduledTime < startTime || scheduledTime > endTime) {
                    return false;
                }
            }
        }
        return true;
    });
    // Calculate match scores and additional data for each worker
    const scoredWorkers = await Promise.all(availableWorkers.map(async (worker) => {
        const distance = calculateDistance(location.lat, location.lng, worker.currentLocation?.coordinates[1] || 0, worker.currentLocation?.coordinates[0] || 0);
        // Get current workload
        const activeBookings = await Booking.countDocuments({
            worker: worker._id,
            status: { $in: ['ACCEPTED', 'IN_PROGRESS'] },
        });
        const skill = worker.skills.find(s => s.category === serviceCategory);
        const matchScore = calculateMatchScore(worker, distance, activeBookings, isUrgent);
        const estimatedArrival = isUrgent
            ? Math.round(distance * 3) + 10 // ~3 mins per km + buffer
            : 0; // For scheduled bookings, ETA is not relevant
        return {
            workerId: worker._id.toString(),
            name: `${worker.firstName} ${worker.lastName}`,
            profileImage: worker.profileImage,
            rating: {
                average: worker.rating.average,
                count: worker.rating.count,
            },
            trustScore: worker.trustScore,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            estimatedArrival,
            matchScore,
            hourlyRate: skill.hourlyRate,
            experience: skill.experience,
        };
    }));
    // Sort by match score (highest first)
    const sortedWorkers = scoredWorkers
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, config.matching.resultsLimit);
    return {
        workers: sortedWorkers,
        totalAvailable: availableWorkers.length,
    };
};
/**
 * Calculate match score based on multiple factors
 */
const calculateMatchScore = (worker, distance, activeBookings, isUrgent) => {
    const weights = config.matching.weights;
    const maxDistance = config.matching.maxDistance;
    // Distance score (closer = better)
    const distanceScore = Math.max(0, 1 - distance / maxDistance);
    // Rating score
    const ratingScore = worker.rating.average / 5;
    // Trust score
    const trustScoreNormalized = worker.trustScore / 100;
    // Experience score (capped at 10 years)
    const experienceScore = Math.min(1, (worker.skills[0]?.experience || 0) / 10);
    // Workload score (fewer active bookings = better)
    const maxWorkload = 5;
    const workloadScore = Math.max(0, 1 - activeBookings / maxWorkload);
    // Calculate weighted score
    let score = weights.distance * distanceScore +
        weights.rating * ratingScore +
        weights.trustScore * trustScoreNormalized +
        weights.experience * experienceScore +
        weights.workload * workloadScore;
    // Boost for urgent requests if worker is very close
    if (isUrgent && distance < 5) {
        score *= 1.2;
    }
    // Bonus for highly rated workers
    if (worker.rating.average >= 4.5 && worker.rating.count >= 10) {
        score *= 1.1;
    }
    return Math.round(score * 100) / 100;
};
/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    if (lat2 === 0 && lng2 === 0) {
        return config.matching.maxDistance; // Return max if no location data
    }
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
};
/**
 * Auto-replace worker for a booking
 */
export const findReplacementWorker = async (bookingId, excludeWorkerIds) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        return { newWorkerId: null, success: false };
    }
    const { workers } = await findMatchingWorkers({
        serviceCategory: booking.serviceCategory,
        location: {
            lat: booking.address.coordinates.lat,
            lng: booking.address.coordinates.lng,
        },
        scheduledDateTime: booking.scheduledDateTime,
        isUrgent: booking.isUrgent,
    });
    // Filter out excluded workers
    const eligibleWorkers = workers.filter(w => !excludeWorkerIds.includes(w.workerId));
    if (eligibleWorkers.length === 0) {
        return { newWorkerId: null, success: false };
    }
    // Select best available worker
    const selectedWorker = eligibleWorkers[0];
    if (!selectedWorker) {
        return { newWorkerId: null, success: false };
    }
    // Update booking with new worker
    booking.worker = selectedWorker.workerId;
    booking.timeline.push({
        status: 'WORKER_REPLACED',
        timestamp: new Date(),
        note: `Auto-assigned to ${selectedWorker.name}`,
    });
    await booking.save();
    return { newWorkerId: selectedWorker.workerId, success: true };
};
export default {
    findMatchingWorkers,
    findReplacementWorker,
};
//# sourceMappingURL=worker-matcher.js.map