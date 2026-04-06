#!/usr/bin/env node
/**
 * setup-messaging.mjs — Configure Appwrite Messaging topics.
 *
 * Creates messaging topics for push notifications.
 * FCM provider should be added later when Firebase project is configured.
 *
 * Usage: node setup-messaging.mjs
 */

import { Client, Messaging, ID } from 'node-appwrite';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load env ────────────────────────────────────────────────
const envPath = resolve(__dirname, '.env.appwrite');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const messaging = new Messaging(client);

// ── Topics to create ────────────────────────────────────────
const TOPICS = [
  {
    id: 'booking_updates',
    name: 'Booking Updates',
    description: 'Notifications about booking status changes, worker assignments, etc.',
  },
  {
    id: 'sos_alerts',
    name: 'SOS Alerts',
    description: 'Emergency/SOS alert notifications for admins',
  },
  {
    id: 'promotions',
    name: 'Promotions',
    description: 'Promotional offers and announcements',
  },
  {
    id: 'system_updates',
    name: 'System Updates',
    description: 'System maintenance and update notifications',
  },
];

// ── Create topics ───────────────────────────────────────────
async function createTopics() {
  console.log('════════════════════════════════════════════════');
  console.log('   Handy Go — Appwrite Messaging Setup');
  console.log('════════════════════════════════════════════════\n');

  // Check existing topics
  let existingTopics = [];
  try {
    const list = await messaging.listTopics();
    existingTopics = list.topics.map((t) => t.$id);
    console.log(`   Found ${existingTopics.length} existing topics\n`);
  } catch (e) {
    console.log('   No existing topics found\n');
  }

  for (const topic of TOPICS) {
    if (existingTopics.includes(topic.id)) {
      console.log(`   ⏭️  Topic "${topic.name}" already exists`);
      continue;
    }
    try {
      await messaging.createTopic(topic.id, topic.name);
      console.log(`   ✅  Created topic: ${topic.name} (${topic.id})`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`   ⏭️  Topic "${topic.name}" already exists`);
      } else {
        console.error(`   ❌  Failed to create topic "${topic.name}": ${e.message}`);
      }
    }
  }

  // Check for existing providers
  console.log('\n── Providers ──');
  try {
    const providers = await messaging.listProviders();
    if (providers.providers.length === 0) {
      console.log('   No messaging providers configured yet.');
      console.log('   To add FCM (free push notifications):');
      console.log('   1. Create a Firebase project at https://console.firebase.google.com');
      console.log('   2. Enable Cloud Messaging');
      console.log('   3. Download the service account JSON');
      console.log('   4. Run: node setup-fcm-provider.mjs <path-to-service-account.json>');
    } else {
      for (const p of providers.providers) {
        console.log(`   ✅  Provider: ${p.name} (${p.type}) - ${p.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  } catch (e) {
    console.log('   Could not list providers: ' + e.message);
  }

  console.log('\n════════════════════════════════════════════════');
  console.log('   Messaging setup complete!');
  console.log('════════════════════════════════════════════════');
}

createTopics();
