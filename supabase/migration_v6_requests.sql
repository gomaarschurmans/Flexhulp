-- ============================================================
-- Flexhulp migratie v6: aanvragen voor extra uren
-- Een los, lichtgewicht kanaal naast het rechtstreeks boeken van een
-- vrijgegeven tijdvenster: de klant geeft aan wat hij nodig denkt te
-- hebben (periode, geschatte uren, categorie, toelichting) en de admin
-- krijgt een melding. Er wordt NIETS automatisch geboekt — de admin
-- beslist zelf of en wanneer hij daarvoor een tijdvenster vrijgeeft,
-- precies zoals bij de rest van het platform.
-- ============================================================

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  category text not null check (category in (
    'Tuinonderhoud',
    'Auto naar carwash',
    'Boodschappen doen',
    'Planten water geven (vakantie)',
    'Hond eten geven (vakantie)',
    'Hond uitlaten (korte wandeling)',
    'Helpen op een feest',
    'Op- en afbouw evenement',
    'Gezelschap houden',
    'Kleine verhuis'
  )),
  estimated_hours numeric(5,2) not null check (estimated_hours > 0),
  preferred_period text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'handled')),
  created_at timestamptz not null default now()
);
alter table public.requests enable row level security;
alter publication supabase_realtime add table public.requests;

create policy "requests_select_own_client" on public.requests for select
  to authenticated using (client_id = auth.uid());

create policy "requests_select_admin" on public.requests for select
  to authenticated using (public.get_my_role() = 'admin');

create policy "requests_insert_client" on public.requests for insert
  to authenticated with check (
    public.get_my_role() = 'client'
    and client_id = auth.uid()
    and status = 'open'
    and not exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.banned
    )
  );

create policy "requests_delete_own_open_client" on public.requests for delete
  to authenticated using (client_id = auth.uid() and status = 'open');

create policy "requests_update_admin" on public.requests for update
  to authenticated using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create policy "requests_delete_admin" on public.requests for delete
  to authenticated using (public.get_my_role() = 'admin');
