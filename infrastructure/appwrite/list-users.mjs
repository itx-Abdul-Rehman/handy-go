import { Client, Users } from 'node-appwrite';
import fs from 'fs';

const envContent = fs.readFileSync('.env.appwrite', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.replace(/\r$/, '').match(/^([A-Z_]+)=(.*)/);
  if (m) env[m[1]] = m[2].trim();
});

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const users = new Users(client);

const result = await users.list([], '');
console.log(`Total users: ${result.total}\n`);
for (const u of result.users) {
  console.log(`ID: ${u.$id} | Email: ${u.email} | Status: ${u.status} | Labels: ${JSON.stringify(u.labels)} | Name: ${u.name}`);
}
