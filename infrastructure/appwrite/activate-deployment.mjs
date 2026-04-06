#!/usr/bin/env node
/**
 * Activate the working email_otp deployment.
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
  // List deployments to find the ready one
  const deployments = await functions.listDeployments('email_otp');

  const readyDeployment = deployments.deployments.find(d => d.status === 'ready');
  if (!readyDeployment) {
    console.error('No ready deployment found. Need to redeploy.');
    return;
  }

  console.log(`Activating ready deployment: ${readyDeployment.$id}`);

  // Update the deployment to activate it
  await functions.updateDeployment('email_otp', readyDeployment.$id);

  console.log('Done! Deployment activated.');

  // Verify
  const fn = await functions.get('email_otp');
  console.log('Function deployment:', fn.deployment);

  const updated = await functions.listDeployments('email_otp');
  for (const d of updated.deployments) {
    console.log(`  ${d.$id}: status=${d.status}, activate=${d.activate}`);
  }
}

main().catch(e => console.error('Error:', e.message));
