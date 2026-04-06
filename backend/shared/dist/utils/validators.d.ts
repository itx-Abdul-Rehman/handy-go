import Joi from 'joi';
/**
 * Pakistan phone number validation
 * Format: +92XXXXXXXXXX (country code + 10 digits)
 * or 03XXXXXXXXX (local format)
 */
export declare const phoneNumberSchema: Joi.StringSchema<string>;
/**
 * Email validation
 */
export declare const emailSchema: Joi.StringSchema<string>;
/**
 * CNIC validation
 * Format: XXXXX-XXXXXXX-X (13 digits with dashes)
 * or XXXXXXXXXXXXX (13 digits without dashes)
 */
export declare const cnicSchema: Joi.StringSchema<string>;
/**
 * Coordinates validation
 */
export declare const coordinatesSchema: Joi.ObjectSchema<any>;
/**
 * GeoJSON Point validation (for MongoDB 2dsphere)
 */
export declare const geoPointSchema: Joi.ObjectSchema<any>;
/**
 * Password validation
 * Min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
export declare const passwordSchema: Joi.StringSchema<string>;
/**
 * OTP validation (6 digits)
 */
export declare const otpSchema: Joi.StringSchema<string>;
/**
 * MongoDB ObjectId validation
 */
export declare const objectIdSchema: Joi.StringSchema<string>;
/**
 * Pagination validation
 */
export declare const paginationSchema: Joi.ObjectSchema<any>;
/**
 * Date range validation
 */
export declare const dateRangeSchema: Joi.ObjectSchema<any>;
/**
 * Rating validation (1-5)
 */
export declare const ratingSchema: Joi.NumberSchema<number>;
/**
 * Address validation
 */
export declare const addressSchema: Joi.ObjectSchema<any>;
/**
 * Skill validation for workers
 */
export declare const skillSchema: Joi.ObjectSchema<any>;
/**
 * Helper to validate and sanitize phone number to standard format
 */
export declare const normalizePhoneNumber: (phone: string) => string;
/**
 * Helper to validate and sanitize CNIC to standard format (with dashes)
 */
export declare const normalizeCNIC: (cnic: string) => string;
//# sourceMappingURL=validators.d.ts.map