/**
 * Unit tests for Joi validation schemas and normalization helpers.
 *
 * These are pure-function tests with no external dependencies,
 * validating the single most security-critical shared utility
 * in the backend (input validation).
 */

import {
  phoneNumberSchema,
  emailSchema,
  cnicSchema,
  coordinatesSchema,
  passwordSchema,
  otpSchema,
  objectIdSchema,
  ratingSchema,
  normalizePhoneNumber,
  normalizeCNIC,
} from '../utils/validators.js';

// ── Phone number ────────────────────────────────────────────

describe('phoneNumberSchema', () => {
  const valid = ['+923001234567', '03001234567', '3001234567'];
  const invalid = ['12345', '+921234', '+92300123', 'abc', '', '+1234567890'];

  test.each(valid)('accepts valid phone: %s', (phone: string) => {
    const { error } = phoneNumberSchema.validate(phone);
    expect(error).toBeUndefined();
  });

  test.each(invalid)('rejects invalid phone: %s', (phone: string) => {
    const { error } = phoneNumberSchema.validate(phone);
    expect(error).toBeDefined();
  });
});

// ── Email ───────────────────────────────────────────────────

describe('emailSchema', () => {
  test('accepts valid email', () => {
    const { error, value } = emailSchema.validate('User@Example.COM');
    expect(error).toBeUndefined();
    expect(value).toBe('user@example.com'); // lowercased & trimmed
  });

  test('rejects invalid email', () => {
    const { error } = emailSchema.validate('not-an-email');
    expect(error).toBeDefined();
  });
});

// ── CNIC ────────────────────────────────────────────────────

describe('cnicSchema', () => {
  test('accepts CNIC with dashes', () => {
    const { error } = cnicSchema.validate('35202-1234567-1');
    expect(error).toBeUndefined();
  });

  test('accepts CNIC without dashes', () => {
    const { error } = cnicSchema.validate('3520212345671');
    expect(error).toBeUndefined();
  });

  test('rejects short CNIC', () => {
    const { error } = cnicSchema.validate('3520212345');
    expect(error).toBeDefined();
  });
});

// ── Coordinates ─────────────────────────────────────────────

describe('coordinatesSchema', () => {
  test('accepts valid Islamabad coordinate', () => {
    const { error } = coordinatesSchema.validate({ lat: 33.6844, lng: 73.0479 });
    expect(error).toBeUndefined();
  });

  test('rejects out-of-range latitude', () => {
    const { error } = coordinatesSchema.validate({ lat: 100, lng: 73 });
    expect(error).toBeDefined();
  });

  test('rejects missing longitude', () => {
    const { error } = coordinatesSchema.validate({ lat: 33 });
    expect(error).toBeDefined();
  });
});

// ── Password ────────────────────────────────────────────────

describe('passwordSchema', () => {
  const strongPasswords = ['Pa$$w0rd', 'Str0ng!Pass', 'Ab1@defgh'];
  const weakPasswords = ['short', 'nouppercase1!', 'NOLOWERCASE1!', 'NoSpecial1', 'No1spec!al'];

  test.each(strongPasswords)('accepts strong password: %s', (pw: string) => {
    const { error } = passwordSchema.validate(pw);
    expect(error).toBeUndefined();
  });

  test('rejects password shorter than 8 chars', () => {
    const { error } = passwordSchema.validate('Ab1!');
    expect(error).toBeDefined();
  });

  test('rejects password without uppercase', () => {
    const { error } = passwordSchema.validate('lowercase1!only');
    expect(error).toBeDefined();
  });
});

// ── OTP ─────────────────────────────────────────────────────

describe('otpSchema', () => {
  test('accepts 6-digit OTP', () => {
    const { error } = otpSchema.validate('123456');
    expect(error).toBeUndefined();
  });

  test('rejects 5-digit OTP', () => {
    const { error } = otpSchema.validate('12345');
    expect(error).toBeDefined();
  });

  test('rejects non-numeric OTP', () => {
    const { error } = otpSchema.validate('12ab56');
    expect(error).toBeDefined();
  });
});

// ── ObjectId ────────────────────────────────────────────────

describe('objectIdSchema', () => {
  test('accepts valid ObjectId', () => {
    const { error } = objectIdSchema.validate('507f1f77bcf86cd799439011');
    expect(error).toBeUndefined();
  });

  test('rejects short string', () => {
    const { error } = objectIdSchema.validate('507f1f77');
    expect(error).toBeDefined();
  });
});

// ── Rating ──────────────────────────────────────────────────

describe('ratingSchema', () => {
  test.each([1, 2, 3, 4, 5])('accepts rating %d', (r: number) => {
    const { error } = ratingSchema.validate(r);
    expect(error).toBeUndefined();
  });

  test('rejects 0', () => {
    const { error } = ratingSchema.validate(0);
    expect(error).toBeDefined();
  });

  test('rejects 6', () => {
    const { error } = ratingSchema.validate(6);
    expect(error).toBeDefined();
  });
});

// ── normalizePhoneNumber ────────────────────────────────────

describe('normalizePhoneNumber', () => {
  test('normalizes 03XX format', () => {
    expect(normalizePhoneNumber('03001234567')).toBe('+923001234567');
  });

  test('normalizes bare 3XX format', () => {
    expect(normalizePhoneNumber('3001234567')).toBe('+923001234567');
  });

  test('normalizes 92XX format', () => {
    expect(normalizePhoneNumber('923001234567')).toBe('+923001234567');
  });

  test('keeps already-valid +92 format', () => {
    expect(normalizePhoneNumber('+923001234567')).toBe('+923001234567');
  });
});

// ── normalizeCNIC ───────────────────────────────────────────

describe('normalizeCNIC', () => {
  test('adds dashes to 13 digits', () => {
    expect(normalizeCNIC('3520212345671')).toBe('35202-1234567-1');
  });

  test('keeps already-dashed CNIC', () => {
    // Input already has dashes — stripping yields 13 digits
    expect(normalizeCNIC('35202-1234567-1')).toBe('35202-1234567-1');
  });
});
