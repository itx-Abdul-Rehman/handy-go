import twilio from 'twilio';
import { config } from '../config/index.js';
import { OTP, logger } from '@handy-go/shared';
// Initialize Twilio client only if valid credentials are provided
const twilioClient = (() => {
    try {
        // Only initialize if credentials look valid (SID starts with AC)
        if (config.twilioAccountSid &&
            config.twilioAuthToken &&
            config.twilioAccountSid.startsWith('AC')) {
            return twilio(config.twilioAccountSid, config.twilioAuthToken);
        }
        logger.warn('Twilio not configured - SMS will be logged instead of sent');
        return null;
    }
    catch (error) {
        logger.warn('Twilio initialization failed - SMS will be logged instead of sent');
        return null;
    }
})();
/**
 * Generate 6-digit OTP
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
/**
 * Send SMS via Twilio
 */
export const sendSMS = async (phone, message) => {
    try {
        if (!twilioClient) {
            // In development, log the message instead of sending
            logger.info(`[DEV MODE] SMS to ${phone}: ${message}`);
            return true;
        }
        await twilioClient.messages.create({
            body: message,
            from: config.twilioPhoneNumber,
            to: phone,
        });
        logger.info(`SMS sent successfully to ${phone}`);
        return true;
    }
    catch (error) {
        logger.error('Failed to send SMS', error, { phone });
        return false;
    }
};
/**
 * Create OTP record and send SMS
 */
export const createAndSendOTP = async (phone, purpose) => {
    try {
        // Create OTP record
        const otpRecord = await OTP.createOTP(phone, purpose);
        // Prepare message
        const message = `Your Handy Go verification code is: ${otpRecord.code}. Valid for ${config.otpExpiryMinutes} minutes. Do not share this code with anyone.`;
        // Send SMS
        const smsSent = await sendSMS(phone, message);
        if (!smsSent) {
            return { success: false, error: 'Failed to send OTP SMS' };
        }
        // In development, also log the OTP for testing
        if (config.nodeEnv === 'development') {
            logger.info(`[DEV] OTP for ${phone}: ${otpRecord.code}`);
        }
        return { success: true, otpId: otpRecord._id.toString() };
    }
    catch (error) {
        logger.error('Failed to create OTP', error, { phone, purpose });
        return { success: false, error: 'Failed to create OTP' };
    }
};
/**
 * Verify OTP code
 */
export const verifyOTPCode = async (phone, code, purpose) => {
    try {
        // Find valid OTP
        const otpRecord = await OTP.findValidOTP(phone, purpose);
        if (!otpRecord) {
            return { success: false, error: 'OTP not found or expired' };
        }
        // Increment attempts
        await otpRecord.incrementAttempts();
        // Verify code
        if (!otpRecord.verify(code)) {
            if (otpRecord.attempts >= config.otpMaxAttempts) {
                return { success: false, error: 'Maximum OTP attempts exceeded' };
            }
            return { success: false, error: 'Invalid OTP code' };
        }
        // Mark as used
        await otpRecord.markAsUsed();
        return { success: true };
    }
    catch (error) {
        logger.error('Failed to verify OTP', error, { phone, purpose });
        return { success: false, error: 'Failed to verify OTP' };
    }
};
//# sourceMappingURL=otp.service.js.map