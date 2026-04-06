#!/usr/bin/env node
/**
 * Set environment variables on the email_otp Appwrite Function.
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

const FUNCTION_ID = 'email_otp';
const VARS = [
  { key: 'RESEND_API_KEY', value: 're_G1TX82tk_BeaP5fa3ThFDbobTwFVNkC5K' },
  { key: 'RESEND_FROM_EMAIL', value: 'onboarding@resend.dev' },
  { key: 'RESEND_FROM_NAME', value: 'Handy Go' },
  { key: 'APPWRITE_API_KEY', value: env.APPWRITE_API_KEY },
];

async function main() {
  console.log('Setting environment variables on email_otp function...\n');

  for (const v of VARS) {
    try {
      await functions.createVariable(FUNCTION_ID, v.key, v.value);
      console.log(`  ✅ Created: ${v.key}`);
    } catch (e) {
      if (e.code === 409) {
        // Already exists — update it
        const varList = await functions.listVariables(FUNCTION_ID);
        const existing = varList.variables.find(ev => ev.key === v.key);
        if (existing) {
          await functions.updateVariable(FUNCTION_ID, existing.$id, v.key, v.value);
          console.log(`  ✅ Updated: ${v.key}`);
        }
      } else {
        console.error(`  ❌ Failed: ${v.key} — ${e.message}`);
      }
    }
  }

  console.log('\nDone! Resend environment variables configured on email_otp.');
}

main().catch(e => console.error('Error:', e.message));
