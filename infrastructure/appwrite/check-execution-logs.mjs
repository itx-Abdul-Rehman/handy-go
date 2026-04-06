#!/usr/bin/env node
/**
 * Fetch recent execution logs for the email_otp function.
 */
import { Client, Functions } from 'node-appwrite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env.appwrite');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const functions = new Functions(client);

async function main() {
  const functionId = 'email_otp';

  console.log('Fetching recent executions for email_otp...\n');

  const executions = await functions.listExecutions(functionId, undefined, 5);

  for (const exec of executions.executions) {
    console.log(`=== Execution ${exec.$id} ===`);
    console.log(`  Status:     ${exec.status}`);
    console.log(`  Status Code: ${exec.responseStatusCode}`);
    console.log(`  Duration:   ${exec.duration}s`);
    console.log(`  Created:    ${exec.$createdAt}`);
    console.log(`  Trigger:    ${exec.trigger}`);
    console.log(`  Request Body: ${exec.requestBody || '(empty)'}`);
    console.log(`  Response:   ${exec.responseBody || '(empty)'}`);
    console.log(`  Stdout:     ${exec.logs || '(empty)'}`);
    console.log(`  Stderr:     ${exec.errors || '(empty)'}`);
    console.log('');
  }
}

main().catch(e => console.error('Error:', e.message));
