import twilio from 'twilio';
import { logger } from '@handy-go/shared';
import { config } from '../config/index.js';

// Initialize Twilio client
let twilioClient: twilio.Twilio | null = null;

const initializeTwilio = () => {
  try {
    // Only initialize if credentials are valid (SID starts with AC)
    if (config.twilio.accountSid &&
        config.twilio.authToken &&
        config.twilio.accountSid.startsWith('AC')) {
      twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
      logger.info('Twilio client initialized');
    } else {
      logger.warn('Twilio credentials not configured - SMS notifications disabled');
    }
  } catch (error) {
    logger.warn('Twilio initialization failed - SMS notifications disabled');
  }
};

// Initialize on module load
initializeTwilio();

/**
 * Send SMS to a phone number
 */
export const sendSMS = async (
  to: string,
  message: string
): Promise<boolean> => {
  if (!twilioClient) {
    logger.warn('Twilio not initialized, skipping SMS');
    return false;
  }

  try {
    // Ensure phone number has country code
    const formattedPhone = to.startsWith('+') ? to : `+92${to.replace(/^0/, '')}`;

    await twilioClient.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: formattedPhone,
    });

    logger.info(`SMS sent to ${formattedPhone}`);
    return true;
  } catch (error) {
    logger.error('Twilio SMS error:', error);
    return false;
  }
};

/**
 * Send SMS notification based on template
 */
export const sendSMSNotification = async (
  phone: string,
  template: string,
  variables: Record<string, string>
): Promise<boolean> => {
  let message = template;

  // Replace variables in template
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  return sendSMS(phone, message);
};

// SMS Templates
export const SMS_TEMPLATES = {
  OTP: 'Your Handy Go verification code is: {{code}}. Valid for 5 minutes.',
  BOOKING_CONFIRMED: 'Your booking {{bookingNumber}} is confirmed. Worker: {{workerName}}. Time: {{scheduledTime}}.',
  WORKER_ARRIVING: '{{workerName}} is on the way! ETA: {{eta}} minutes. Booking: {{bookingNumber}}',
  JOB_COMPLETED: 'Your job is complete! Total: Rs. {{amount}}. Please rate your experience in the app.',
  SOS_ALERT: '🚨 EMERGENCY: SOS triggered for booking {{bookingNumber}}. Our team has been notified.',
};

export default {
  sendSMS,
  sendSMSNotification,
  SMS_TEMPLATES,
};
