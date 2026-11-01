// Seed manual do banco real (service_role) — mesma lógica do seedInitialDatabaseIfNeeded.
// Uso: node --import tsx supabase/seed-frontend.ts
import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_EVENTS,
  INITIAL_CATEGORIES,
  INITIAL_GUESTS,
  INITIAL_LOGS,
  INITIAL_USERS,
} from '../src/data/mockData';

const url = process.env.SUPABASE_URL || 'https://spyqcxpbtbjcrkctqfby.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente');

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data: events } = await admin.from('events').select('id').limit(1);
  if (events && events.length > 0) {
    console.log('events já populado — nada a fazer.');
    return;
  }

  const usersSeed = INITIAL_USERS.map((u) => {
    const { password: _p, ...rest } = u;
    return rest;
  });

  const steps: Array<[string, unknown[]]> = [
    ['events', INITIAL_EVENTS as unknown[]],
    ['categories', INITIAL_CATEGORIES as unknown[]],
    ['guests', INITIAL_GUESTS as unknown[]],
    ['audit_logs', INITIAL_LOGS as unknown[]],
    ['users', usersSeed],
  ];

  for (const [table, rows] of steps) {
    const { error } = await admin.from(table).upsert(rows as never[]);
    if (error) {
      console.error(`FALHOU ${table}:`, error.message);
      process.exit(1);
    }
    console.log(`OK ${table}: ${rows.length} linhas`);
  }
  console.log('Seed concluído.');
}

main();
