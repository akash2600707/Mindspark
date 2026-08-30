/**
 * Runs a read-only query against the Supabase database and prints the rows.
 * Used for before/after verification around migrations.
 *
 *   node scripts/db-query.mjs "select count(*) from public.questions"
 *   node scripts/db-query.mjs --file path/to/query.sql
 */
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

const env = {};
for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const region = env.SUPABASE_DB_REGION || 'ap-southeast-1';

const args = process.argv.slice(2);
const sql =
  args[0] === '--file' ? readFileSync(args[1], 'utf8') : args.join(' ');
if (!sql.trim()) {
  console.error('usage: node scripts/db-query.mjs "<sql>" | --file <path>');
  process.exit(1);
}

const client = new Client({
  host: `aws-0-${region}.pooler.supabase.com`,
  port: 5432,
  user: `postgres.${ref}`,
  password: env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

await client.connect();
try {
  // Multiple statements come back as an array of results.
  const res = await client.query(sql);
  for (const r of Array.isArray(res) ? res : [res]) {
    if (r.rows?.length) console.table(r.rows);
    else if (r.command) console.log(`${r.command} — ${r.rowCount ?? 0} row(s)`);
  }
} finally {
  await client.end();
}
