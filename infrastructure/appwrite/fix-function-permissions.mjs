#!/usr/bin/env node

/**
 * Fix email_otp function execute permissions.
 * Sets execute permission to "any" so unauthenticated users can call the function.
 */

import { Client, Functions } from 'node-appwrite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const functions = new Functions(client);

async function main() {
  const functionId = 'email_otp';

  // First, get current function details
  console.log(`Fetching function ${functionId}...`);
  const fn = await functions.get(functionId);
  console.log(`Current execute permissions: ${JSON.stringify(fn.execute)}`);
  console.log(`Function name: ${fn.name}`);
  console.log(`Runtime: ${fn.runtime}`);

  // Update function with 'any' execute permission
  console.log(`\nUpdating execute permissions to ['any']...`);
  const updated = await functions.update(
    functionId,
    fn.name,
    fn.runtime,
    ['any'],          // execute permissions - allow anyone (including guests)
    fn.events,
    fn.schedule,
    fn.timeout,
    fn.enabled,
    fn.logging,
    fn.entrypoint,
  );

  console.log(`Updated execute permissions: ${JSON.stringify(updated.execute)}`);
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
