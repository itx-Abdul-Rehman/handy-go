#!/usr/bin/env node
/**
 * Bootstrap Appwrite Project
 * Creates the project via Console API, then generates appwrite.config.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read CLI session
const prefsPath = join(process.env.USERPROFILE || process.env.HOME, '.appwrite', 'prefs.json');
const prefs = JSON.parse(readFileSync(prefsPath, 'utf8'));
const currentSession = prefs[prefs.current];
if (!currentSession?.cookie) {
  console.error('No active Appwrite CLI session. Run: appwrite login');
  process.exit(1);
}

// Extract session cookie value
const cookieMatch = currentSession.cookie.match(/a_session_console=[^;]+/);
const sessionCookie = cookieMatch ? cookieMatch[0] : '';

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const ORG_ID = '699899ae48dce39056dc';
const PROJECT_ID = 'handygo';
const PROJECT_NAME = 'Handy Go';

function apiCall(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        'X-Appwrite-Project': 'console',
        'X-Fallback-Cookies': JSON.stringify({ [`a_session_console`]: sessionCookie.split('=').slice(1).join('=') }),
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
  console.log('🚀 Bootstrapping Handy Go Appwrite project...\n');

  // Step 1: Try to create project (or check if it exists)
  let project;
  try {
    console.log('📦 Creating project...');
    project = await apiCall('POST', '/projects', {
      projectId: PROJECT_ID,
      name: PROJECT_NAME,
      teamId: ORG_ID,
      region: 'fra',
      description: 'On-demand home services platform for Pakistan',
    });
    console.log(`✅ Project created: ${project.$id}`);
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('409')) {
      console.log('ℹ️  Project already exists, fetching...');
      project = await apiCall('GET', `/projects/${PROJECT_ID}`);
      console.log(`✅ Using existing project: ${project.$id}`);
    } else {
      console.error('❌ Failed to create project:', err.message);
      process.exit(1);
    }
  }

  const projectId = project.$id || PROJECT_ID;

  // Step 2: Create API key for server-side access
  let apiKey;
  try {
    console.log('\n🔑 Creating API key...');
    apiKey = await apiCall('POST', `/projects/${projectId}/keys`, {
      name: 'Handy Go Server Key',
      scopes: [
        'users.read', 'users.write',
        'databases.read', 'databases.write',
        'collections.read', 'collections.write',
        'documents.read', 'documents.write',
        'attributes.read', 'attributes.write',
        'indexes.read', 'indexes.write',
        'buckets.read', 'buckets.write',
        'files.read', 'files.write',
        'functions.read', 'functions.write',
        'execution.read', 'execution.write',
        'messaging.read', 'messaging.write',
        'locale.read',
        'avatars.read',
        'health.read',
        'teams.read', 'teams.write',
      ],
      expire: '', // No expiry
    });
    console.log(`✅ API key created: ${apiKey.$id}`);
    console.log(`   Secret: ${apiKey.secret}`);
  } catch (err) {
    console.warn('⚠️  API key creation failed (may already exist):', err.message);
  }

  // Step 3: Enable auth methods
  try {
    console.log('\n🔐 Configuring auth methods...');
    await apiCall('PATCH', `/projects/${projectId}/auth/limit`, { limit: 0 });
    await apiCall('PATCH', `/projects/${projectId}/auth/duration`, { duration: 604800 });
    console.log('✅ Auth configured');
  } catch (err) {
    console.warn('⚠️  Auth config failed:', err.message);
  }

  // Step 4: Add platform entries for Flutter & Web apps
  try {
    console.log('\n📱 Adding platform entries...');

    // Android - Customer App
    await apiCall('POST', `/projects/${projectId}/platforms`, {
      type: 'flutter-android',
      name: 'Handy Go Customer (Android)',
      key: 'com.handygo.customer_app',
    });
    console.log('  ✅ Android customer app platform added');

    // Android - Worker App
    await apiCall('POST', `/projects/${projectId}/platforms`, {
      type: 'flutter-android',
      name: 'Handy Go Worker (Android)',
      key: 'com.handygo.worker_app',
    });
    console.log('  ✅ Android worker app platform added');

    // iOS - Customer App
    await apiCall('POST', `/projects/${projectId}/platforms`, {
      type: 'flutter-ios',
      name: 'Handy Go Customer (iOS)',
      key: 'com.handygo.customerApp',
    });
    console.log('  ✅ iOS customer app platform added');

    // iOS - Worker App
    await apiCall('POST', `/projects/${projectId}/platforms`, {
      type: 'flutter-ios',
      name: 'Handy Go Worker (iOS)',
      key: 'com.handygo.workerApp',
    });
    console.log('  ✅ iOS worker app platform added');

    // Web - Admin Panel
    await apiCall('POST', `/projects/${projectId}/platforms`, {
      type: 'web',
      name: 'Handy Go Admin Panel',
      hostname: 'localhost',
    });
    console.log('  ✅ Web admin panel platform added');

    // Web - Admin Panel (production)
    await apiCall('POST', `/projects/${projectId}/platforms`, {
      type: 'web',
      name: 'Handy Go Admin (Production)',
      hostname: '*.appwrite.io',
    });
    console.log('  ✅ Web admin (production) platform added');
  } catch (err) {
    console.warn('⚠️  Some platforms may already exist:', err.message);
  }

  // Step 5: Write appwrite.config.json
  const config = {
    projectId,
    endpoint: ENDPOINT,
    projectName: PROJECT_NAME,
  };
  writeFileSync(join(__dirname, 'appwrite.config.json'), JSON.stringify(config, null, 4));
  console.log('\n📝 appwrite.config.json written');

  // Step 6: Update .env.appwrite with project ID and API key
  let envContent = readFileSync(join(__dirname, '.env.appwrite'), 'utf8');
  envContent = envContent.replace(/APPWRITE_PROJECT_ID=.*/, `APPWRITE_PROJECT_ID=${projectId}`);
  if (apiKey?.secret) {
    envContent = envContent.replace(/APPWRITE_API_KEY=.*/, `APPWRITE_API_KEY=${apiKey.secret}`);
  }
  writeFileSync(join(__dirname, '.env.appwrite'), envContent);
  console.log('📝 .env.appwrite updated\n');

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('  Handy Go — Appwrite Bootstrap Complete');
  console.log('═══════════════════════════════════════');
  console.log(`  Project ID:  ${projectId}`);
  console.log(`  Endpoint:    ${ENDPOINT}`);
  console.log(`  Organization: ${ORG_ID}`);
  if (apiKey?.secret) {
    console.log(`  API Key:     ${apiKey.secret.substring(0, 20)}...`);
  }
  console.log('═══════════════════════════════════════\n');
  console.log('Next steps:');
  console.log('  1. Run: node setup-appwrite.mjs   (creates DB, collections, buckets)');
  console.log('  2. Run: appwrite push functions    (deploy serverless functions)');
}

main().catch(console.error);
