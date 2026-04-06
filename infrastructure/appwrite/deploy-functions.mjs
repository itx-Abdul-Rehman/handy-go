#!/usr/bin/env node
/**
 * deploy-functions.mjs — Deploy all Appwrite Functions via the SDK.
 *
 * Prerequisites:
 *   1. npm install node-appwrite (already in the infra package)
 *   2. .env.appwrite populated with your project ID, API key.
 *
 * Usage:
 *   node deploy-functions.mjs [functionName]
 *
 * If no functionName argument is given, all functions are deployed.
 */

import { Client, Functions } from 'node-appwrite';
import { execSync } from 'child_process';
import { readFileSync, existsSync, unlinkSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Blob } from 'buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load env ────────────────────────────────────────────────
const envPath = resolve(__dirname, '.env.appwrite');
if (!existsSync(envPath)) {
  console.error('❌  Missing .env.appwrite');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const PROJECT_ID = env.APPWRITE_PROJECT_ID;
if (!PROJECT_ID || !env.APPWRITE_API_KEY) {
  console.error('❌  APPWRITE_PROJECT_ID or APPWRITE_API_KEY not set in .env.appwrite');
  process.exit(1);
}

// ── Appwrite SDK client ─────────────────────────────────────
const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const functions = new Functions(client);

// ── Function registry ───────────────────────────────────────
const FUNCTIONS = [
  { name: 'matching-service', id: 'matching_service', entrypoint: 'src/main.js' },
  { name: 'booking-processor', id: 'booking_processor', entrypoint: 'src/main.js' },
  { name: 'sos-analyzer', id: 'sos_analyzer', entrypoint: 'src/main.js' },
  { name: 'trust-calculator', id: 'trust_calculator', entrypoint: 'src/main.js' },
  { name: 'notification-sender', id: 'notification_sender', entrypoint: 'src/main.js' },
  { name: 'email-otp', id: 'email_otp', entrypoint: 'src/main.js' },
];

// ── Deploy logic ────────────────────────────────────────────
async function deployFunction(fn) {
  const funcDir = resolve(__dirname, 'functions', fn.name);
  console.log(`\n🚀  Deploying ${fn.name} (${fn.id}) ...`);

  if (!existsSync(funcDir)) {
    console.error(`   ❌  Directory not found: ${funcDir}`);
    return false;
  }

  // Install dependencies
  const pkgJson = resolve(funcDir, 'package.json');
  if (existsSync(pkgJson)) {
    console.log('   📦  Installing dependencies...');
    try {
      execSync('npm install --omit=dev --silent', { cwd: funcDir, stdio: 'pipe' });
    } catch (e) {
      console.error(`   ⚠️  npm install warning: ${e.message}`);
    }
  }

  // Create tar.gz archive (Windows has tar since Win10 1803)
  const tarFile = resolve(__dirname, `${fn.name}.tar.gz`);
  try {
    if (existsSync(tarFile)) unlinkSync(tarFile);
    console.log('   📁  Creating archive...');
    // --force-local prevents Windows tar from interpreting D: as a remote host
    // Note: Windows 10+ built-in tar doesn't support --force-local, so we cd first
    execSync(`tar -czf "${tarFile}" -C "${funcDir}" .`, { stdio: 'pipe' });
  } catch (e) {
    console.error(`   ❌  Failed to create archive: ${e.message}`);
    return false;
  }

  // Upload deployment via SDK
  try {
    const fileSize = statSync(tarFile).size;
    console.log(`   ☁️   Uploading to Appwrite Cloud (${(fileSize / 1024).toFixed(1)} KB)...`);

    // node-appwrite v14 chunkedUpload expects `instanceof File` (Web API File).
    // Node.js 20+ provides the global File class.
    const buffer = readFileSync(tarFile);
    const file = new File([buffer], `${fn.name}.tar.gz`, { type: 'application/gzip' });

    const deployment = await functions.createDeployment(
      fn.id,
      file,
      true, // activate
      fn.entrypoint,
    );
    console.log(`   ✅  ${fn.name} deployed! (deployment: ${deployment.$id})`);
    return true;
  } catch (e) {
    console.error(`   ❌  Failed to deploy ${fn.name}: ${e.message}`);
    if (e.response) console.error('      Response:', JSON.stringify(e.response, null, 2));
    return false;
  } finally {
    if (existsSync(tarFile)) unlinkSync(tarFile);
  }
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('   Handy Go — Appwrite Functions Deployment');
  console.log('═══════════════════════════════════════════════');
  console.log(`   Project: ${PROJECT_ID}`);

  const target = process.argv[2];
  let toDeploy = FUNCTIONS;
  if (target) {
    toDeploy = FUNCTIONS.filter((f) => f.name === target);
    if (toDeploy.length === 0) {
      console.error(`\n❌  Unknown function: "${target}"`);
      console.log(`   Available: ${FUNCTIONS.map((f) => f.name).join(', ')}`);
      process.exit(1);
    }
  }

  let success = 0;
  let failed = 0;

  for (const fn of toDeploy) {
    if (await deployFunction(fn)) {
      success++;
    } else {
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`   Results: ${success} deployed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════');
}

main();
