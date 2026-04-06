/**
 * Handy Go — Booking Processor (Appwrite Function)
 *
 * Handles booking lifecycle events:
 *  - Auto-timeout for pending bookings (worker didn't respond in 5 min)
 *  - Worker auto-replacement
 *  - Booking reminders
 *  - Post-completion processing (update worker stats, trigger payment)
 *
 * Can be triggered by:
 *  1. Appwrite Event: databases.handy_go_db.collections.bookings.documents.*.update
 *  2. CRON schedule: every 1 minute (for timeout/reminders)
 *  3. Direct execution from client (action-based)
 *
 * Runtime: Node.js 20
 * Timeout: 30 seconds
 */

import { Client, Databases, Query, ID } from 'node-appwrite';

const DB_ID = 'handy_go_db';

export default async ({ req, res, log, error }) => {
  try {
    // Use server API key from env vars so the function can
    // read/write documents even when called by users.
    const apiKey = process.env.APPWRITE_API_KEY || req.headers['x-appwrite-key'] || '';
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(apiKey);

    const databases = new Databases(client);
    const body = JSON.parse(req.body || '{}');
    const action = body.action;

    // If triggered by an Appwrite event (document change)
    if (req.headers['x-appwrite-event']) {
      return res.json(await handleBookingEvent(databases, body, log));
    }

    log(`Booking processor action: ${action}`);

    switch (action) {
      case 'check_timeouts':
        return res.json(await checkTimeouts(databases, log));

      case 'send_reminders':
        return res.json(await sendReminders(databases, log));

      case 'complete_booking':
        return res.json(await completeBooking(databases, body, log));

      case 'generate_booking_number':
        return res.json(await generateBookingNumber(databases));

      default:
        return res.json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    error(`Booking processor error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
};

// ============================================================
// EVENT-DRIVEN: Handle booking document updates
// ============================================================
async function handleBookingEvent(databases, eventData, log) {
  const doc = eventData;
  if (!doc.$id) return { success: true, message: 'No document in event' };

  log(`Booking event for: ${doc.$id}, status: ${doc.status}`);

  // Check if the status actually changed by looking at the latest timeline entry.
  // This prevents duplicate timeline entries when non-status fields are updated
  // (e.g. location, price, worker assignment without status change).
  let statusChanged = true;
  try {
    const latestTimeline = await databases.listDocuments(DB_ID, 'booking_timeline', [
      Query.equal('bookingId', doc.$id),
      Query.orderDesc('$createdAt'),
      Query.limit(1),
    ]);
    if (latestTimeline.documents.length > 0) {
      statusChanged = latestTimeline.documents[0].status !== doc.status;
    }
  } catch {
    // If timeline query fails, assume status changed to be safe
    statusChanged = true;
  }

  if (!statusChanged) {
    log(`Skipping: status ${doc.status} unchanged for booking ${doc.$id}`);
    return { success: true, message: 'Status unchanged, skipped' };
  }

  // When booking transitions to COMPLETED, worker stats are updated by the
  // completeBooking() action which sets the status. We do NOT update stats
  // here to avoid double-incrementing totalJobsCompleted and totalEarnings.

  // Add timeline entry only when status actually changed
  await databases.createDocument(DB_ID, 'booking_timeline', ID.unique(), {
    bookingId: doc.$id,
    status: doc.status,
    note: `Status changed to ${doc.status}`,
    timestamp: new Date().toISOString(),
  });

  // ------------------------------------------------------------------
  // Send notification for status changes (non-blocking)
  // ------------------------------------------------------------------
  try {
    const statusNotifications = {
      ACCEPTED: {
        recipientId: doc.customerId,
        title: 'Booking Accepted',
        body: `A worker has accepted your ${doc.serviceCategory || ''} booking.`,
      },
      IN_PROGRESS: {
        recipientId: doc.customerId,
        title: 'Job Started',
        body: `Your ${doc.serviceCategory || ''} job is now in progress.`,
      },
      CANCELLED: [
        doc.customerId && {
          recipientId: doc.customerId,
          title: 'Booking Cancelled',
          body: `Your ${doc.serviceCategory || ''} booking has been cancelled.`,
        },
        doc.workerId && {
          recipientId: doc.workerId,
          title: 'Booking Cancelled',
          body: `The ${doc.serviceCategory || ''} booking has been cancelled.`,
        },
      ].filter(Boolean),
    };

    const entries = statusNotifications[doc.status];
    if (entries) {
      const list = Array.isArray(entries) ? entries : [entries];
      for (const entry of list) {
        await databases.createDocument(DB_ID, 'notifications', ID.unique(), {
          recipientId: entry.recipientId,
          type: 'BOOKING',
          title: entry.title,
          body: entry.body,
          data: JSON.stringify({ bookingId: doc.$id }),
          isRead: false,
        });
      }
    }
  } catch (notifErr) {
    log(`Warning: notification for status ${doc.status} failed: ${notifErr.message}`);
  }

  return { success: true };
}

// ============================================================
// CRON: Check for timed-out bookings
// ============================================================
async function checkTimeouts(databases, log) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  let processed = 0;

  try {
    // Find PENDING bookings with assigned worker, older than 5 minutes
    const pendingBookings = await databases.listDocuments(DB_ID, 'bookings', [
      Query.equal('status', 'PENDING'),
      Query.isNotNull('workerId'),
      Query.lessThan('$updatedAt', fiveMinutesAgo),
      Query.limit(50),
    ]);

    for (const booking of pendingBookings.documents) {
      log(`Timeout: booking ${booking.$id} (worker ${booking.workerId} didn't respond)`);

      // Remove worker and update status
      await databases.updateDocument(DB_ID, 'bookings', booking.$id, {
        workerId: null,
        status: 'PENDING',
      });

      // Add timeline entry
      await databases.createDocument(DB_ID, 'booking_timeline', ID.unique(), {
        bookingId: booking.$id,
        status: 'WORKER_TIMEOUT',
        note: 'Worker did not respond within 5 minutes. Re-matching...',
        timestamp: new Date().toISOString(),
      });

      processed++;
    }
  } catch (err) {
    log(`Timeout check error: ${err.message}`);
  }

  return { success: true, processed };
}

// ============================================================
// CRON: Send reminders for upcoming bookings
// ============================================================
async function sendReminders(databases, log) {
  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  let sent = 0;

  try {
    const upcomingBookings = await databases.listDocuments(DB_ID, 'bookings', [
      Query.equal('status', 'ACCEPTED'),
      Query.lessThan('scheduledDateTime', thirtyMinutesFromNow),
      Query.greaterThan('scheduledDateTime', now.toISOString()),
      Query.limit(50),
    ]);

    for (const booking of upcomingBookings.documents) {
      // Create reminder notification for both customer and worker
      for (const userId of [booking.customerId, booking.workerId].filter(Boolean)) {
        try {
          await databases.createDocument(DB_ID, 'notifications', ID.unique(), {
            recipientId: userId,
            type: 'BOOKING',
            title: 'Upcoming Booking Reminder',
            body: `Your ${booking.serviceCategory} booking is scheduled within 30 minutes.`,
            data: JSON.stringify({ bookingId: booking.$id }),
            isRead: false,
          });
          sent++;
        } catch { /* skip */ }
      }
    }
  } catch (err) {
    log(`Reminder error: ${err.message}`);
  }

  return { success: true, sent };
}

// ============================================================
// Complete booking and process worker stats
// ============================================================
async function completeBooking(databases, { bookingId, finalPrice, materialsCost, afterImages }, log) {
  if (!bookingId) return { error: 'bookingId required' };

  const booking = await databases.getDocument(DB_ID, 'bookings', bookingId);

  if (booking.status !== 'IN_PROGRESS') {
    return { error: `Cannot complete booking in status: ${booking.status}` };
  }

  // Calculate actual duration
  const startEntry = await databases.listDocuments(DB_ID, 'booking_timeline', [
    Query.equal('bookingId', bookingId),
    Query.equal('status', 'IN_PROGRESS'),
    Query.limit(1),
  ]);

  let actualDuration = null;
  if (startEntry.documents.length > 0) {
    const startTime = new Date(startEntry.documents[0].timestamp);
    actualDuration = Math.round((Date.now() - startTime.getTime()) / 60000); // minutes
  }

  // Calculate final pricing (use ?? to handle 0 correctly)
  const laborCost = finalPrice ?? booking.estimatedPrice ?? 0;
  const materials = materialsCost ?? 0;
  const platformFee = Math.round(laborCost * 0.10);
  const total = laborCost + materials + platformFee;

  // Update booking — only include actualDuration when it's a valid positive integer
  // (Appwrite integer column with min:0 rejects null)
  const now = new Date().toISOString();
  const updateData = {
    status: 'COMPLETED',
    finalPrice: total,
    laborCost,
    materialsCost: materials,
    platformFee,
    actualEndTime: now,
  };
  if (actualDuration !== null && Number.isFinite(actualDuration) && actualDuration >= 0) {
    updateData.actualDuration = actualDuration;
  }
  await databases.updateDocument(DB_ID, 'bookings', bookingId, updateData);

  // Note: after-images are uploaded and saved by the client app directly
  // to storage + booking_images collection before calling this function.

  // Update worker stats (non-blocking — don't fail the completion)
  try {
    if (booking.workerId) {
      await updateWorkerStats(databases, booking.workerId, { ...booking, finalPrice: total, actualDuration });
    }
  } catch (e) {
    log(`Warning: Failed to update worker stats: ${e.message}`);
  }

  // Notify customer (non-blocking — don't fail the completion)
  try {
    if (booking.customerId) {
      await databases.createDocument(DB_ID, 'notifications', ID.unique(), {
        recipientId: booking.customerId,
        type: 'BOOKING',
        title: 'Job Completed',
        body: `Your ${booking.serviceCategory} job is complete. Total: Rs. ${total}. Please rate your experience.`,
        data: JSON.stringify({ bookingId }),
        isRead: false,
      });
    }
  } catch (e) {
    log(`Warning: Failed to send completion notification: ${e.message}`);
  }

  log(`Booking ${bookingId} completed. Total: Rs. ${total}`);

  // ── Create payment transaction record ──────────────────────
  // Records the customer charge and worker credit in the transactions ledger.
  try {
    const paymentMethod = booking.paymentMethod || 'CASH';

    // Customer charge transaction
    await databases.createDocument(DB_ID, 'transactions', ID.unique(), {
      userId: booking.customerId,
      type: 'BOOKING_PAYMENT',
      amount: total,
      status: paymentMethod === 'CASH' ? 'COMPLETED' : 'PENDING',
      bookingId,
      paymentMethod,
      description: `Payment for ${booking.serviceCategory} service`,
    });

    // Worker earning credit (minus platform fee)
    const workerEarning = laborCost + materials; // platform fee excluded
    if (booking.workerId) {
      await databases.createDocument(DB_ID, 'transactions', ID.unique(), {
        userId: booking.workerId,
        type: 'EARNING',
        amount: workerEarning,
        status: 'COMPLETED',
        bookingId,
        paymentMethod,
        description: `Earning for ${booking.serviceCategory} job`,
      });
    }

    log(`Transactions created for booking ${bookingId}`);
  } catch (e) {
    log(`Warning: Failed to create transaction records: ${e.message}`);
  }

  return { success: true, finalPrice: total, actualDuration };
}

// ============================================================
// Update worker statistics after job completion
// ============================================================
async function updateWorkerStats(databases, workerId, booking) {
  try {
    const worker = await databases.getDocument(DB_ID, 'workers', workerId);
    const newTotal = (worker.totalJobsCompleted || 0) + 1;
    const newEarnings = (worker.totalEarnings || 0) + (booking.finalPrice || 0);

    await databases.updateDocument(DB_ID, 'workers', workerId, {
      totalJobsCompleted: newTotal,
      totalEarnings: newEarnings,
      isAvailable: true,   // Worker is free again after completing the job
      status: 'ACTIVE',    // Ensure status is ACTIVE (not BUSY)
    });
  } catch { /* skip if worker not found */ }
}

// ============================================================
// Generate unique booking number  HG-YYYYMMDD-XXXXX
// ============================================================
async function generateBookingNumber(databases) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  const bookingNumber = `HG-${dateStr}-${random}`;
  return { success: true, bookingNumber };
}
