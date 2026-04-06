#!/usr/bin/env node
/**
 * Create Admin User for Handy Go Admin Panel
 *
 * Creates an Appwrite user with the 'admin' label so they can
 * log into the admin panel.
 *
 * Usage:
 *   node create-admin-user.mjs [phone] [password]
 *
 * Example:
 *   node create-admin-user.mjs 03001234567 Admin@123
 *
 * The admin panel login works by converting {phone} → {phone}@handygo.app
 * as the email for Appwrite email-password auth. The user must also have
 * the 'admin' label set in Appwrite.
 *
 * Requires: APPWRITE_API_KEY in .env.appwrite
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = join(__dirname, '.env.appwrite');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmedLine = line.replace(/\r$/, '');
  const match = trimmedLine.match(/^([A-Z_]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
}

const ENDPOINT = env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = env.APPWRITE_PROJECT_ID || 'handygo';
const API_KEY = env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error('❌ APPWRITE_API_KEY not found in .env.appwrite');
  process.exit(1);
}

// Parse args
const phone = process.argv[2] || '03001234567';
const password = process.argv[3] || 'Admin@123';
const email = `${phone}@handygo.app`;
const name = 'Admin';

function apiCall(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      },
    };
    if (body) {
      const data = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`${res.statusCode}: ${parsed.message || data}`));
          } else {
            resolve(parsed);
          }
        } catch {
          if (res.statusCode >= 400) reject(new Error(`${res.statusCode}: ${data}`));
          else resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('🔧 Creating admin user for Handy Go...\n');
  console.log(`   Phone:    ${phone}`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Project:  ${PROJECT_ID}\n`);

  // Step 1: Create the user
  let userId;
  try {
    const user = await apiCall('POST', '/users', {
      userId: 'unique()',
      email,
      password,
      name,
    });
    userId = user.$id;
    console.log(`✅ User created: ${userId}`);
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('409')) {
      console.log('ℹ️  User already exists, looking up...');
      try {
        const usersList = await apiCall('GET', `/users?queries[]=${encodeURIComponent(`equal("email",["${email}"])`)}`);
        if (usersList.users && usersList.users.length > 0) {
          userId = usersList.users[0].$id;
          console.log(`✅ Found existing user: ${userId}`);

          // Check if blocked/disabled — re-enable
          if (usersList.users[0].status === false) {
            console.log('⚠️  User is disabled, re-enabling...');
            await apiCall('PATCH', `/users/${userId}/status`, { status: true });
            console.log('✅ User re-enabled');
          }
        } else {
          console.error('❌ Could not find user by email');
          process.exit(1);
        }
      } catch (lookupErr) {
        console.error('❌ Lookup failed:', lookupErr.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Failed to create user:', err.message);
      process.exit(1);
    }
  }

  // Step 2: Set admin label
  try {
    await apiCall('PUT', `/users/${userId}/labels`, {
      labels: ['admin'],
    });
    console.log('✅ Admin label set');
  } catch (err) {
    console.error('⚠️  Failed to set admin label:', err.message);
  }

  // Step 3: Verify email (so they don't get blocked)
  try {
    await apiCall('PATCH', `/users/${userId}/verification`, {
      emailVerification: true,
    });
    console.log('✅ Email verified');
  } catch (err) {
    console.warn('⚠️  Email verification failed:', err.message);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  Admin User Created Successfully!');
  console.log('═══════════════════════════════════════════');
  console.log(`  Login to Admin Panel with:`);
  console.log(`    Phone:    ${phone}`);
  console.log(`    Password: ${password}`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch(console.error);
