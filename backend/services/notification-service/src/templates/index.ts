export const NOTIFICATION_TEMPLATES = {
  // Booking Notifications
  BOOKING_CREATED: {
    title: 'New Booking Request',
    body: 'You have a new {{serviceCategory}} booking request',
    type: 'BOOKING',
  },
  WORKER_ASSIGNED: {
    title: 'Worker Assigned',
    body: '{{workerName}} has been assigned to your booking',
    type: 'BOOKING',
  },
  WORKER_ACCEPTED: {
    title: 'Booking Accepted',
    body: '{{workerName}} has accepted your booking',
    type: 'BOOKING',
  },
  WORKER_REJECTED: {
    title: 'Worker Unavailable',
    body: 'We are finding another worker for your booking',
    type: 'BOOKING',
  },
  WORKER_ARRIVING: {
    title: 'Worker On The Way',
    body: '{{workerName}} is arriving in {{eta}} minutes',
    type: 'BOOKING',
  },
  JOB_STARTED: {
    title: 'Job Started',
    body: 'Your {{serviceCategory}} job has started',
    type: 'BOOKING',
  },
  JOB_COMPLETED: {
    title: 'Job Completed',
    body: 'Your job is complete. Please rate your experience',
    type: 'BOOKING',
  },
  BOOKING_CANCELLED: {
    title: 'Booking Cancelled',
    body: 'Your booking has been cancelled',
    type: 'BOOKING',
  },
  BOOKING_REMINDER: {
    title: 'Upcoming Booking',
    body: 'Reminder: Your {{serviceCategory}} booking is scheduled for {{time}}',
    type: 'BOOKING',
  },

  // Worker-specific Notifications
  NEW_JOB_AVAILABLE: {
    title: 'New Job Available',
    body: 'New {{serviceCategory}} job near you. Tap to view details.',
    type: 'BOOKING',
  },
  JOB_TIMEOUT_WARNING: {
    title: 'Accept Job Soon',
    body: 'Your job request will expire in 2 minutes',
    type: 'BOOKING',
  },
  JOB_REASSIGNED: {
    title: 'Job Reassigned',
    body: 'The job has been reassigned to another worker',
    type: 'BOOKING',
  },

  // Payment Notifications
  PAYMENT_RECEIVED: {
    title: 'Payment Received',
    body: 'Payment of Rs. {{amount}} received for booking {{bookingNumber}}',
    type: 'PAYMENT',
  },
  PAYMENT_PENDING: {
    title: 'Payment Pending',
    body: 'Payment of Rs. {{amount}} is pending for your completed job',
    type: 'PAYMENT',
  },
  EARNINGS_TRANSFERRED: {
    title: 'Earnings Transferred',
    body: 'Rs. {{amount}} has been transferred to your bank account',
    type: 'PAYMENT',
  },

  // SOS Notifications
  SOS_ALERT: {
    title: '🚨 SOS Alert',
    body: 'Emergency reported for booking {{bookingNumber}}',
    type: 'SOS',
  },
  SOS_RESOLVED: {
    title: 'SOS Resolved',
    body: 'Your emergency report has been resolved',
    type: 'SOS',
  },

  // System Notifications
  PROFILE_VERIFIED: {
    title: 'Profile Verified',
    body: 'Your profile has been verified. You can now accept jobs.',
    type: 'SYSTEM',
  },
  ACCOUNT_SUSPENDED: {
    title: 'Account Suspended',
    body: 'Your account has been suspended. Contact support for help.',
    type: 'SYSTEM',
  },
  DOCUMENT_APPROVED: {
    title: 'Document Approved',
    body: 'Your {{documentType}} has been verified',
    type: 'SYSTEM',
  },
  DOCUMENT_REJECTED: {
    title: 'Document Rejected',
    body: 'Your {{documentType}} was rejected. Please resubmit.',
    type: 'SYSTEM',
  },

  // Promotional Notifications
  PROMO_CODE: {
    title: 'Special Offer!',
    body: '{{message}}',
    type: 'PROMOTION',
  },
  RATING_REQUEST: {
    title: 'Rate Your Experience',
    body: 'How was your recent {{serviceCategory}} service? Tap to rate.',
    type: 'SYSTEM',
  },
};

export type NotificationTemplateKey = keyof typeof NOTIFICATION_TEMPLATES;

/**
 * Render a notification template with variables
 */
export const renderTemplate = (
  templateKey: NotificationTemplateKey,
  variables: Record<string, string>
): { title: string; body: string; type: string } => {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Notification template not found: ${templateKey}`);
  }

  let title = template.title;
  let body = template.body;

  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    title = title.replace(new RegExp(`{{${key}}}`, 'g'), value);
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  return { title, body, type: template.type };
};

export default {
  NOTIFICATION_TEMPLATES,
  renderTemplate,
};
