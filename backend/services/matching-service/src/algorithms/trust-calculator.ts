import { Worker, Booking, Review, IWorker } from '@handy-go/shared';
import { config } from '../config/index.js';

export interface TrustScoreBreakdown {
  rating: number;
  completionRate: number;
  onTimeRate: number;
  complaints: number;
  accountAge: number;
  totalScore: number;
}

/**
 * Calculate trust score for a worker
 */
export const calculateTrustScore = async (workerId: string): Promise<{
  trustScore: number;
  breakdown: TrustScoreBreakdown;
}> => {
  const worker = await Worker.findById(workerId);
  if (!worker) {
    throw new Error('Worker not found');
  }

  const weights = config.trustScore.weights;
  const breakdown: TrustScoreBreakdown = {
    rating: 0,
    completionRate: 0,
    onTimeRate: 0,
    complaints: 0,
    accountAge: 0,
    totalScore: 0,
  };

  // 1. Rating Score (0-100)
  if (worker.rating.count > 0) {
    breakdown.rating = (worker.rating.average / 5) * 100;
  } else {
    breakdown.rating = 50; // Default for new workers
  }

  // 2. Completion Rate Score
  const bookingStats = await getBookingStats(workerId);
  if (bookingStats.totalAccepted > 0) {
    const completionRate = bookingStats.completed / bookingStats.totalAccepted;
    breakdown.completionRate = completionRate * 100;
  } else {
    breakdown.completionRate = 50; // Default for new workers
  }

  // 3. On-Time Rate Score
  if (bookingStats.completed > 0) {
    const onTimeRate = bookingStats.onTime / bookingStats.completed;
    breakdown.onTimeRate = onTimeRate * 100;
  } else {
    breakdown.onTimeRate = 50;
  }

  // 4. Complaints Score (inverse - fewer complaints = higher score)
  const complaintRate = bookingStats.completed > 0
    ? bookingStats.complaints / bookingStats.completed
    : 0;
  breakdown.complaints = Math.max(0, 100 - complaintRate * 200); // Each complaint reduces by 20%

  // 5. Account Age Score
  const accountAgeMonths = getAccountAgeMonths(worker.createdAt);
  breakdown.accountAge = Math.min(100, accountAgeMonths * 8); // Max score at ~12 months

  // Add verification bonus
  let verificationBonus = 0;
  if (worker.cnicVerified) verificationBonus += 5;
  if (worker.skills.every(s => s.isVerified)) verificationBonus += 5;

  // Calculate weighted total
  breakdown.totalScore = Math.round(
    breakdown.rating * weights.rating +
    breakdown.completionRate * weights.completionRate +
    breakdown.onTimeRate * weights.onTimeRate +
    breakdown.complaints * weights.complaints +
    breakdown.accountAge * weights.accountAge +
    verificationBonus
  );

  // Clamp between 0 and 100
  breakdown.totalScore = Math.max(0, Math.min(100, breakdown.totalScore));

  return {
    trustScore: breakdown.totalScore,
    breakdown,
  };
};

/**
 * Update trust score for a worker (call after booking completion or review)
 */
export const updateWorkerTrustScore = async (workerId: string): Promise<number> => {
  const { trustScore } = await calculateTrustScore(workerId);

  await Worker.findByIdAndUpdate(workerId, { trustScore });

  return trustScore;
};

/**
 * Batch update trust scores for all workers
 */
export const batchUpdateTrustScores = async (): Promise<number> => {
  const workers = await Worker.find({ status: 'ACTIVE' }).select('_id');

  let updated = 0;
  for (const worker of workers) {
    try {
      await updateWorkerTrustScore(worker._id.toString());
      updated++;
    } catch (error) {
      // Continue with next worker
    }
  }

  return updated;
};

/**
 * Get booking statistics for trust calculation
 */
const getBookingStats = async (workerId: string): Promise<{
  totalAccepted: number;
  completed: number;
  onTime: number;
  complaints: number;
}> => {
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const bookings = await Booking.find({
    worker: workerId,
    createdAt: { $gte: sixMonthsAgo },
    status: { $in: ['COMPLETED', 'CANCELLED'] },
  }).select('status actualDuration estimatedDuration cancellation rating');

  let completed = 0;
  let onTime = 0;
  let complaints = 0;
  const totalAccepted = bookings.length;

  for (const booking of bookings) {
    if (booking.status === 'COMPLETED') {
      completed++;

      // Check if completed within estimated time (+20% buffer)
      if (booking.actualDuration && booking.estimatedDuration) {
        if (booking.actualDuration <= booking.estimatedDuration * 1.2) {
          onTime++;
        }
      } else {
        onTime++; // Assume on-time if no duration data
      }

      // Check for low ratings as complaints
      if (booking.rating?.score && booking.rating.score <= 2) {
        complaints++;
      }
    } else if (booking.status === 'CANCELLED' && booking.cancellation?.cancelledBy === 'WORKER') {
      // Worker cancellations are negative
      complaints++;
    }
  }

  // Also count actual reviews with negative sentiment
  const negativeReviews = await Review.countDocuments({
    worker: workerId,
    createdAt: { $gte: sixMonthsAgo },
    rating: { $lte: 2 },
  });
  complaints += negativeReviews;

  return { totalAccepted, completed, onTime, complaints };
};

/**
 * Get account age in months
 */
const getAccountAgeMonths = (createdAt: Date): number => {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  return Math.floor(diffMs / (30 * 24 * 60 * 60 * 1000));
};

export default {
  calculateTrustScore,
  updateWorkerTrustScore,
  batchUpdateTrustScores,
};
