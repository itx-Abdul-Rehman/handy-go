import nodemailer from 'nodemailer';
import { logger } from '@handy-go/shared';
import { config } from '../config/index.js';
// Initialize nodemailer transporter
let transporter = null;
const initializeEmail = () => {
    if (config.email.user && config.email.password) {
        transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: {
                user: config.email.user,
                pass: config.email.password,
            },
        });
        logger.info('Email transporter initialized');
    }
    else {
        logger.warn('Email credentials not configured - email notifications disabled');
    }
};
// Initialize on module load
initializeEmail();
/**
 * Send email
 */
export const sendEmail = async (options) => {
    if (!transporter) {
        logger.warn('Email transporter not initialized, skipping email');
        return false;
    }
    try {
        await transporter.sendMail({
            from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });
        logger.info(`Email sent to ${options.to}`);
        return true;
    }
    catch (error) {
        logger.error('Email send error:', error);
        return false;
    }
};
/**
 * Send templated email
 */
export const sendTemplatedEmail = async (to, template, variables) => {
    const emailTemplate = EMAIL_TEMPLATES[template];
    if (!emailTemplate) {
        logger.error(`Email template not found: ${template}`);
        return false;
    }
    let subject = emailTemplate.subject;
    let html = emailTemplate.html;
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return sendEmail({ to, subject, html });
};
// Email Templates
export const EMAIL_TEMPLATES = {
    WELCOME: {
        subject: 'Welcome to Handy Go!',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2196F3;">Welcome to Handy Go!</h1>
        <p>Hi {{name}},</p>
        <p>Thank you for joining Handy Go. We're excited to help you find trusted workers for all your home service needs.</p>
        <p>With Handy Go, you can:</p>
        <ul>
          <li>Book verified workers for plumbing, electrical, cleaning, and more</li>
          <li>Track your service in real-time</li>
          <li>Pay securely with multiple options</li>
          <li>Rate and review services</li>
        </ul>
        <p>Get started by booking your first service in the app!</p>
        <p>Best regards,<br>The Handy Go Team</p>
      </div>
    `,
    },
    BOOKING_CONFIRMATION: {
        subject: 'Booking Confirmed - {{bookingNumber}}',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2196F3;">Booking Confirmed!</h1>
        <p>Hi {{customerName}},</p>
        <p>Your booking has been confirmed. Here are the details:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking Number:</strong> {{bookingNumber}}</p>
          <p><strong>Service:</strong> {{serviceCategory}}</p>
          <p><strong>Worker:</strong> {{workerName}}</p>
          <p><strong>Scheduled Time:</strong> {{scheduledTime}}</p>
          <p><strong>Estimated Price:</strong> Rs. {{estimatedPrice}}</p>
        </div>
        <p>You can track your booking in the Handy Go app.</p>
        <p>Best regards,<br>The Handy Go Team</p>
      </div>
    `,
    },
    JOB_COMPLETED: {
        subject: 'Job Completed - {{bookingNumber}}',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Job Completed!</h1>
        <p>Hi {{customerName}},</p>
        <p>Great news! Your job has been completed successfully.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking Number:</strong> {{bookingNumber}}</p>
          <p><strong>Service:</strong> {{serviceCategory}}</p>
          <p><strong>Worker:</strong> {{workerName}}</p>
          <p><strong>Total Amount:</strong> Rs. {{totalAmount}}</p>
        </div>
        <p>Please take a moment to rate your experience in the app. Your feedback helps us improve!</p>
        <p>Thank you for using Handy Go.</p>
        <p>Best regards,<br>The Handy Go Team</p>
      </div>
    `,
    },
    PASSWORD_RESET: {
        subject: 'Reset Your Handy Go Password',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2196F3;">Password Reset</h1>
        <p>Hi {{name}},</p>
        <p>We received a request to reset your password. Your verification code is:</p>
        <div style="background: #2196F3; color: white; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
          {{code}}
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Handy Go Team</p>
      </div>
    `,
    },
};
export default {
    sendEmail,
    sendTemplatedEmail,
    EMAIL_TEMPLATES,
};
//# sourceMappingURL=email.service.js.map