#!/usr/bin/env node

/**
 * Handy Go - Appwrite Cloud Setup Script
 *
 * This script creates all necessary Appwrite resources:
 * - Database with collections (mirrors MongoDB models)
 * - Storage buckets
 * - Functions
 *
 * Prerequisites:
 * 1. npm install node-appwrite dotenv
 * 2. Fill in .env.appwrite with your project credentials
 * 3. Run: node setup-appwrite.mjs
 */

import { Client, Databases, Storage, Functions, Users, ID, Permission, Role, IndexType } from 'node-appwrite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// Load environment variables from .env.appwrite
// ============================================================
function loadEnv() {
  const envPath = resolve(__dirname, '.env.appwrite');
  const envContent = readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    env[key.trim()] = valueParts.join('=').trim();
  }
  return env;
}

const env = loadEnv();

if (!env.APPWRITE_ENDPOINT || !env.APPWRITE_PROJECT_ID || !env.APPWRITE_API_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('   Please fill in APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY in .env.appwrite');
  process.exit(1);
}

// ============================================================
// Initialize Appwrite Client
// ============================================================
const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

const DB_ID = env.APPWRITE_DATABASE_ID || 'handy_go_db';

// ============================================================
// Helper Functions
// ============================================================
async function safeCreate(name, createFn) {
  try {
    const result = await createFn();
    console.log(`  ✅ Created: ${name}`);
    return result;
  } catch (error) {
    if (error.code === 409) {
      console.log(`  ⏭️  Already exists: ${name}`);
      return null;
    }
    // Retry for "attribute not yet available" errors (index creation)
    if (error.message && error.message.includes('not yet available')) {
      console.log(`  ⏳ ${name}: attributes not ready, waiting...`);
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const result = await createFn();
          console.log(`  ✅ Created: ${name} (after retry)`);
          return result;
        } catch (retryErr) {
          if (retryErr.code === 409) {
            console.log(`  ⏭️  Already exists: ${name}`);
            return null;
          }
          if (!retryErr.message?.includes('not yet available')) {
            console.error(`  ❌ Failed: ${name} - ${retryErr.message}`);
            throw retryErr;
          }
        }
      }
      console.error(`  ❌ Timed out waiting for attributes: ${name}`);
      return null;
    }
    console.error(`  ❌ Failed: ${name} - ${error.message}`);
    throw error;
  }
}

/**
 * Wait for all attributes in a collection to become 'available'.
 * Appwrite processes attributes asynchronously — indexes cannot
 * be created until every attribute they reference is ready.
 */
async function waitForAttributes(collectionId, maxRetries = 30, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    const { attributes } = await databases.listAttributes(DB_ID, collectionId);
    const pending = attributes.filter(a => a.status !== 'available');
    if (pending.length === 0) return;
    console.log(`  ⏳ Waiting for ${pending.length} attribute(s) to be ready...`);
    await new Promise(r => setTimeout(r, delayMs));
  }
  console.log('  ⚠️  Some attributes may not be ready yet, proceeding anyway...');
}

// ============================================================
// 1. CREATE DATABASE
// ============================================================
async function createDatabase() {
  console.log('\n📦 Creating Database...');
  await safeCreate('handy_go_db', () =>
    databases.create(DB_ID, 'Handy Go Database', true)
  );
}

// ============================================================
// 2. CREATE COLLECTIONS
// ============================================================

async function createCustomersCollection() {
  const COLL_ID = 'customers';
  console.log('\n👤 Creating Customers Collection...');

  await safeCreate('customers collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Customers', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
    ], false)
  );

  // Attributes
  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'userId', 36, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'firstName', 50, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'lastName', 50, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'phone', 15, true),
    () => databases.createEmailAttribute(DB_ID, COLL_ID, 'email', false),
    () => databases.createUrlAttribute(DB_ID, COLL_ID, 'profileImage', false),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'preferredLanguage', ['en', 'ur'], false, 'en'),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'totalBookings', false, 0, 100000, 0),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  // Wait for all attributes to be ready before creating indexes
  await waitForAttributes(COLL_ID);

  // Indexes
  await safeCreate('userId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_userId', IndexType.Unique, ['userId'])
  );
  await safeCreate('phone index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_phone', IndexType.Unique, ['phone'])
  );
}

async function createCustomerAddressesCollection() {
  const COLL_ID = 'customer_addresses';
  console.log('\n📍 Creating Customer Addresses Collection...');

  await safeCreate('customer_addresses collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Customer Addresses', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'customerId', 36, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'label', 50, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'address', 500, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'city', 100, true),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'latitude', false, -90, 90),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'longitude', false, -180, 180),
    () => databases.createBooleanAttribute(DB_ID, COLL_ID, 'isDefault', false, false),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('customerId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_customerId', IndexType.Key, ['customerId'])
  );
}

async function createWorkersCollection() {
  const COLL_ID = 'workers';
  console.log('\n🔧 Creating Workers Collection...');

  await safeCreate('workers collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Workers', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'userId', 36, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'firstName', 50, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'lastName', 50, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'phone', 15, true),
    () => databases.createEmailAttribute(DB_ID, COLL_ID, 'email', false),
    () => databases.createUrlAttribute(DB_ID, COLL_ID, 'profileImage', false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'cnic', 15, true),
    () => databases.createBooleanAttribute(DB_ID, COLL_ID, 'cnicVerified', false, false),
    () => databases.createUrlAttribute(DB_ID, COLL_ID, 'cnicFrontImage', false),
    () => databases.createUrlAttribute(DB_ID, COLL_ID, 'cnicBackImage', false),
    // Location (Appwrite doesn't have GeoJSON, so we store lat/lng separately)
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'currentLatitude', false, -90, 90),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'currentLongitude', false, -180, 180),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'serviceRadius', false, 1, 100, 10),
    // Availability
    () => databases.createBooleanAttribute(DB_ID, COLL_ID, 'isAvailable', false, false),
    // Rating
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'ratingAverage', false, 0, 5, 0),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'ratingCount', false, 0, 1000000, 0),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'trustScore', false, 0, 100, 50),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'totalJobsCompleted', false, 0, 1000000, 0),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'totalEarnings', false, 0),
    // Bank details (stored as JSON string for flexibility)
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'bankAccountTitle', 100, false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'bankAccountNumber', 50, false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'bankName', 100, false),
    // Status
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'status', [
      'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INACTIVE'
    ], false, 'PENDING_VERIFICATION'),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  // Wait for all attributes to be ready before creating indexes
  await waitForAttributes(COLL_ID);

  // Indexes
  await safeCreate('userId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_userId', IndexType.Unique, ['userId'])
  );
  await safeCreate('cnic index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_cnic', IndexType.Unique, ['cnic'])
  );
  await safeCreate('status+availability index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_status_avail', IndexType.Key, ['status', 'isAvailable'])
  );
  await safeCreate('trustScore index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_trustScore', IndexType.Key, ['trustScore'])
  );
  await safeCreate('ratingAverage index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_rating', IndexType.Key, ['ratingAverage'])
  );
}

async function createWorkerSkillsCollection() {
  const COLL_ID = 'worker_skills';
  console.log('\n🛠️ Creating Worker Skills Collection...');

  await safeCreate('worker_skills collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Worker Skills', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'workerId', 36, true),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'category', [
      'PLUMBING', 'ELECTRICAL', 'CLEANING', 'AC_REPAIR',
      'CARPENTER', 'PAINTING', 'MECHANIC', 'GENERAL_HANDYMAN'
    ], false),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'experience', false, 0, 50, 0),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'hourlyRate', true, 0),
    () => databases.createBooleanAttribute(DB_ID, COLL_ID, 'isVerified', false, false),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('workerId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_workerId', IndexType.Key, ['workerId'])
  );
  await safeCreate('category index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_category', IndexType.Key, ['category'])
  );
}

async function createWorkerScheduleCollection() {
  const COLL_ID = 'worker_schedule';
  console.log('\n📅 Creating Worker Schedule Collection...');

  await safeCreate('worker_schedule collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Worker Schedule', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'workerId', 36, true),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'day', [
      'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'
    ], false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'startTime', 5, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'endTime', 5, true),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('workerId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_workerId', IndexType.Key, ['workerId'])
  );
}

async function createBookingsCollection() {
  const COLL_ID = 'bookings';
  console.log('\n📋 Creating Bookings Collection...');

  await safeCreate('bookings collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Bookings', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'bookingNumber', 20, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'customerId', 36, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'workerId', 36, false),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'serviceCategory', [
      'PLUMBING', 'ELECTRICAL', 'CLEANING', 'AC_REPAIR',
      'CARPENTER', 'PAINTING', 'MECHANIC', 'GENERAL_HANDYMAN'
    ], false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'problemDescription', 2000, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'aiDetectedServices', 500, false),
    // Address
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'addressFull', 500, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'addressCity', 100, true),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'addressLatitude', false, -90, 90),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'addressLongitude', false, -180, 180),
    // Schedule
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'scheduledDateTime', true),
    () => databases.createBooleanAttribute(DB_ID, COLL_ID, 'isUrgent', false, false),
    // Status
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'status', [
      'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'
    ], false, 'PENDING'),
    // Pricing
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'estimatedPrice', false, 0),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'finalPrice', false, 0),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'laborCost', false, 0),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'materialsCost', false, 0),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'platformFee', false, 0),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'discount', false, 0),
    // Duration
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'estimatedDuration', false, 0),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'actualDuration', false, 0),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'actualStartTime', false),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'actualEndTime', false),
    // Payment
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'paymentMethod', ['CASH', 'WALLET', 'CARD'], false),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'paymentStatus', ['PENDING', 'COMPLETED', 'REFUNDED'], false, 'PENDING'),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'transactionId', 100, false),
    // Rating
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'ratingScore', false, 1, 5),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'ratingReview', 500, false),
    // Cancellation
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'cancelledBy', ['CUSTOMER', 'WORKER', 'ADMIN', 'SYSTEM'], false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'cancellationReason', 500, false),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'cancelledAt', false),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  // Wait for all attributes to be ready before creating indexes
  await waitForAttributes(COLL_ID);

  // Indexes
  await safeCreate('bookingNumber index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_bookingNumber', IndexType.Unique, ['bookingNumber'])
  );
  await safeCreate('customerId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_customerId', IndexType.Key, ['customerId'])
  );
  await safeCreate('workerId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_workerId', IndexType.Key, ['workerId'])
  );
  await safeCreate('status index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_status', IndexType.Key, ['status'])
  );
  await safeCreate('serviceCategory+status index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_cat_status', IndexType.Key, ['serviceCategory', 'status'])
  );
  await safeCreate('scheduledDateTime index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_scheduleDate', IndexType.Key, ['scheduledDateTime'])
  );
}

async function createBookingTimelineCollection() {
  const COLL_ID = 'booking_timeline';
  console.log('\n📊 Creating Booking Timeline Collection...');

  await safeCreate('booking_timeline collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Booking Timeline', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'bookingId', 36, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'status', 50, true),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'timestamp', true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'note', 500, false),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('bookingId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_bookingId', IndexType.Key, ['bookingId'])
  );
}

async function createBookingImagesCollection() {
  const COLL_ID = 'booking_images';
  console.log('\n📸 Creating Booking Images Collection...');

  await safeCreate('booking_images collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Booking Images', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'bookingId', 36, true),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'type', ['before', 'after'], false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'fileId', 36, true),
    () => databases.createUrlAttribute(DB_ID, COLL_ID, 'url', true),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('bookingId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_bookingId', IndexType.Key, ['bookingId'])
  );
}

async function createReviewsCollection() {
  const COLL_ID = 'reviews';
  console.log('\n⭐ Creating Reviews Collection...');

  await safeCreate('reviews collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Reviews', [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'bookingId', 36, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'customerId', 36, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'workerId', 36, true),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'rating', true, 1, 5),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'review', 500, false),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'punctuality', false, 1, 5),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'quality', false, 1, 5),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'professionalism', false, 1, 5),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'value', false, 1, 5),
    () => databases.createBooleanAttribute(DB_ID, COLL_ID, 'isVerified', false, true),
    () => databases.createBooleanAttribute(DB_ID, COLL_ID, 'adminModerated', false, false),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('bookingId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_bookingId', IndexType.Unique, ['bookingId'])
  );
  await safeCreate('workerId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_workerId', IndexType.Key, ['workerId'])
  );
  await safeCreate('customerId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_customerId', IndexType.Key, ['customerId'])
  );
}

async function createSOSCollection() {
  const COLL_ID = 'sos_alerts';
  console.log('\n🚨 Creating SOS Alerts Collection...');

  await safeCreate('sos_alerts collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'SOS Alerts', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'bookingId', 36, false),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'initiatedByType', ['CUSTOMER', 'WORKER'], false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'initiatedByUserId', 36, true),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'priority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], false),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'aiAssessedPriority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'reason', 200, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'description', 2000, false),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'latitude', false, -90, 90),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'longitude', false, -180, 180),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'status', [
      'ACTIVE', 'RESOLVED', 'ESCALATED', 'FALSE_ALARM'
    ], false, 'ACTIVE'),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'assignedAdminId', 36, false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'resolutionAction', 500, false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'resolutionNotes', 1000, false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'resolvedById', 36, false),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'resolvedAt', false),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('status+priority index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_status_priority', IndexType.Key, ['status', 'priority'])
  );
  await safeCreate('bookingId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_bookingId', IndexType.Key, ['bookingId'])
  );
}

async function createNotificationsCollection() {
  const COLL_ID = 'notifications';
  console.log('\n🔔 Creating Notifications Collection...');

  await safeCreate('notifications collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Notifications', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'recipientId', 36, true),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'type', [
      'BOOKING', 'PAYMENT', 'SOS', 'SYSTEM', 'PROMOTION'
    ], false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'title', 200, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'body', 1000, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'data', 5000, false),
    () => databases.createBooleanAttribute(DB_ID, COLL_ID, 'isRead', false, false),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'readAt', false),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('recipientId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_recipientId', IndexType.Key, ['recipientId'])
  );
  await safeCreate('recipientId+isRead index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_recipient_read', IndexType.Key, ['recipientId', 'isRead'])
  );
}

async function createWorkerLocationHistoryCollection() {
  const COLL_ID = 'worker_location_history';
  console.log('\n📍 Creating Worker Location History Collection...');

  await safeCreate('worker_location_history collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Worker Location History', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'bookingId', 36, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'workerId', 36, true),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'latitude', true, -90, 90),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'longitude', true, -180, 180),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'timestamp', true),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('bookingId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_bookingId', IndexType.Key, ['bookingId'])
  );
}

async function createEmailOTPsCollection() {
  const COLL_ID = 'email_otps';
  console.log('\n📧 Creating Email OTPs Collection...');

  await safeCreate('email_otps collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Email OTPs', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createEmailAttribute(DB_ID, COLL_ID, 'email', true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'code', 6, true),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'purpose', [
      'REGISTRATION', 'PASSWORD_RESET', 'EMAIL_CHANGE'
    ], false),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, 'attempts', false, 0, 10, 0),
    () => databases.createBooleanAttribute(DB_ID, COLL_ID, 'verified', false, false),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'expiresAt', true),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'createdAt', true),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('email+purpose index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_email_purpose', IndexType.Key, ['email', 'purpose'])
  );
  await safeCreate('expiresAt index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_expiresAt', IndexType.Key, ['expiresAt'])
  );
}

// ============================================================
// 2.14 Chat Messages Collection
// ============================================================
async function createChatMessagesCollection() {
  const COLL_ID = 'chat_messages';
  console.log('\n💬 Creating Chat Messages Collection...');

  await safeCreate('chat_messages collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Chat Messages', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'bookingId', 36, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'message', 2000, true),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'senderType', [
      'CUSTOMER', 'WORKER', 'SYSTEM'
    ], false),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('bookingId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_bookingId', IndexType.Key, ['bookingId'])
  );
  await safeCreate('bookingId+createdAt index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_booking_created', IndexType.Key, ['bookingId', '$createdAt'])
  );
}

// ────────────────────────────────────────────────────────────
// 2.15 platform_settings
// ────────────────────────────────────────────────────────────
async function createPlatformSettingsCollection() {
  const COLL_ID = 'platform_settings';
  console.log('\n📋 Creating platform_settings collection...');

  await safeCreate('collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Platform Settings', [
      Permission.read(Role.users()),
      Permission.write(Role.team('admins')),
      Permission.update(Role.team('admins')),
    ])
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'general', 10000, false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'notifications', 10000, false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'platform', 10000, false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'security', 10000, false),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);
}

// ============================================================
// 3. CREATE STORAGE BUCKETS
// ============================================================
async function createStorageBuckets() {
  console.log('\n🗄️ Creating Storage Buckets...');

  const buckets = [
    {
      id: 'profile_images',
      name: 'Profile Images',
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
    },
    {
      id: 'cnic_images',
      name: 'CNIC Images',
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
      ],
    },
    {
      id: 'booking_images',
      name: 'Booking Images',
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
      ],
    },
    {
      id: 'sos_evidence',
      name: 'SOS Evidence',
      maxSize: 50 * 1024 * 1024, // 50MB (includes audio)
      allowedExtensions: ['jpg', 'jpeg', 'png', 'mp3', 'wav', 'mp4', 'webm'],
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
      ],
    },
  ];

  for (const bucket of buckets) {
    await safeCreate(bucket.name, () =>
      storage.createBucket(
        bucket.id,
        bucket.name,
        bucket.permissions,
        false, // fileSecurity
        true,  // enabled
        bucket.maxSize,
        bucket.allowedExtensions,
        undefined, // compression
        true, // encryption
        true  // antivirus
      )
    );
  }
}

// ============================================================
// WALLETS — Customer & worker wallet balances
// ============================================================
async function createWalletsCollection() {
  const COLL_ID = 'wallets';
  console.log('\n💰 Creating Wallets Collection...');

  await safeCreate('wallets collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Wallets', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'userId', 36, true),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'balance', false, 0, undefined, 0),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'currency', ['PKR'], false, 'PKR'),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'status', ['ACTIVE', 'FROZEN', 'CLOSED'], false, 'ACTIVE'),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'lastTopUpAt', false),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, 'lastWithdrawalAt', false),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('userId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_userId', IndexType.Unique, ['userId'])
  );
  await safeCreate('status index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_status', IndexType.Key, ['status'])
  );
}

// ============================================================
// TRANSACTIONS — Payment & wallet transaction ledger
// ============================================================
async function createTransactionsCollection() {
  const COLL_ID = 'transactions';
  console.log('\n🧾 Creating Transactions Collection...');

  await safeCreate('transactions collection', () =>
    databases.createCollection(DB_ID, COLL_ID, 'Transactions', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
    ], false)
  );

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'userId', 36, true),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'type', [
      'TOP_UP',        // Money added to wallet
      'BOOKING_DEBIT', // Wallet payment for a booking
      'BOOKING_CASH',  // Cash payment recorded
      'REFUND',        // Refund back to wallet
      'WITHDRAWAL',    // Withdrawal to bank account
      'PLATFORM_FEE',  // Platform fee deduction (internal)
      'EARNING',       // Worker earning credited
    ], true),
    () => databases.createFloatAttribute(DB_ID, COLL_ID, 'amount', true, 0),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'status', [
      'PENDING', 'COMPLETED', 'FAILED', 'REVERSED'
    ], false, 'PENDING'),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'bookingId', 36, false),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, 'paymentMethod', [
      'CASH', 'WALLET', 'CARD', 'JAZZCASH', 'EASYPAISA', 'BANK_TRANSFER'
    ], false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'description', 500, false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'gatewayReference', 200, false),
    // Metadata JSON string for gateway-specific data (payment gateway response, etc.)
    () => databases.createStringAttribute(DB_ID, COLL_ID, 'metadata', 2000, false),
  ];

  for (const attr of attrs) {
    await safeCreate('attribute', attr);
  }

  await waitForAttributes(COLL_ID);

  await safeCreate('userId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_userId', IndexType.Key, ['userId'])
  );
  await safeCreate('type index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_type', IndexType.Key, ['type'])
  );
  await safeCreate('bookingId index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_bookingId', IndexType.Key, ['bookingId'])
  );
  await safeCreate('userId+type index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_userId_type', IndexType.Key, ['userId', 'type'])
  );
  await safeCreate('status index', () =>
    databases.createIndex(DB_ID, COLL_ID, 'idx_status', IndexType.Key, ['status'])
  );
}

// ============================================================
// CREATE APPWRITE FUNCTIONS
// ============================================================
async function createFunctions() {
  console.log('\n📦 Creating Appwrite Functions...');

  const functionDefs = [
    {
      id: env.APPWRITE_MATCHING_FUNCTION || 'matching_service',
      name: 'Matching Service',
      runtime: 'node-22',
      timeout: 30,
      events: [],
      schedule: '',
    },
    {
      id: env.APPWRITE_BOOKING_PROCESSOR_FUNCTION || 'booking_processor',
      name: 'Booking Processor',
      runtime: 'node-22',
      timeout: 30,
      events: ['databases.handy_go_db.collections.bookings.documents.*.update'],
      schedule: '*/1 * * * *', // Every minute for timeout checks
    },
    {
      id: env.APPWRITE_SOS_ANALYZER_FUNCTION || 'sos_analyzer',
      name: 'SOS Analyzer',
      runtime: 'node-22',
      timeout: 15,
      events: [],
      schedule: '',
    },
    {
      id: env.APPWRITE_TRUST_CALCULATOR_FUNCTION || 'trust_calculator',
      name: 'Trust Calculator',
      runtime: 'node-22',
      timeout: 60,
      events: ['databases.handy_go_db.collections.reviews.documents.*.create'],
      schedule: '0 3 * * *', // Daily at 3 AM for full recalculation
    },
    {
      id: env.APPWRITE_NOTIFICATION_SENDER_FUNCTION || 'notification_sender',
      name: 'Notification Sender',
      runtime: 'node-22',
      timeout: 15,
      events: [],
      schedule: '0 4 * * *', // Daily at 4 AM for notification cleanup
    },
    {
      id: env.APPWRITE_PAYMENT_PROCESSOR_FUNCTION || 'payment_processor',
      name: 'Payment Processor',
      runtime: 'node-22',
      timeout: 30,
      events: [],
      schedule: '',
    },
    {
      id: env.APPWRITE_EMAIL_OTP_FUNCTION || 'email_otp',
      name: 'Email OTP',
      runtime: 'node-22',
      timeout: 15,
      events: [],
      schedule: '',
      execute: ['any'], // Allow unauthenticated users to call (needed for login/signup OTP)
    },
  ];

  for (const fn of functionDefs) {
    try {
      await functions.create(
        fn.id,
        fn.name,
        fn.runtime,
        fn.execute || undefined, // execute permissions
        fn.events.length > 0 ? fn.events : undefined,
        fn.schedule || undefined,
        fn.timeout,
        undefined, // enabled
        undefined, // logging
        fn.id,     // entrypoint
      );
      console.log(`  ✅ Function: ${fn.name} (${fn.id})`);
    } catch (err) {
      if (err.code === 409) {
        console.log(`  ⚠️  Function ${fn.name} already exists, skipping.`);
      } else {
        console.error(`  ❌ Function ${fn.name}: ${err.message}`);
      }
    }
  }

  console.log('\n  ℹ️  Functions created. Deploy code with:');
  console.log('     cd functions/<name> && appwrite functions createDeployment --functionId=<id> --entrypoint=src/main.js --code=./');
}

// ============================================================
// MAIN EXECUTION
// ============================================================
async function main() {
  console.log('🚀 Handy Go - Appwrite Cloud Setup');
  console.log('====================================');
  console.log(`Endpoint: ${env.APPWRITE_ENDPOINT}`);
  console.log(`Project:  ${env.APPWRITE_PROJECT_ID}`);
  console.log('');

  try {
    // 1. Create Database
    await createDatabase();

    // 2. Create Collections (wait for each to complete)
    await createCustomersCollection();
    await createCustomerAddressesCollection();
    await createWorkersCollection();
    await createWorkerSkillsCollection();
    await createWorkerScheduleCollection();
    await createBookingsCollection();
    await createBookingTimelineCollection();
    await createBookingImagesCollection();
    await createReviewsCollection();
    await createSOSCollection();
    await createNotificationsCollection();
    await createWorkerLocationHistoryCollection();
    await createEmailOTPsCollection();
    await createChatMessagesCollection();
    await createPlatformSettingsCollection();
    await createWalletsCollection();
    await createTransactionsCollection();

    // 3. Create Storage Buckets
    await createStorageBuckets();

    // 4. Create Functions
    await createFunctions();

    console.log('\n====================================');
    console.log('🎉 Setup Complete!');
    console.log('====================================');
    console.log('\nNext steps:');
    console.log('1. Update your Flutter apps with the Appwrite project ID');
    console.log('2. Deploy Appwrite Functions: cd functions/<name> && appwrite deploy function');
    console.log('3. Configure Messaging providers (Twilio SMS, FCM Push)');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
