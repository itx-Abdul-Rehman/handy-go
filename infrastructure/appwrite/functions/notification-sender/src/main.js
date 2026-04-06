/**
 * Handy Go — Notification Sender (Appwrite Function)
 *
 * Replaces: backend/services/notification-service/
 *
 * Sends push notifications via Appwrite Messaging and
 * creates in-app notification documents.
 *
 * Can be triggered by:
 *  1. Other functions (matching, booking, SOS)
 *  2. Document events on bookings/sos_alerts collections
 *
 * Runtime: Node.js 20
 * Timeout: 15 seconds
 */

import { Client, Databases, Messaging, Users, Query, ID } from 'node-appwrite';

const DB_ID = 'handy_go_db';

// Notification templates
const TEMPLATES = {
  booking_created: {
    title: 'New Booking Request',
    body: 'You have a new {{serviceCategory}} booking request.',
  },
  worker_assigned: {
    title: 'Worker Assigned',
    body: '{{workerName}} has been assigned to your booking.',
  },
  worker_accepted: {
    title: 'Booking Accepted',
    body: '{{workerName}} has accepted your booking.',
  },
  worker_arriving: {
    title: 'Worker On The Way',
    body: '{{workerName}} is arriving in {{eta}} minutes.',
  },
  job_started: {
    title: 'Job Started',
    body: 'Your {{serviceCategory}} job has started.',
  },
  job_completed: {
    title: 'Job Completed',
    body: 'Your job is complete. Please rate your experience.',
  },
  booking_cancelled: {
    title: 'Booking Cancelled',
    body: 'Your booking has been cancelled.',
  },
  sos_alert: {
    title: '🚨 SOS Alert',
    body: 'Emergency reported for booking {{bookingNumber}}.',
  },
  payment_received: {
    title: 'Payment Received',
    body: 'Payment of Rs. {{amount}} received.',
  },
  booking_reminder: {
    title: 'Upcoming Booking',
    body: 'Your {{serviceCategory}} booking is in {{minutes}} minutes.',
  },
  worker_verification: {
    title: 'Verification Update',
    body: 'Your account has been {{status}}.',
  },
};

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      // Use server API key from env vars (prioritize over dynamic header JWT)
      .setKey(process.env.APPWRITE_API_KEY || req.headers['x-appwrite-key'] || '');

    const databases = new Databases(client);
    const messaging = new Messaging(client);
    const users = new Users(client);
    const body = JSON.parse(req.body || '{}');
    const action = body.action;

    log(`Notification sender action: ${action}`);

    switch (action) {
      case 'send':
        return res.json(await sendNotification(databases, messaging, body, log));

      case 'send_template':
        return res.json(await sendFromTemplate(databases, messaging, body, log));

      case 'broadcast':
        return res.json(await broadcastNotification(databases, messaging, body, log));

      case 'register_device':
        return res.json(await registerDevice(users, body, req, log));

      case 'cleanup_old':
        return res.json(await cleanupOld(databases, log));

      default:
        return res.json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    error(`Notification sender error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
};

// ============================================================
// Send a custom notification
// ============================================================
async function sendNotification(databases, messaging, { recipientId, type, title, body, data }, log) {
  if (!recipientId || !title || !body) {
    return { error: 'recipientId, title, and body are required' };
  }

  // 1. Create in-app notification document (always works)
  const doc = await databases.createDocument(DB_ID, 'notifications', ID.unique(), {
    recipientId,
    type: type || 'SYSTEM',
    title,
    body,
    data: data ? JSON.stringify(data) : '{}',
    isRead: false,
  });

  log(`In-app notification sent to ${recipientId}: ${title}`);

  // 2. Try sending push notification via Appwrite Messaging
  //    This will work once an FCM provider is configured.
  //    Uses the user's targets (device tokens registered in Appwrite).
  try {
    await messaging.createPush(
      ID.unique(),        // messageId
      title,              // title
      body,               // body
      [],                 // topics
      [recipientId],      // users — Appwrite resolves to their push targets
      [],                 // targets
      data ? { payload: JSON.stringify(data) } : {}, // data
      'click',            // action
      undefined,          // image — must be undefined, not '' (Appwrite rejects empty string)
      undefined,          // icon
      'default',          // sound
      undefined,          // color
      undefined,          // tag
      undefined,          // badge
      false,              // draft = false => send immediately
    );
    log(`Push notification queued for ${recipientId}`);
  } catch (pushErr) {
    // Push may fail if no provider configured — that's OK, in-app still works
    log(`Push not sent (${pushErr.code || 'unknown'}): ${pushErr.message}`);
  }

  return { success: true, notificationId: doc.$id };
}

// ============================================================
// Send notification from template
// ============================================================
async function sendFromTemplate(databases, messaging, { recipientId, template, variables, type, extraData }, log) {
  const tmpl = TEMPLATES[template];
  if (!tmpl) return { error: `Unknown template: ${template}` };

  let title = tmpl.title;
  let body = tmpl.body;

  // Replace {{variables}}
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      title = title.replace(new RegExp(`{{${key}}}`, 'g'), value);
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
  }

  return sendNotification(databases, messaging, {
    recipientId,
    type: type || 'BOOKING',
    title,
    body,
    data: extraData,
  }, log);
}

// ============================================================
// Broadcast to multiple users
// ============================================================
async function broadcastNotification(databases, messaging, { recipientIds, type, title, body, data }, log) {
  if (!recipientIds || recipientIds.length === 0) {
    return { error: 'recipientIds array required' };
  }

  let sent = 0;
  const errors = [];

  for (const recipientId of recipientIds) {
    try {
      await sendNotification(databases, messaging, { recipientId, type, title, body, data }, log);
      sent++;
    } catch (err) {
      errors.push({ recipientId, error: err.message });
    }
  }

  return { success: true, sent, failed: errors.length, errors };
}

// ============================================================
// Register device push target (server-side backup)
// ============================================================
async function registerDevice(users, { deviceToken, platform, providerId }, req, log) {
  if (!deviceToken) {
    return { error: 'deviceToken is required' };
  }

  // Get calling user's ID from the request headers (set by Appwrite)
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) {
    return { error: 'User not authenticated' };
  }

  const fcmProviderId = providerId || process.env.FCM_PROVIDER_ID || 'fcm_provider';

  try {
    // List existing targets to avoid duplicates
    const user = await users.get(userId);
    const existingTargets = user.targets || [];
    const existingPush = existingTargets.find(
      (t) => t.providerType === 'push' && t.identifier === deviceToken
    );

    if (existingPush) {
      log(`Push target already exists for user ${userId}`);
      return { success: true, targetId: existingPush.$id, message: 'Already registered' };
    }

    // Create new push target
    const target = await users.createTarget(
      userId,
      ID.unique(),
      'push',
      deviceToken,
      fcmProviderId
    );

    log(`Push target created for user ${userId}: ${target.$id}`);
    return { success: true, targetId: target.$id };
  } catch (err) {
    log(`Register device error: ${err.message}`);
    return { error: err.message };
  }
}

// ============================================================
// Cleanup: remove old read notifications (> 30 days)
// ============================================================
async function cleanupOld(databases, log) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let deleted = 0;

  try {
    while (true) {
      const oldNotifications = await databases.listDocuments(DB_ID, 'notifications', [
        Query.equal('isRead', true),
        Query.lessThan('$createdAt', thirtyDaysAgo),
        Query.limit(100),
      ]);

      if (oldNotifications.documents.length === 0) break;

      for (const doc of oldNotifications.documents) {
        await databases.deleteDocument(DB_ID, 'notifications', doc.$id);
        deleted++;
      }
    }
  } catch (err) {
    log(`Cleanup error: ${err.message}`);
  }

  log(`Cleaned up ${deleted} old notifications`);
  return { success: true, deleted };
}
