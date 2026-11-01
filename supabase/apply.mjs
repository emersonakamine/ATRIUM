// Aplica supabase/schema.sql via Supabase Management API
// Uso: SUPABASE_ACCESS_TOKEN=sbp_... node supabase/apply.mjs
import { readFileSync } from 'node:fs';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'spyqcxpbtbjcrkctqfby';
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error('Defina SUPABASE_ACCESS_TOKEN no ambiente (ou no .env).');
  process.exit(1);
}

const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');

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

console.log('Schema aplicado com sucesso.');
console.log(JSON.stringify(data).slice(0, 800));
