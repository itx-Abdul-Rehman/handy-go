#!/usr/bin/env node
/**
 * deploy-admin-site.mjs — Deploy admin panel as an Appwrite Site.
 *
 * Usage: node deploy-admin-site.mjs
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load credentials ────────────────────────────────────────
const envPath = resolve(__dirname, '.env.appwrite');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l.length > 0 && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const prefs = JSON.parse(
  readFileSync(resolve(process.env.USERPROFILE, '.appwrite', 'prefs.json'), 'utf8')
);
const cookie = prefs.cookie;
const PROJECT_ID = env.APPWRITE_PROJECT_ID;
const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';

// ── Helper: Console API call ────────────────────────────────
async function apiCall(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': env.APPWRITE_API_KEY,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${ENDPOINT}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('   Handy Go — Admin Panel Site Deployment');
  console.log('════════════════════════════════════════════════\n');

  const SITE_ID = 'admin_panel';
  const adminDir = resolve(__dirname, '..', '..', 'apps', 'admin-panel');

  // 1. Don't pre-build — Appwrite will build it
  console.log('1. Preparing admin panel source...\n');

  // 2. Create or get the site
  let site;
  try {
    site = await apiCall('GET', `/sites/${SITE_ID}`);
    console.log(`2. Site already exists: ${site.$id}\n`);
  } catch (e) {
    console.log('2. Creating site...');
    try {
      site = await apiCall('POST', '/sites', {
        siteId: SITE_ID,
        name: 'Handy Go Admin Panel',
        framework: 'vite',
        buildRuntime: 'node-22',
        installCommand: 'pnpm install',
        buildCommand: 'pnpm build',
        outputDirectory: 'dist',
        specification: 's-1vcpu-512mb',
      });
      console.log(`   Created site: ${site.$id}\n`);
    } catch (createErr) {
      console.error('   Failed to create site:', createErr.message);
      process.exit(1);
    }
  }

  // 3. Create a tar.gz of the full source directory (excluding node_modules, dist, build)
  console.log('3. Creating source archive...');
  const tarFile = resolve(__dirname, 'admin-panel-dist.tar.gz');
  if (existsSync(tarFile)) {
    execSync(`del "${tarFile}"`, { stdio: 'pipe', shell: 'cmd.exe' });
  }
  // Exclude heavy directories that Appwrite will regenerate
  execSync(
    `tar -czf "${tarFile}" -C "${adminDir}" --exclude=node_modules --exclude=dist --exclude=build --exclude=.pnpm-store .`,
    { stdio: 'pipe' }
  );
  const fileSize = statSync(tarFile).size;
  console.log(`   Archive: ${(fileSize / 1024).toFixed(1)} KB\n`);

  // 4. Upload deployment using multipart form data
  console.log('4. Uploading deployment...');
  try {
    const fileBuffer = readFileSync(tarFile);
    const blob = new Blob([fileBuffer], { type: 'application/gzip' });
    const formData = new FormData();
    formData.append('code', blob, 'admin-panel.tar.gz');
    formData.append('activate', 'true');

    const res = await fetch(`${ENDPOINT}/sites/${SITE_ID}/deployments`, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': env.APPWRITE_API_KEY,
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed (${res.status}): ${text}`);
    }

    const deployment = await res.json();
    console.log(`   Deployed! Deployment ID: ${deployment.$id}`);
    console.log(`   Status: ${deployment.status}`);

    if (site.subdomain) {
      console.log(`\n   🌐 Your admin panel will be available at:`);
      console.log(`   https://${site.subdomain}.appwrite.global`);
    }
  } catch (err) {
    console.error('   Failed to upload:', err.message);
  }

  // Cleanup
  try {
    execSync(`del "${tarFile}"`, { stdio: 'pipe', shell: 'cmd.exe' });
  } catch {}

  console.log('\n════════════════════════════════════════════════');
  console.log('   Done!');
  console.log('════════════════════════════════════════════════');
}

main();
