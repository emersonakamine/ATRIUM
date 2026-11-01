// Cria os usuários seed no Supabase Auth (uma única vez).
// Uso: node --env-file=.env supabase/create-auth-users.mjs
// GoTrue exige senha >= 6 chars (não dá pra baixar o mínimo) -> senhas novas >= 6.

const url = process.env.SUPABASE_URL || 'https://spyqcxpbtbjcrkctqfby.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('Defina SUPABASE_SERVICE_ROLE_KEY no ambiente (ou no .env).');
  process.exit(1);
}

const seedUsers = [
  { email: 'admin@eventiza.com.br', password: 'admin123' },
  { email: 'bpeventos2@gmail.com', password: 'senha123' },
  { email: 'portaria1@eventiza.com.br', password: 'portaria1' },
  { email: 'emerson.akamine@bellinatiperez.com.br', password: 'senha123' },
];

for (const u of seedUsers) {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...u, email_confirm: true }),
  });
  const body = await res.text();
  if (res.status === 422 && body.toLowerCase().includes('already')) {
    console.log(`OK (já existe): ${u.email}`);
  } else if (res.ok) {
    console.log(`OK criado: ${u.email}`);
  } else {
    console.error(`FALHOU ${u.email}:`, res.status, body);
  }
}
