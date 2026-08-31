/**
 * Applies a SQL migration to the Supabase Postgres database.
 *
 *   node scripts/run-migration.mjs supabase/migrations/002_mindspark.sql
 *   node scripts/run-migration.mjs <file> --dry-run    # roll back instead of commit
 *
 * Runs inside a single transaction: if any statement fails, the whole
 * migration rolls back and the database is left exactly as it was.
 *
 * Reads SUPABASE_DB_PASSWORD and NEXT_PUBLIC_SUPABASE_URL from .env.
 * The password is never logged.
 */
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

function loadEnv() {
  const env = {};
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const file = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!file) {
  console.error('usage: node scripts/run-migration.mjs <file.sql> [--dry-run]');
  process.exit(1);
}

const env = loadEnv();
const password = env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error(
    'SUPABASE_DB_PASSWORD is not set.\n' +
      'Add it to .env from Supabase → Project Settings → Database → Database password.',
  );
  process.exit(1);
}

const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const region = env.SUPABASE_DB_REGION || 'ap-south-1';
const sql = readFileSync(file, 'utf8');

// Session-mode pooler on 5432. Supports the full SQL surface including DDL.
const candidates = [
  {
    label: `pooler ${region} (session, 5432)`,
    host: `aws-0-${region}.pooler.supabase.com`,
    port: 5432,
    user: `postgres.${ref}`,
  },
  {
    label: `pooler ${region} (session, 6543)`,
    host: `aws-0-${region}.pooler.supabase.com`,
    port: 6543,
    user: `postgres.${ref}`,
  },
  {
    label: 'direct db host',
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: 'postgres',
  },
];

async function connect() {
  const errors = [];
  for (const c of candidates) {
    const client = new Client({
      host: c.host,
      port: c.port,
      user: c.user,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
      statement_timeout: 120000,
    });
    try {
      await client.connect();
      console.log(`connected via ${c.label}`);
      return client;
    } catch (e) {
      errors.push(`  ${c.label}: ${e.message}`);
      try {
        await client.end();
      } catch {}
    }
  }
  throw new Error('could not connect:\n' + errors.join('\n'));
}

const client = await connect();
try {
  await client.query('begin');
  await client.query(sql);

  if (dryRun) {
    await client.query('rollback');
    console.log(`\nDRY RUN OK — ${file} executed cleanly, then rolled back. Nothing changed.`);
  } else {
    await client.query('commit');
    console.log(`\nAPPLIED — ${file} committed.`);
  }
} catch (e) {
  await client.query('rollback').catch(() => {});
  console.error(`\nFAILED — rolled back, database unchanged.\n${e.message}`);
  if (e.position) console.error(`at character ${e.position}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
