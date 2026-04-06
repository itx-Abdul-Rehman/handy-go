/**
 * Handy Go — Email OTP Service (Appwrite Function)
 *
 * Sends email OTPs via Resend API and verifies them.
 * This is Approach B: custom function with full control over
 * email templates, rate limiting, and OTP lifecycle.
 *
 * Actions:
 *   send_otp     — Generate OTP, store in DB, send via Resend
 *   verify_otp   — Verify OTP code and create user session
 *   resend_otp   — Resend OTP (rate-limited)
 *
 * Environment variables (set in Appwrite Console > Function > Settings):
 *   RESEND_API_KEY   — Resend API key
 *   RESEND_FROM_EMAIL — Verified sender email (e.g. noreply@handygo.app)
 *   RESEND_FROM_NAME  — Sender display name (e.g. Handy Go)
 *
 * Runtime: Node.js 22
 * Timeout: 15 seconds
 */

import { Client, Databases, Users, Query, ID } from 'node-appwrite';
import { randomInt } from 'node:crypto';
import { Resend } from 'resend';

const DB_ID = 'handy_go_db';
const OTP_COLLECTION = 'email_otps';

// OTP settings
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export default async ({ req, res, log, error }) => {
  try {
    // Use server API key from env vars so the function can
    // read/write documents even when called by unauthenticated users.
    const apiKey = process.env.APPWRITE_API_KEY || req.headers['x-appwrite-key'] || '';
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(apiKey);

    const databases = new Databases(client);
    const users = new Users(client);
    const body = JSON.parse(req.body || '{}');
    const action = body.action;

    log(`Email OTP action: ${action}`);

    switch (action) {
      case 'send_otp':
        return res.json(await sendOTP(databases, users, body, log));

      case 'verify_otp':
        return res.json(await verifyOTP(databases, users, body, log));

      case 'resend_otp':
        return res.json(await resendOTP(databases, users, body, log));

      case 'reset_password':
        return res.json(await resetPassword(databases, users, body, log));

      case 'delete_account':
        return res.json(await deleteAccount(databases, users, body, log));

      default:
        return res.json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    error(`Email OTP error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
};

// ============================================================
// Generate and send OTP
// ============================================================
async function sendOTP(databases, users, { email, purpose }, log) {
  if (!email) {
    return { success: false, error: 'Email is required' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();

  // Check rate limit — no more than 1 OTP per RESEND_COOLDOWN_SECONDS
  try {
    const recentOTPs = await databases.listDocuments(DB_ID, OTP_COLLECTION, [
      Query.equal('email', normalizedEmail),
      Query.equal('purpose', purpose || 'REGISTRATION'),
      Query.greaterThan('createdAt', new Date(now.getTime() - RESEND_COOLDOWN_SECONDS * 1000).toISOString()),
    ]);

    if (recentOTPs.documents.length > 0) {
      return {
        success: false,
        error: `Please wait ${RESEND_COOLDOWN_SECONDS} seconds before requesting a new code`,
      };
    }
  } catch (e) {
    // Collection might not exist yet — continue
    log(`Rate limit check skipped: ${e.message}`);
  }

  // Invalidate any previous OTPs for this email + purpose
  try {
    const oldOTPs = await databases.listDocuments(DB_ID, OTP_COLLECTION, [
      Query.equal('email', normalizedEmail),
      Query.equal('purpose', purpose || 'REGISTRATION'),
      Query.equal('verified', false),
    ]);

    for (const doc of oldOTPs.documents) {
      await databases.deleteDocument(DB_ID, OTP_COLLECTION, doc.$id);
    }
  } catch (e) {
    log(`Old OTP cleanup skipped: ${e.message}`);
  }

  // Generate 6-digit OTP
  const otpCode = generateOTP(OTP_LENGTH);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Store OTP in database
  const otpDoc = await databases.createDocument(DB_ID, OTP_COLLECTION, ID.unique(), {
    email: normalizedEmail,
    code: otpCode,
    purpose: purpose || 'REGISTRATION',
    attempts: 0,
    verified: false,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  });

  // Send email via Resend API
  const emailSent = await sendResendEmail(normalizedEmail, otpCode, purpose || 'REGISTRATION', log);

  if (!emailSent) {
    // Delete the OTP doc if email failed
    await databases.deleteDocument(DB_ID, OTP_COLLECTION, otpDoc.$id);
    return { success: false, error: 'Failed to send email. Please try again.' };
  }

  log(`OTP sent to ${maskEmail(normalizedEmail)} for ${purpose}`);

  return {
    success: true,
    message: `Verification code sent to ${maskEmail(normalizedEmail)}`,
    otpId: otpDoc.$id,
    expiresAt: expiresAt.toISOString(),
  };
}

// ============================================================
// Verify OTP and create session
// ============================================================
async function verifyOTP(databases, users, { email, code, purpose }, log) {
  if (!email || !code) {
    return { success: false, error: 'Email and code are required' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();

  // Find the OTP document
  let otpDocs;
  try {
    otpDocs = await databases.listDocuments(DB_ID, OTP_COLLECTION, [
      Query.equal('email', normalizedEmail),
      Query.equal('purpose', purpose || 'REGISTRATION'),
      Query.equal('verified', false),
      Query.orderDesc('createdAt'),
      Query.limit(1),
    ]);
  } catch (e) {
    return { success: false, error: 'Invalid or expired verification code' };
  }

  if (otpDocs.documents.length === 0) {
    return { success: false, error: 'No pending verification found. Please request a new code.' };
  }

  const otpDoc = otpDocs.documents[0];

  // Check expiry
  if (new Date(otpDoc.expiresAt) < now) {
    await databases.deleteDocument(DB_ID, OTP_COLLECTION, otpDoc.$id);
    return { success: false, error: 'Verification code has expired. Please request a new one.' };
  }

  // Check max attempts
  if (otpDoc.attempts >= MAX_ATTEMPTS) {
    await databases.deleteDocument(DB_ID, OTP_COLLECTION, otpDoc.$id);
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  // Verify code
  if (otpDoc.code !== code.trim()) {
    // Increment attempts
    await databases.updateDocument(DB_ID, OTP_COLLECTION, otpDoc.$id, {
      attempts: otpDoc.attempts + 1,
    });
    const remaining = MAX_ATTEMPTS - otpDoc.attempts - 1;
    return {
      success: false,
      error: `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
    };
  }

  // Mark as verified
  await databases.updateDocument(DB_ID, OTP_COLLECTION, otpDoc.$id, {
    verified: true,
  });

  // Find or create user in Appwrite
  let userId;
  let isNewUser = true;

  try {
    // Check if user with this email exists
    const existingUsers = await users.list([
      Query.equal('email', normalizedEmail),
    ]);

    if (existingUsers.users.length > 0) {
      const existingUser = existingUsers.users[0];

      // If user is blocked/disabled (e.g., previously deleted their account),
      // fully remove them from Appwrite and treat as new user
      if (existingUser.status === false) {
        log(`Found blocked user ${existingUser.$id} — deleting to allow re-registration`);
        try {
          await users.delete(existingUser.$id);
        } catch (e) {
          log(`Failed to delete blocked user: ${e.message}`);
        }
        // Create fresh user
        const newUser = await users.create(
          ID.unique(),
          normalizedEmail,
          undefined,
          undefined,
          undefined,
        );
        userId = newUser.$id;
        isNewUser = true;
      } else {
        userId = existingUser.$id;
        isNewUser = false;

        // Check if they have a customer or worker profile
        try {
          const customerDocs = await databases.listDocuments(DB_ID, 'customers', [
            Query.equal('userId', userId),
          ]);
          if (customerDocs.documents.length === 0) {
            // Also check workers collection
            try {
              const workerDocs = await databases.listDocuments(DB_ID, 'workers', [
                Query.equal('userId', userId),
              ]);
              isNewUser = workerDocs.documents.length === 0;
            } catch (_) {
              isNewUser = true;
            }
          } else {
            isNewUser = false;
          }
        } catch (e) {
          // Collection may not exist
        }
      }
    } else {
      // Create new user
      const newUser = await users.create(
        ID.unique(),
        normalizedEmail,
        undefined, // phone
        undefined, // password (set during registration)
        undefined, // name (set during registration)
      );
      userId = newUser.$id;
      isNewUser = true;
    }
  } catch (e) {
    log(`User lookup/create error: ${e.message}`);
    return { success: false, error: 'Verification succeeded but session creation failed.' };
  }

  // Create a session token for the user
  let sessionToken;
  try {
    const token = await users.createToken(userId);
    sessionToken = token.secret;
  } catch (e) {
    log(`Token creation error: ${e.message}`);
    // Return success with userId so client can still proceed
    sessionToken = null;
  }

  // Cleanup the OTP document
  try {
    await databases.deleteDocument(DB_ID, OTP_COLLECTION, otpDoc.$id);
  } catch (e) {
    // Non-critical
  }

  log(`OTP verified for ${maskEmail(normalizedEmail)} — isNewUser: ${isNewUser}`);

  return {
    success: true,
    userId,
    isNewUser,
    sessionToken,
  };
}

// ============================================================
// Resend OTP (rate-limited)
// ============================================================
async function resendOTP(databases, users, { email, purpose }, log) {
  // Delegates to sendOTP which already handles rate limiting
  return sendOTP(databases, users, { email, purpose }, log);
}

// ============================================================
// Reset password (server-side — bypasses old password requirement)
// ============================================================
async function resetPassword(databases, users, { userId, newPassword }, log) {
  if (!userId) {
    return { success: false, error: 'userId is required' };
  }
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  try {
    await users.updatePassword(userId, newPassword);
    log(`Password reset for user ${userId}`);
    return { success: true, message: 'Password updated successfully' };
  } catch (e) {
    log(`Password reset failed for ${userId}: ${e.message}`);
    return { success: false, error: 'Failed to reset password. Please try again.' };
  }
}

// ============================================================
// Delete account (server-side — frees the email for reuse)
// ============================================================
async function deleteAccount(databases, users, { userId }, log) {
  if (!userId) {
    return { success: false, error: 'userId is required' };
  }

  try {
    // 1. Delete customer profile data
    try {
      const customerDocs = await databases.listDocuments(DB_ID, 'customers', [
        Query.equal('userId', userId),
      ]);
      for (const doc of customerDocs.documents) {
        // Delete addresses
        try {
          const addressDocs = await databases.listDocuments(DB_ID, 'customer_addresses', [
            Query.equal('customerId', doc.$id),
          ]);
          for (const addr of addressDocs.documents) {
            await databases.deleteDocument(DB_ID, 'customer_addresses', addr.$id);
          }
        } catch (e) {
          log(`Address cleanup: ${e.message}`);
        }
        await databases.deleteDocument(DB_ID, 'customers', doc.$id);
      }
    } catch (e) {
      log(`Customer cleanup: ${e.message}`);
    }

    // 2. Delete worker profile data
    try {
      const workerDocs = await databases.listDocuments(DB_ID, 'workers', [
        Query.equal('userId', userId),
      ]);
      for (const doc of workerDocs.documents) {
        // Delete skills
        try {
          const skillDocs = await databases.listDocuments(DB_ID, 'worker_skills', [
            Query.equal('workerId', doc.$id),
          ]);
          for (const skill of skillDocs.documents) {
            await databases.deleteDocument(DB_ID, 'worker_skills', skill.$id);
          }
        } catch (e) {
          log(`Skills cleanup: ${e.message}`);
        }
        // Delete schedule
        try {
          const scheduleDocs = await databases.listDocuments(DB_ID, 'worker_schedule', [
            Query.equal('workerId', doc.$id),
          ]);
          for (const sched of scheduleDocs.documents) {
            await databases.deleteDocument(DB_ID, 'worker_schedule', sched.$id);
          }
        } catch (e) {
          log(`Schedule cleanup: ${e.message}`);
        }
        await databases.deleteDocument(DB_ID, 'workers', doc.$id);
      }
    } catch (e) {
      log(`Worker cleanup: ${e.message}`);
    }

    // 3. Delete notifications
    try {
      const notifDocs = await databases.listDocuments(DB_ID, 'notifications', [
        Query.equal('recipientId', userId),
        Query.limit(100),
      ]);
      for (const doc of notifDocs.documents) {
        await databases.deleteDocument(DB_ID, 'notifications', doc.$id);
      }
    } catch (e) {
      log(`Notification cleanup: ${e.message}`);
    }

    // 4. Delete the Appwrite user account (frees the email)
    await users.delete(userId);

    log(`Account ${userId} fully deleted`);
    return { success: true, message: 'Account deleted successfully' };
  } catch (e) {
    log(`Delete account error: ${e.message}`);
    return { success: false, error: 'Failed to delete account. Please try again.' };
  }
}

// ============================================================
// Send email via Resend HTTP API
// ============================================================
async function sendResendEmail(email, otpCode, purpose, log) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const fromName = process.env.RESEND_FROM_NAME || 'Handy Go';

  if (!apiKey) {
    log('RESEND_API_KEY not configured');
    return false;
  }

  const subject = getEmailSubject(purpose);
  const htmlBody = getEmailHTML(otpCode, purpose);

  try {
    const resend = new Resend(apiKey);
    const { data, error: resendError } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject,
      html: htmlBody,
    });

    if (resendError) {
      log(`Resend SDK error: ${JSON.stringify(resendError)}`);
      return false;
    }

    log(`Resend email sent: ${data.id}`);
    return true;
  } catch (e) {
    log(`Resend SDK call failed: ${e.message}`);
    return false;
  }
}

// ============================================================
// Email templates
// ============================================================
function getEmailSubject(purpose) {
  switch (purpose) {
    case 'PASSWORD_RESET':
      return 'Reset Your Handy Go Password';
    case 'REGISTRATION':
      return 'Verify Your Handy Go Account';
    default:
      return 'Your Handy Go Verification Code';
  }
}

function getEmailHTML(otpCode, purpose) {
  const purposeText = purpose === 'PASSWORD_RESET'
    ? 'We received a request to reset your password.'
    : 'Welcome to Handy Go! Please verify your email address.';

  const actionText = purpose === 'PASSWORD_RESET'
    ? 'reset your password'
    : 'complete your registration';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Handy Go Verification</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" style="width:100%;max-width:480px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              <div style="width:56px;height:56px;border-radius:14px;background-color:#4F46E5;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:28px;color:#ffffff;font-weight:700;">H</span>
              </div>
              <h1 style="font-size:22px;color:#1a1a2e;margin:0 0 8px;">Handy Go</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="font-size:15px;color:#4a5568;line-height:1.6;margin:0 0 24px;">
                ${purposeText}
              </p>

              <p style="font-size:14px;color:#718096;margin:0 0 12px;text-align:center;">
                Your verification code is:
              </p>

              <!-- OTP Code -->
              <div style="text-align:center;margin:0 0 24px;">
                <div style="display:inline-block;padding:16px 32px;background-color:#f7f7ff;border:2px dashed #4F46E5;border-radius:12px;">
                  <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#4F46E5;font-family:'Courier New',monospace;">
                    ${otpCode}
                  </span>
                </div>
              </div>

              <p style="font-size:14px;color:#718096;line-height:1.6;margin:0 0 8px;text-align:center;">
                Enter this code in the app to ${actionText}.
              </p>

              <p style="font-size:13px;color:#a0aec0;text-align:center;margin:0;">
                This code expires in ${OTP_EXPIRY_MINUTES} minutes.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #edf2f7;margin:0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;text-align:center;">
              <p style="font-size:12px;color:#a0aec0;line-height:1.5;margin:0;">
                If you didn't request this code, please ignore this email.<br>
                &copy; ${new Date().getFullYear()} Handy Go. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ============================================================
// Helpers
// ============================================================
function generateOTP(length) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += String(randomInt(0, 10));
  }
  // Avoid leading zero for better UX
  if (otp[0] === '0') {
    otp = String(randomInt(1, 10)) + otp.slice(1);
  }
  return otp;
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}
