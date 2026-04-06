import Joi from 'joi';

/**
 * Pakistan phone number validation
 * Format: +92XXXXXXXXXX (country code + 10 digits)
 * or 03XXXXXXXXX (local format)
 */
export const phoneNumberSchema = Joi.string()
  .pattern(/^(\+92|0)?3[0-9]{9}$/)
  .messages({
    'string.pattern.base': 'Phone number must be a valid Pakistani mobile number (e.g., +923001234567 or 03001234567)',
    'string.empty': 'Phone number is required',
  });

/**
 * Email validation
 */
export const emailSchema = Joi.string().email().lowercase().trim().messages({
  'string.email': 'Please provide a valid email address',
});

/**
 * CNIC validation
 * Format: XXXXX-XXXXXXX-X (13 digits with dashes)
 * or XXXXXXXXXXXXX (13 digits without dashes)
 */
export const cnicSchema = Joi.string()
  .pattern(/^[0-9]{5}-?[0-9]{7}-?[0-9]$/)
  .messages({
    'string.pattern.base': 'CNIC must be in format XXXXX-XXXXXXX-X or 13 digits',
    'string.empty': 'CNIC is required',
  });

/**
 * Coordinates validation
 */
export const coordinatesSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required().messages({
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90',
    'any.required': 'Latitude is required',
  }),
  lng: Joi.number().min(-180).max(180).required().messages({
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180',
    'any.required': 'Longitude is required',
  }),
});

/**
 * GeoJSON Point validation (for MongoDB 2dsphere)
 */
export const geoPointSchema = Joi.object({
  type: Joi.string().valid('Point').required(),
  coordinates: Joi.array()
    .ordered(
      Joi.number().min(-180).max(180).required(), // longitude
      Joi.number().min(-90).max(90).required() // latitude
    )
    .length(2)
    .required(),
});

/**
 * Password validation
 * Min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
export const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    'string.empty': 'Password is required',
  });

/**
 * OTP validation (6 digits)
 */
export const otpSchema = Joi.string()
  .length(6)
  .pattern(/^[0-9]+$/)
  .messages({
    'string.length': 'OTP must be exactly 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
    'string.empty': 'OTP is required',
  });

/**
 * MongoDB ObjectId validation
 */
export const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    'string.pattern.base': 'Invalid ID format',
  });

/**
 * Pagination validation
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

/**
 * Date range validation
 */
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).messages({
    'date.greater': 'End date must be after start date',
  }),
});

/**
 * Rating validation (1-5)
 */
export const ratingSchema = Joi.number().integer().min(1).max(5).messages({
  'number.min': 'Rating must be between 1 and 5',
  'number.max': 'Rating must be between 1 and 5',
});

/**
 * Address validation
 */
export const addressSchema = Joi.object({
  label: Joi.string().max(50).trim(),
  address: Joi.string().max(500).trim().required(),
  city: Joi.string().max(100).trim().required(),
  coordinates: coordinatesSchema.required(),
  isDefault: Joi.boolean().default(false),
});

/**
 * Skill validation for workers
 */
export const skillSchema = Joi.object({
  category: Joi.string()
    .valid(
      'PLUMBING',
      'ELECTRICAL',
      'CLEANING',
      'AC_REPAIR',
      'CARPENTER',
      'PAINTING',
      'MECHANIC',
      'GENERAL_HANDYMAN'
    )
    .required(),
  experience: Joi.number().integer().min(0).max(50).required(),
  hourlyRate: Joi.number().min(0).required(),
  isVerified: Joi.boolean().default(false),
});

/**
 * Helper to validate and sanitize phone number to standard format
 */
export const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If starts with 92, add +
  if (digits.startsWith('92')) {
    return `+${digits}`;
  }

  // If starts with 0, replace with +92
  if (digits.startsWith('0')) {
    return `+92${digits.slice(1)}`;
  }

  // If starts with 3, add +92
  if (digits.startsWith('3')) {
    return `+92${digits}`;
  }

  return phone;
};

/**
 * Helper to validate and sanitize CNIC to standard format (with dashes)
 */
export const normalizeCNIC = (cnic: string): string => {
  const digits = cnic.replace(/\D/g, '');
  if (digits.length === 13) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }
  return cnic;
};
