/**
 * Discovers which Supabase pooler host serves this project.
 *
 * The pooler answers "Tenant or user not found" for the wrong region and
 * either connects or reports an auth failure for the right one, so a sweep
 * identifies the host without needing the dashboard.
 *
 * Prints only hostnames and error classes — never the password.
 */
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

const env = {};
for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const password = env.SUPABASE_DB_PASSWORD;
const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];

const REGIONS = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-2',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'ca-central-1',
  'sa-east-1',
];

const targets = [];
for (const prefix of ['aws-1', 'aws-0']) {
  for (const region of REGIONS) {
    targets.push({
      host: `${prefix}-${region}.pooler.supabase.com`,
      port: 5432,
      user: `postgres.${ref}`,
      label: `${prefix}-${region}`,
    });
  }
}

async function probe(t) {
  const client = new Client({
    host: t.host,
    port: t.port,
    user: t.user,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    const { rows } = await client.query('select current_database() db, version() v');
    await client.end();
    return { ...t, status: 'CONNECTED', info: rows[0].v.split(' ').slice(0, 2).join(' ') };
  } catch (e) {
    try {
      await client.end();
    } catch {}
    const msg = e.message || '';
    if (/tenant|user not found/i.test(msg)) return { ...t, status: 'wrong-region' };
    if (/password|authentication/i.test(msg)) return { ...t, status: 'RIGHT HOST, BAD PASSWORD' };
    if (/ENOTFOUND|EAI_AGAIN/.test(msg)) return { ...t, status: 'no-such-host' };
    return { ...t, status: 'other', info: msg.slice(0, 90) };
  }
}

const results = [];
// Small batches so we don't open 32 sockets at once.
for (let i = 0; i < targets.length; i += 8) {
  const batch = await Promise.all(targets.slice(i, i + 8).map(probe));
  results.push(...batch);
  const hit = batch.find((r) => r.status !== 'wrong-region' && r.status !== 'no-such-host');
  if (hit) break;
}

const interesting = results.filter(
  (r) => r.status !== 'wrong-region' && r.status !== 'no-such-host',
);

if (interesting.length) {
  for (const r of interesting) {
    console.log(`\n>>> ${r.status}`);
    console.log(`    host: ${r.host}`);
    console.log(`    user: ${r.user}`);
    if (r.info) console.log(`    ${r.info}`);
    const region = r.label.replace(/^aws-[01]-/, '');
    const prefix = r.label.match(/^aws-[01]/)[0];
    console.log(`\n    add to .env:  SUPABASE_DB_REGION=${region}`);
    if (prefix === 'aws-1') console.log(`                  SUPABASE_DB_POOLER_PREFIX=aws-1`);
  }
} else {
  console.log('No pooler recognised this project. Summary:');
  const counts = {};
  for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
  console.log(counts);
  console.log(
    '\nGet the exact host from Supabase → Project Settings → Database → Connection string.',
  );
}
