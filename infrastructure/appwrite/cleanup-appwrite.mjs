#!/usr/bin/env node

/**
 * Handy Go - Appwrite Cleanup Script
 *
 * Deletes all user accounts AND all documents from all collections.
 * Use this to reset the backend to a clean state.
 *
 * Usage: node cleanup-appwrite.mjs
 */

import { Client, Databases, Users, Storage, Query } from 'node-appwrite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// Load environment variables
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
  console.error('❌ Missing required environment variables in .env.appwrite');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);

const DB_ID = env.APPWRITE_DATABASE_ID || 'handy_go_db';

// All collection IDs to clean
const COLLECTIONS = [
  'customers',
  'customer_addresses',
  'workers',
  'worker_skills',
  'worker_schedule',
  'bookings',
  'booking_timeline',
  'booking_images',
  'reviews',
  'sos_alerts',
  'notifications',
  'worker_location_history',
];

// ============================================================
// Delete all documents from a collection
// ============================================================
async function clearCollection(collectionId) {
  let deleted = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await databases.listDocuments(DB_ID, collectionId, [
        Query.limit(100),
      ]);

      if (response.documents.length === 0) {
        hasMore = false;
        break;
      }

      for (const doc of response.documents) {
        try {
          await databases.deleteDocument(DB_ID, collectionId, doc.$id);
          deleted++;
        } catch (err) {
          console.warn(`  ⚠ Could not delete doc ${doc.$id}: ${err.message}`);
        }
      }
    } catch (err) {
      if (err.code === 404) {
        console.log(`  ℹ Collection "${collectionId}" not found, skipping.`);
        hasMore = false;
      } else {
        console.error(`  ❌ Error listing docs in "${collectionId}": ${err.message}`);
        hasMore = false;
      }
    }
  }

  return deleted;
}

// ============================================================
// Delete all users
// ============================================================
async function clearUsers() {
  let deleted = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await users.list([Query.limit(100)]);

      if (response.users.length === 0) {
        hasMore = false;
        break;
      }

      for (const user of response.users) {
        try {
          await users.delete(user.$id);
          deleted++;
        } catch (err) {
          console.warn(`  ⚠ Could not delete user ${user.$id} (${user.email || user.phone}): ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`  ❌ Error listing users: ${err.message}`);
      hasMore = false;
    }
  }

  return deleted;
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('🧹 Handy Go - Appwrite Cleanup');
  console.log('================================');
  console.log(`Endpoint: ${env.APPWRITE_ENDPOINT}`);
  console.log(`Project:  ${env.APPWRITE_PROJECT_ID}`);
  console.log(`Database: ${DB_ID}`);
  console.log('');

  // 1. Clear all collections
  console.log('📦 Clearing collections...');
  for (const collectionId of COLLECTIONS) {
    const count = await clearCollection(collectionId);
    if (count > 0) {
      console.log(`  ✅ ${collectionId}: deleted ${count} documents`);
    } else {
      console.log(`  ✅ ${collectionId}: already empty`);
    }
  }

  console.log('');

  // 2. Delete all users
  console.log('👤 Deleting all user accounts...');
  const userCount = await clearUsers();
  console.log(`  ✅ Deleted ${userCount} user accounts`);

  console.log('');
  console.log('🎉 Cleanup complete! Backend is reset to a clean state.');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
