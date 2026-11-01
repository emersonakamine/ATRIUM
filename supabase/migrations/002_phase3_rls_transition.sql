-- Fase 3 (transitório): frontend ainda sem Supabase Auth.
-- 1) Login lê users antes de sessão -> read público (como no Firestore antigo)
-- 2) Escritas abertas para anon+authenticated (paridade com as regras antigas)
--    => Fase 4 (Auth) fecha isso: volta auth_write_* e remove a coluna password.
alter table public.users
  add column if not exists "password" text;

drop policy if exists "auth_read_users" on public.users;
create policy "public_read_users" on public.users
  for select using (true);

drop policy if exists "auth_write_events" on public.events;
drop policy if exists "auth_write_guests" on public.guests;
drop policy if exists "auth_write_categories" on public.categories;
drop policy if exists "auth_write_audit" on public.audit_logs;
drop policy if exists "auth_write_users" on public.users;

create policy "phase3_open_write_events" on public.events
  for all to anon, authenticated using (true) with check (true);
create policy "phase3_open_write_guests" on public.guests
  for all to anon, authenticated using (true) with check (true);
create policy "phase3_open_write_categories" on public.categories
  for all to anon, authenticated using (true) with check (true);
create policy "phase3_open_write_audit" on public.audit_logs
  for all to anon, authenticated using (true) with check (true);
create policy "phase3_open_write_users" on public.users
  for all to anon, authenticated using (true) with check (true);
