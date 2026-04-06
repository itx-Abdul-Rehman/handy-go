/**
 * Handy Go — Trust Calculator (Appwrite Function)
 *
 * Calculates and updates worker trust scores based on:
 *  - Average rating (30%)
 *  - Job completion rate (25%)
 *  - On-time rate (20%)
 *  - Customer complaints (15% — negative)
 *  - Account age & verification (10%)
 *
 * Can be:
 *  1. Called after each review submission
 *  2. Run as a daily CRON to recalculate all workers
 *
 * Runtime: Node.js 20
 * Timeout: 60 seconds
 */

import { Client, Databases, Query } from 'node-appwrite';

const DB_ID = 'handy_go_db';

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      // Use server API key from env vars (prioritize over dynamic header JWT)
      .setKey(process.env.APPWRITE_API_KEY || req.headers['x-appwrite-key'] || '');

    const databases = new Databases(client);
    const body = JSON.parse(req.body || '{}');
    const action = body.action;

    log(`Trust calculator action: ${action}`);

    switch (action) {
      case 'calculate_single':
        return res.json(await calculateForWorker(databases, body.workerId, log));

      case 'recalculate_all':
        return res.json(await recalculateAll(databases, log));

      case 'update_rating':
        return res.json(await updateWorkerRating(databases, body, log));

      default:
        return res.json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    error(`Trust calculator error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
};

// ============================================================
// Calculate trust score for a single worker
// ============================================================
async function calculateForWorker(databases, workerId, log) {
  if (!workerId) return { error: 'workerId required' };

  const worker = await databases.getDocument(DB_ID, 'workers', workerId);

  // 1. Rating factor (30%) — normalized to 0-100
  const ratingScore = ((worker.ratingAverage || 0) / 5) * 100;

  // 2. Job completion rate (25%)
  const totalBookings = await databases.listDocuments(DB_ID, 'bookings', [
    Query.equal('workerId', workerId),
    Query.limit(1),
  ]);
  const completedBookings = await databases.listDocuments(DB_ID, 'bookings', [
    Query.equal('workerId', workerId),
    Query.equal('status', 'COMPLETED'),
    Query.limit(1),
  ]);
  const totalCount = totalBookings.total || 1;
  const completedCount = completedBookings.total || 0;
  const completionRate = (completedCount / totalCount) * 100;

  // 3. On-time rate (20%) — based on whether worker started within 30 min of scheduled time
  let onTimeRate = completionRate; // fallback to completion rate
  try {
    const completedJobs = await databases.listDocuments(DB_ID, 'bookings', [
      Query.equal('workerId', workerId),
      Query.equal('status', 'COMPLETED'),
      Query.isNotNull('scheduledDateTime'),
      Query.limit(100),
      Query.select(['scheduledDateTime', 'timeline']),
    ]);
    if (completedJobs.documents.length > 0) {
      let onTimeCount = 0;
      for (const job of completedJobs.documents) {
        const scheduled = new Date(job.scheduledDateTime).getTime();
        // Find IN_PROGRESS entry in timeline to get actual start
        let timeline = [];
        try { timeline = JSON.parse(job.timeline || '[]'); } catch { timeline = []; }
        if (Array.isArray(job.timeline)) timeline = job.timeline;
        const startEntry = (Array.isArray(timeline) ? timeline : []).find(e => e.status === 'IN_PROGRESS');
        if (startEntry) {
          const actual = new Date(startEntry.timestamp).getTime();
          if (actual - scheduled <= 30 * 60 * 1000) onTimeCount++; // within 30 min
        } else {
          onTimeCount++; // no timeline data, give benefit of the doubt
        }
      }
      onTimeRate = (onTimeCount / completedJobs.documents.length) * 100;
    }
  } catch (err) {
    log(`Warning: Could not calculate on-time rate for ${workerId}: ${err.message}`);
  }

  // 4. Customer complaints (15% — negative)
  // First, get all booking IDs for this worker, then find SOS alerts linked to those bookings
  let sosTotal = 0;
  try {
    const workerBookings = await databases.listDocuments(DB_ID, 'bookings', [
      Query.equal('workerId', workerId),
      Query.limit(5000),
      Query.select(['$id']),
    ]);
    if (workerBookings.documents.length > 0) {
      const bookingIds = workerBookings.documents.map(b => b.$id);
      // Check SOS alerts in batches of 100 (Appwrite query limit)
      for (let i = 0; i < bookingIds.length; i += 100) {
        const batch = bookingIds.slice(i, i + 100);
        const alerts = await databases.listDocuments(DB_ID, 'sos_alerts', [
          Query.equal('bookingId', batch),
          Query.limit(1),
        ]);
        sosTotal += alerts.total;
      }
    }
  } catch (err) {
    log(`Warning: Could not query SOS alerts for worker ${workerId}: ${err.message}`);
  }
  // Approximate: fewer SOS reports = better. 0 complaints = 100 score
  const complaintPenalty = Math.max(0, 100 - sosTotal * 20);

  // 5. Account age & verification (10%)
  const createdAt = new Date(worker.$createdAt);
  const accountAgeMonths = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const ageFactor = Math.min(accountAgeMonths * 10, 80); // Max 80 from age
  const verificationBonus = worker.cnicVerified ? 20 : 0;
  const ageVerificationScore = Math.min(ageFactor + verificationBonus, 100);

  // Weighted formula
  const trustScore = Math.round(
    ratingScore * 0.30 +
    completionRate * 0.25 +
    onTimeRate * 0.20 +
    complaintPenalty * 0.15 +
    ageVerificationScore * 0.10
  );

  // Clamp 0-100
  const finalScore = Math.max(0, Math.min(100, trustScore));

  // Update worker document
  await databases.updateDocument(DB_ID, 'workers', workerId, {
    trustScore: finalScore,
  });

  log(`Worker ${workerId}: trust score = ${finalScore} (rating=${ratingScore.toFixed(0)}, completion=${completionRate.toFixed(0)}, onTime=${onTimeRate.toFixed(0)}, complaints=${complaintPenalty.toFixed(0)}, ageVerify=${ageVerificationScore.toFixed(0)})`);

  return {
    success: true,
    data: {
      workerId,
      trustScore: finalScore,
      breakdown: {
        rating: Math.round(ratingScore),
        completionRate: Math.round(completionRate),
        onTimeRate: Math.round(onTimeRate),
        complaintScore: Math.round(complaintPenalty),
        ageVerification: Math.round(ageVerificationScore),
      },
    },
  };
}

// ============================================================
// Recalculate all workers (CRON job — daily)
// ============================================================
async function recalculateAll(databases, log) {
  let processed = 0;
  let offset = 0;
  const batchSize = 50;

  while (true) {
    const workers = await databases.listDocuments(DB_ID, 'workers', [
      Query.equal('status', 'ACTIVE'),
      Query.limit(batchSize),
      Query.offset(offset),
    ]);

    if (workers.documents.length === 0) break;

    for (const worker of workers.documents) {
      try {
        await calculateForWorker(databases, worker.$id, log);
        processed++;
      } catch (err) {
        log(`Error calculating trust for worker ${worker.$id}: ${err.message}`);
      }
    }

    offset += batchSize;
    if (workers.documents.length < batchSize) break;
  }

  log(`Recalculated trust scores for ${processed} workers`);
  return { success: true, processed };
}

// ============================================================
// Update worker rating after new review
// ============================================================
async function updateWorkerRating(databases, { workerId, newRating }, log) {
  if (!workerId || newRating == null) return { error: 'workerId and newRating required' };

  const worker = await databases.getDocument(DB_ID, 'workers', workerId);
  const currentCount = worker.ratingCount || 0;
  const currentAvg = worker.ratingAverage || 0;

  // Incremental average: newAvg = (oldAvg * count + newRating) / (count + 1)
  const newCount = currentCount + 1;
  const newAvg = ((currentAvg * currentCount) + newRating) / newCount;

  await databases.updateDocument(DB_ID, 'workers', workerId, {
    ratingAverage: Math.round(newAvg * 100) / 100, // 2 decimal places
    ratingCount: newCount,
  });

  log(`Worker ${workerId}: rating updated to ${newAvg.toFixed(2)} (${newCount} reviews)`);

  // Recalculate trust score
  await calculateForWorker(databases, workerId, log);

  return {
    success: true,
    data: { ratingAverage: Math.round(newAvg * 100) / 100, ratingCount: newCount },
  };
}
