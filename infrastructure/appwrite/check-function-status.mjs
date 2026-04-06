#!/usr/bin/env node
/**
 * Check the status of the email_otp function deployment.
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
  const fn = await functions.get('email_otp');
  console.log('Function:', fn.name);
  console.log('Status:', fn.status);
  console.log('Enabled:', fn.enabled);

  const deployments = await functions.listDeployments('email_otp');
  for (const d of deployments.deployments) {
    console.log(`\nDeployment ${d.$id}:`);
    console.log('  Status:', d.status);
    console.log('  Active:', d.activate);
    console.log('  Size:', d.size);
    console.log('  Created:', d.$createdAt);
  }
}

main().catch(e => console.error('Error:', e.message));
