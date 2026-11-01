// Aplica SQL do Supabase via Management API
// Uso: node --env-file=.env supabase/apply.mjs [arquivo-relativo-a-supabase/]
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'spyqcxpbtbjcrkctqfby';
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error('Defina SUPABASE_ACCESS_TOKEN no ambiente (ou no .env).');
  process.exit(1);
}

const sqlFile = process.argv[2] || 'schema.sql';
const sqlPath = resolve(dirname(fileURLToPath(import.meta.url)), sqlFile);
const sql = readFileSync(sqlPath, 'utf8');

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  }
);

const data = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error('ERRO', res.status);
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log(`SQL aplicado com sucesso (${sqlFile}).`);
console.log(JSON.stringify(data).slice(0, 800));
