/**
 * Handy Go — SOS Analyzer (Appwrite Function)
 *
 * Replaces: backend/services/sos-service/
 *
 * Handles:
 *  - SOS alert creation with AI priority assessment
 *  - Escalation logic
 *  - Admin notification on high-priority alerts
 *
 * Runtime: Node.js 20
 * Timeout: 15 seconds
 */

import { Client, Databases, Query, ID } from 'node-appwrite';

const DB_ID = 'handy_go_db';

// Keywords for AI priority assessment
const CRITICAL_KEYWORDS = ['attack', 'violence', 'weapon', 'threat', 'blood', 'injury', 'police', 'ambulance', 'stabbed', 'death', 'kill', 'gun', 'hamla', 'khoon'];
const HIGH_KEYWORDS = ['harassment', 'aggressive', 'scared', 'unsafe', 'stolen', 'theft', 'assault', 'abuse', 'dhamki', 'dara', 'chori'];
const MEDIUM_KEYWORDS = ['dispute', 'argument', 'problem', 'issue', 'jhagra', 'masla'];

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

    log(`SOS analyzer action: ${action}`);

    switch (action) {
      case 'trigger':
        return res.json(await triggerSOS(databases, body, log));

      case 'assess_priority':
        return res.json(assessPriority(body));

      case 'escalate':
        return res.json(await escalateSOS(databases, body, log));

      case 'resolve':
        return res.json(await resolveSOS(databases, body, log));

      default:
        return res.json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    error(`SOS analyzer error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
};

// ============================================================
// TRIGGER: Create SOS alert with AI priority
// ============================================================
async function triggerSOS(databases, { bookingId, userId, userType, reason, description, location, evidence }, log) {
  // AI-assess priority
  const { priority, factors } = assessPriority({ description, reason });

  log(`SOS triggered by ${userType} ${userId} — Priority: ${priority}`);

  // Time-of-day factor: late night (10 PM - 6 AM) escalates
  const hour = new Date().getHours();
  let adjustedPriority = priority;
  if ((hour >= 22 || hour < 6) && priority === 'MEDIUM') {
    adjustedPriority = 'HIGH';
    factors.push('Late night — priority increased');
  }

  // Create SOS document
  const sosDoc = await databases.createDocument(DB_ID, 'sos_alerts', ID.unique(), {
    bookingId: bookingId || null,
    initiatedByUserId: userId,
    initiatedByType: userType,
    priority: adjustedPriority,
    aiAssessedPriority: adjustedPriority,
    reason: reason || '',
    description: description || '',
    latitude: location?.lat || null,
    longitude: location?.lng || null,
    status: 'ACTIVE',
    assignedAdminId: null,
    resolutionAction: null,
    resolvedById: null,
    resolvedAt: null,
    resolutionNotes: null,
  });

  // Notify all admins about CRITICAL and HIGH priority SOS
  if (['CRITICAL', 'HIGH'].includes(adjustedPriority)) {
    await notifyAdmins(databases, sosDoc, adjustedPriority);
  }

  return {
    success: true,
    data: {
      sosId: sosDoc.$id,
      priority: adjustedPriority,
      factors,
      message: adjustedPriority === 'CRITICAL'
        ? 'Emergency alert sent. Help is on the way. If in immediate danger, call 15 (police) or 1122 (rescue).'
        : 'Your SOS has been recorded. An admin will respond shortly.',
    },
  };
}

// ============================================================
// AI PRIORITY ASSESSMENT
// ============================================================
function assessPriority({ description, reason }) {
  const text = `${description || ''} ${reason || ''}`.toLowerCase();
  const factors = [];

  // Check critical keywords
  for (const keyword of CRITICAL_KEYWORDS) {
    if (text.includes(keyword)) {
      factors.push(`Critical keyword detected: "${keyword}"`);
      return { priority: 'CRITICAL', factors };
    }
  }

  // Check high keywords
  for (const keyword of HIGH_KEYWORDS) {
    if (text.includes(keyword)) {
      factors.push(`High-risk keyword detected: "${keyword}"`);
      return { priority: 'HIGH', factors };
    }
  }

  // Check medium keywords
  for (const keyword of MEDIUM_KEYWORDS) {
    if (text.includes(keyword)) {
      factors.push(`Issue keyword detected: "${keyword}"`);
      return { priority: 'MEDIUM', factors };
    }
  }

  // Default assessment
  factors.push('No specific risk keywords detected');
  return { priority: 'LOW', factors };
}

// ============================================================
// ESCALATE: Increase priority
// ============================================================
async function escalateSOS(databases, { sosId, reason, escalatedBy }, log) {
  if (!sosId) return { error: 'sosId required' };

  const sos = await databases.getDocument(DB_ID, 'sos_alerts', sosId);
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const currentIdx = priorities.indexOf(sos.priority);
  const newPriority = priorities[Math.min(currentIdx + 1, priorities.length - 1)];

  await databases.updateDocument(DB_ID, 'sos_alerts', sosId, {
    priority: newPriority,
    status: 'ESCALATED',
  });

  log(`SOS ${sosId} escalated from ${sos.priority} to ${newPriority}`);

  // Notify admins of escalation
  if (newPriority === 'CRITICAL') {
    await notifyAdmins(databases, { ...sos, $id: sosId }, newPriority);
  }

  return { success: true, newPriority };
}

// ============================================================
// RESOLVE: Close SOS alert
// ============================================================
async function resolveSOS(databases, { sosId, action, resolvedBy, notes }, log) {
  if (!sosId) return { error: 'sosId required' };

  await databases.updateDocument(DB_ID, 'sos_alerts', sosId, {
    status: 'RESOLVED',
    resolutionAction: action || '',
    resolvedById: resolvedBy || null,
    resolvedAt: new Date().toISOString(),
    resolutionNotes: notes || '',
  });

  // Notify the person who triggered the SOS
  const sos = await databases.getDocument(DB_ID, 'sos_alerts', sosId);
  if (sos.initiatedByUserId) {
    await databases.createDocument(DB_ID, 'notifications', ID.unique(), {
      recipientId: sos.initiatedByUserId,
      type: 'SOS',
      title: 'SOS Resolved',
      body: `Your emergency request has been resolved. Action: ${action || 'See details'}`,
      data: JSON.stringify({ sosId }),
      isRead: false,
    });
  }

  log(`SOS ${sosId} resolved by ${resolvedBy}`);
  return { success: true };
}

// ============================================================
// Notify all admin users
// ============================================================
async function notifyAdmins(databases, sosDoc, priority) {
  // Query all admin users and send each a notification
  try {
    const adminUsers = await databases.listDocuments(DB_ID, 'users', [
      Query.equal('role', 'ADMIN'),
      Query.equal('isActive', true),
      Query.limit(50),
    ]);

    const title = `🚨 ${priority} SOS Alert`;
    const body = `SOS reported${sosDoc.bookingId ? ` for booking ${sosDoc.bookingId}` : ''}. Reason: ${sosDoc.reason || 'N/A'}`;
    const data = JSON.stringify({ sosId: sosDoc.$id, priority, bookingId: sosDoc.bookingId });

    for (const admin of adminUsers.documents) {
      try {
        await databases.createDocument(DB_ID, 'notifications', ID.unique(), {
          recipientId: admin.$id,
          type: 'SOS',
          title,
          body,
          data,
          isRead: false,
        });
      } catch (err) {
        // Individual admin notification failed — continue with others
      }
    }
  } catch (err) {
    // Admin query failed — log but don't crash
  }
}
