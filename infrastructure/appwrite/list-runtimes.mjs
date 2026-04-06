import { readFileSync } from 'fs';
import https from 'https';
import { homedir } from 'os';

const prefs = JSON.parse(readFileSync(homedir() + '/.appwrite/prefs.json', 'utf8'));
const session = prefs[prefs.current];
const cookie = session.cookie.split(';')[0];

https.get({
  hostname: 'cloud.appwrite.io',
  path: '/v1/functions/runtimes',
  headers: {
    'X-Appwrite-Project': 'handygo',
    'X-Appwrite-Mode': 'admin',
    'Cookie': cookie,
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const j = JSON.parse(d);
    j.runtimes
      .filter(r => r.key.includes('node'))
      .forEach(r => console.log(`${r['$id']}  (${r.name} ${r.version})`));
  });
});
