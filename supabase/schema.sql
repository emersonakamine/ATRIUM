-- ============================================================
-- ATRIUM / BP Eventos — Schema inicial (Substitui Firestore)
-- Espelha src/types.ts + server/queue.ts fielmente
-- Como rodar: Supabase Dashboard > SQL Editor > Run
--   ou: SUPABASE_ACCESS_TOKEN=... node supabase/apply.mjs
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABELAS DE NEGÓCIO
-- ------------------------------------------------------------

create table if not exists public.events (
  id text primary key,
  code text,
  title text not null,
  subtitle text default '',
  description text default '',
  startDate text default '',
  endDate text default '',
  startTime text default '',
  endTime text default '',
  locationName text default '',
  address text default '',
  cityState text default '',
  maxCapacity integer default 0,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'closed')),
  coverUrl text default '',
  inviteLayout jsonb not null default '{}'::jsonb,
  aiConfig jsonb,
  landingPageConfig jsonb,
  updatedAt timestamptz default now()
);

create table if not exists public.guests (
  id text primary key,
  eventId text references public.events (id) on delete cascade,
  publicCode text not null,
  qrPayloadToken text not null,
  name text not null,
  email text default '',
  phone text default '',
  ticketCategoryId text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'viewed', 'confirmed', 'cancelled', 'blocked')),
  isCheckedIn boolean not null default false,
  checkInTimestamp text,
  checkInOperator text,
  checkInDevice text,
  checkInGate text,
  emailStatus text not null default 'not_sent'
    check (emailStatus in ('not_sent', 'sent', 'delivered', 'failed')),
  whatsappStatus text not null default 'not_sent'
    check (whatsappStatus in ('not_sent', 'sent', 'delivered', 'failed')),
  sentAt text,
  docNumber text,
  companions integer not null default 0,
  notes text,
  customData jsonb not null default '{}'::jsonb,
  qrVersion integer not null default 1,
  createdAt text default '',
  reissuedAt text
);

create table if not exists public.categories (
  id text primary key,
  eventId text references public.events (id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  badgeBg text default '#6366f1',
  badgeText text default '#ffffff',
  quota integer not null default 0,
  description text default '',
  accessZone text default '',
  validTime text default ''
);

create table if not exists public.audit_logs (
  id text primary key,
  eventId text references public.events (id) on delete set null,
  timestamp text default '',
  action text not null,
  guestId text,
  guestName text,
  publicCode text,
  operator text default '',
  device text default '',
  details text default '',
  severity text not null default 'info'
    check (severity in ('info', 'success', 'warning', 'error'))
);

create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null,
  role text not null default 'gate'
    check (role in ('admin', 'organizer', 'gate')),
  avatarUrl text,
  assignedGate text,
  assignedEventIds jsonb not null default '[]'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'pending_password', 'blocked')),
  inviteToken text,
  resetToken text,
  invitedAt text,
  passwordCreatedAt text,
  lastLoginAt text
);

-- ------------------------------------------------------------
-- 2. TABELAS DE FILA DE MENSAGENS (backend only)
--    Substituem broadcasts/messageQueue do Firestore
-- ------------------------------------------------------------

create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  eventId text,
  eventName text default '',
  title text default '',
  status text not null default 'pending'
    check (status in ('pending', 'running', 'paused', 'completed', 'cancelled')),
  totalGuests integer not null default 0,
  sentCount integer not null default 0,
  failedCount integer not null default 0,
  delayMin integer not null default 15,
  delayMax integer not null default 45,
  messageTemplate text default '',
  createdAt timestamptz not null default now(),
  createdBy text default ''
);

create table if not exists public.message_queue (
  id uuid primary key default gen_random_uuid(),
  broadcastId uuid not null references public.broadcasts (id) on delete cascade,
  guestId text,
  guestName text default '',
  phone text default '',
  publicCode text default '',
  message text default '',
  status text not null default 'queued'
    check (status in ('queued', 'sending', 'sent', 'failed', 'paused', 'cancelled')),
  attempts integer not null default 0,
  maxAttempts integer not null default 3,
  lastError text,
  createdAt timestamptz not null default now(),
  sentAt timestamptz,
  seq integer not null default 0
);

-- ------------------------------------------------------------
-- 3. ÍNDICES (consultas do App.tsx + fila)
-- ------------------------------------------------------------

create unique index if not exists events_code_idx on public.events (code);
create index if not exists guests_public_code_idx on public.guests (publicCode);
create unique index if not exists guests_qr_token_idx on public.guests (qrPayloadToken);
create index if not exists guests_event_idx on public.guests (eventId);
create index if not exists guests_status_idx on public.guests (status);
create index if not exists categories_event_idx on public.categories (eventId);
create index if not exists audit_logs_event_idx on public.audit_logs (eventId);
create index if not exists audit_logs_timestamp_idx on public.audit_logs (timestamp desc);
create index if not exists users_email_idx on public.users (email);
create index if not exists broadcasts_event_idx on public.broadcasts (eventId);
create unique index if not exists message_queue_pending_idx
  on public.message_queue (status, seq)
  where status = 'queued';
create index if not exists message_queue_broadcast_idx
  on public.message_queue (broadcastId, status);

-- ------------------------------------------------------------
-- 4. RLS (row-level security) — corrige as regras do Firestore
--    leitura pública nas páginas de convite,
--    escrita só autenticada,
--    fila só via service_role (backend),
--    users sem leitura anônima (diferente do Firestore!)
-- ------------------------------------------------------------

alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.categories enable row level security;
alter table public.audit_logs enable row level security;
alter table public.users enable row level security;
alter table public.broadcasts enable row level security;
alter table public.message_queue enable row level security;

-- Leitura pública (rotas /convite, /portaria sem login)
create policy "public_read_events" on public.events
  for select using (true);
create policy "public_read_guests" on public.guests
  for select using (true);
create policy "public_read_categories" on public.categories
  for select using (true);
create policy "public_read_audit" on public.audit_logs
  for select using (true);

-- Escrita apenas autenticado (painel logado)
create policy "auth_write_events" on public.events
  for all to authenticated using (true) with check (true);
create policy "auth_write_guests" on public.guests
  for all to authenticated using (true) with check (true);
create policy "auth_write_categories" on public.categories
  for all to authenticated using (true) with check (true);
create policy "auth_write_audit" on public.audit_logs
  for all to authenticated using (true) with check (true);

-- Users: SEM leitura anônima (o Firestore deixava!); só equipe logada
create policy "auth_read_users" on public.users
  for select to authenticated using (true);
create policy "auth_write_users" on public.users
  for all to authenticated using (true) with check (true);

-- broadcasts/message_queue: NENHUMA policy (só service_role do backend)

-- ------------------------------------------------------------
-- 5. REALTIME (substitui onSnapshot do Firestore)
-- ------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.events;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.guests;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.categories;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.audit_logs;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.users;
exception when duplicate_object then null;
end $$;
