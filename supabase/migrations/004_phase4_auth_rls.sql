-- Fase 4: Supabase Auth no ar -> fecha a janela transitória da Fase 3.
-- Escritas voltam a exigir authenticated; senha vive só no Auth (coluna removida).

drop policy if exists "phase3_open_write_events" on public.events;
drop policy if exists "phase3_open_write_guests" on public.guests;
drop policy if exists "phase3_open_write_categories" on public.categories;
drop policy if exists "phase3_open_write_audit" on public.audit_logs;
drop policy if exists "phase3_open_write_users" on public.users;

create policy "auth_write_events" on public.events
  for all to authenticated using (true) with check (true);
create policy "auth_write_guests" on public.guests
  for all to authenticated using (true) with check (true);
create policy "auth_write_categories" on public.categories
  for all to authenticated using (true) with check (true);
create policy "auth_write_audit" on public.audit_logs
  for all to authenticated using (true) with check (true);
create policy "auth_write_users" on public.users
  for all to authenticated using (true) with check (true);

-- Leitura pública de users permanece (LoginView checa status ANTES do signIn;
-- painel de convite/landing não logado). Senha não existe mais aqui.
alter table public.users drop column if exists "password";
