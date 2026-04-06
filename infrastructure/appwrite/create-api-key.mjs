#!/usr/bin/env node
/**
 * Create API Key with correct scopes for Appwrite v1.6+
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));

const prefsPath = join(process.env.USERPROFILE || process.env.HOME, '.appwrite', 'prefs.json');
const prefs = JSON.parse(readFileSync(prefsPath, 'utf8'));
const currentSession = prefs[prefs.current];
const cookieMatch = currentSession.cookie.match(/a_session_console=[^;]+/);
const sessionCookie = cookieMatch[0];

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = 'handygo';

function apiCall(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        'X-Appwrite-Project': 'console',
      },
    };
    if (body) {
      const data = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error(`${res.statusCode}: ${parsed.message || data}`));
          else resolve(parsed);
        } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // All valid scopes for Appwrite Cloud (from error message)
  const scopes = [
    'sessions.write',
    'users.read', 'users.write',
    'teams.read', 'teams.write',
    'databases.read', 'databases.write',
    'collections.read', 'collections.write',
    'tables.read', 'tables.write',
    'attributes.read', 'attributes.write',
    'columns.read', 'columns.write',
    'indexes.read', 'indexes.write',
    'documents.read', 'documents.write',
    'rows.read', 'rows.write',
    'files.read', 'files.write',
    'buckets.read', 'buckets.write',
    'functions.read', 'functions.write',
    'sites.read', 'sites.write',
    'execution.read', 'execution.write',
    'locale.read',
    'avatars.read',
    'health.read',
    'providers.read', 'providers.write',
    'messages.read', 'messages.write',
    'topics.read', 'topics.write',
    'subscribers.read', 'subscribers.write',
    'targets.read', 'targets.write',
    'rules.read', 'rules.write',
    'tokens.read', 'tokens.write',
    'domains.read', 'domains.write',
    'events.read',
  ];

  console.log('🔑 Creating API key with all scopes...');
  const apiKey = await apiCall('POST', `/projects/${PROJECT_ID}/keys`, {
    name: 'Handy Go Full Access',
    scopes,
  });
  console.log(`✅ API key created: ${apiKey.$id}`);
  console.log(`   Secret: ${apiKey.secret}`);

  // Update .env.appwrite
  let envContent = readFileSync(join(__dirname, '.env.appwrite'), 'utf8');
  envContent = envContent.replace(/APPWRITE_API_KEY=.*/, `APPWRITE_API_KEY=${apiKey.secret}`);
  writeFileSync(join(__dirname, '.env.appwrite'), envContent);
  console.log('📝 .env.appwrite updated with API key');
}

main().catch(console.error);
