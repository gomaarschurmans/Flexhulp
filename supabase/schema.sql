-- =========================================================
-- Flexhulp schema — plak dit volledig in Supabase Dashboard > SQL Editor > Run
-- =========================================================
create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  phone text,
  address text,
  bio text,
  role text not null default 'client' check (role in ('client','student','admin')),
  banned boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ---------- platform_settings (1 rij: het platformbrede uurtarief) ----------
create table public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  hourly_rate numeric(10,2) not null default 15.00 check (hourly_rate > 0),
  cancellation_notice_hours integer not null default 24 check (cancellation_notice_hours >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
insert into public.platform_settings (id, hourly_rate) values (1, 15.00);
alter table public.platform_settings enable row level security;

-- ---------- availability (tijdvensters die de admin vrijgeeft; klanten
-- boeken zelf een sub-tijdstip binnen zo'n venster via book_time_range(),
-- meerdere boekingen per venster zijn dus mogelijk) ----------
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint availability_time_order check (end_time > start_time)
);
alter table public.availability enable row level security;
alter publication supabase_realtime add table public.availability;

-- ---------- tasks ----------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
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
  description text not null default '',
  date date not null,
  time time not null,
  end_time time not null,
  location text not null,
  city text not null default '',
  hours numeric(5,2) not null check (hours > 0),
  constraint tasks_half_hour_times check (
    extract(minute from time) in (0, 30)
    and extract(minute from end_time) in (0, 30)
  ),
  rate_at_creation numeric(10,2) not null,
  client_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  student_id uuid references public.profiles(id) on delete set null,
  student_name text,
  student_email text,
  status text not null default 'open' check (status in ('open','accepted','done')),
  extra_info text not null default '',
  rating smallint check (rating between 1 and 5),
  review_comment text,
  window_id uuid references public.availability(id) on delete set null,
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending','paid','failed','expired','canceled')),
  mollie_payment_id text,
  paid_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz
);
alter table public.tasks enable row level security;
alter publication supabase_realtime add table public.tasks;

-- =========================================================
-- Helper: rol van de ingelogde gebruiker (SECURITY DEFINER voorkomt RLS-recursie op profiles)
-- =========================================================
create or replace function public.get_my_role()
returns text language sql security definer set search_path = public stable as $$
  select role from public.profiles where id = auth.uid();
$$;
grant execute on function public.get_my_role() to authenticated;

-- =========================================================
-- Trigger: automatisch profiel aanmaken bij signup
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  chosen_role text;
begin
  chosen_role := new.raw_user_meta_data ->> 'role';
  if chosen_role is null or chosen_role not in ('client','student') then
    chosen_role := 'client'; -- 'admin' kan nooit via signup-metadata binnenkomen
  end if;

  insert into public.profiles (id, email, name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    chosen_role
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rol-kolom afschermen: gewone gebruikers mogen enkel hun naam wijzigen.
-- Admin toekennen kan alleen via de Dashboard Table Editor (draait als postgres,
-- omzeilt deze grants en RLS).
revoke update on public.profiles from authenticated;
grant update (name, phone, address, bio) on public.profiles to authenticated;

-- =========================================================
-- Trigger: bewaakt geldige status-overgangen van een taak
-- (defense-in-depth: Postgres combineert meerdere permissieve RLS-policies
-- met OR, onafhankelijk per USING/WITH CHECK — zonder deze trigger zou een
-- student in theorie een open taak direct naar 'done' kunnen zetten)
-- =========================================================
create or replace function public.enforce_task_transitions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Geen ingelogde gebruiker in context = een service-role/backend-operatie
  -- (bv. accountverwijdering), die al buiten RLS om vertrouwd wordt.
  if auth.uid() is null then
    return new;
  end if;

  if public.get_my_role() = 'admin' then
    return new;
  end if;

  if public.get_my_role() = 'client' then
    if old.client_id <> auth.uid() then
      raise exception 'Dit is niet jouw taak.';
    end if;

    -- Eigen open taak bewerken: enkel beschrijvende velden mogen wijzigen.
    -- payment_status/mollie_payment_id/paid_at zijn hier ook geblokkeerd:
    -- enkel de backend (service-role, die deze trigger overslaat) mag een
    -- betaling aanmaken of bevestigen.
    if old.status = 'open' and new.status = 'open' then
      if new.date <> old.date or new.time <> old.time or new.end_time <> old.end_time
         or new.hours <> old.hours or new.rate_at_creation <> old.rate_at_creation
         or new.client_id <> old.client_id or new.student_id is not null
         or new.window_id is distinct from old.window_id
         or new.rating is distinct from old.rating
         or new.review_comment is distinct from old.review_comment
         or new.payment_status is distinct from old.payment_status
         or new.mollie_payment_id is distinct from old.mollie_payment_id
         or new.paid_at is distinct from old.paid_at then
        raise exception 'Deze velden mag je niet aanpassen.';
      end if;
      return new;
    end if;

    -- Eigen voltooide taak beoordelen: enkel rating/review_comment mogen wijzigen.
    if old.status = 'done' and new.status = 'done' then
      if new.date <> old.date or new.time <> old.time or new.end_time <> old.end_time
         or new.hours <> old.hours or new.rate_at_creation <> old.rate_at_creation
         or new.category <> old.category or new.description <> old.description
         or new.location <> old.location or new.extra_info <> old.extra_info
         or new.student_id is distinct from old.student_id
         or new.payment_status is distinct from old.payment_status
         or new.mollie_payment_id is distinct from old.mollie_payment_id
         or new.paid_at is distinct from old.paid_at then
        raise exception 'Deze velden mag je niet aanpassen.';
      end if;
      return new;
    end if;

    raise exception 'Ongeldige aanpassing.';
  end if;

  -- Een student kan zichzelf niet aan een taak toewijzen: de klant kiest en
  -- wijst toe via de acceptStudent() server action (service-role).
  if old.status = 'accepted' and new.status = 'done' then
    if old.student_id is distinct from auth.uid() then
      raise exception 'Dit is niet jouw opdracht.';
    end if;
    if new.student_id is distinct from old.student_id then
      raise exception 'De toegewezen student kan niet gewijzigd worden.';
    end if;
    return new;
  end if;

  raise exception 'Ongeldige statuswijziging.';
end;
$$;
create trigger tasks_enforce_transitions
  before update on public.tasks
  for each row execute function public.enforce_task_transitions();

-- =========================================================
-- RLS — profiles
-- =========================================================
create policy "profiles_select_own_or_admin" on public.profiles for select
  to authenticated using (id = auth.uid() or public.get_my_role() = 'admin');

create policy "profiles_update_own" on public.profiles for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- =========================================================
-- RLS — platform_settings
-- =========================================================
create policy "settings_select_all_authenticated" on public.platform_settings for select
  to authenticated using (true);

create policy "settings_update_admin_only" on public.platform_settings for update
  to authenticated using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- =========================================================
-- RLS — availability
-- Klanten krijgen geen rechtstreeks schrijfrecht: boeken loopt uitsluitend
-- via de SECURITY DEFINER-functie book_time_range() hieronder.
-- =========================================================
create policy "availability_select_all_authenticated" on public.availability for select
  to authenticated using (true);

create policy "availability_admin_write" on public.availability for all
  to authenticated using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- =========================================================
-- Functie: race-safe een eigen tijdstip boeken binnen een vrijgegeven venster.
-- Beschikbaarheid wordt altijd dynamisch berekend (venster minus bestaande
-- boekingen) — een taak verwijderen maakt dus automatisch weer ruimte vrij,
-- zonder aparte trigger nodig te hebben.
-- =========================================================
create or replace function public.book_time_range(
  p_window_id uuid,
  p_start_time time,
  p_end_time time,
  p_category text,
  p_description text,
  p_location text,
  p_extra_info text,
  p_city text
) returns public.tasks
language plpgsql security definer set search_path = public as $$
declare
  v_window  record;
  v_rate    numeric(10,2);
  v_hours   numeric(5,2);
  v_profile record;
  v_overlap boolean;
  v_task    public.tasks;
begin
  if public.get_my_role() <> 'client' then
    raise exception 'Alleen klanten kunnen een tijdstip boeken.';
  end if;

  select id, name, email, phone, banned into v_profile
  from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Profiel niet gevonden.';
  end if;
  if v_profile.banned then
    raise exception 'Je account is geblokkeerd. Neem contact op met Flexhulp.';
  end if;

  if p_category not in (
    'Tuinonderhoud','Auto naar carwash','Boodschappen doen',
    'Planten water geven (vakantie)','Hond eten geven (vakantie)',
    'Hond uitlaten (korte wandeling)','Helpen op een feest',
    'Op- en afbouw evenement','Gezelschap houden','Kleine verhuis'
  ) then
    raise exception 'Ongeldige categorie.';
  end if;

  if p_end_time <= p_start_time then
    raise exception 'Eindtijd moet na starttijd liggen.';
  end if;

  -- Rij-lock op het venster: seriële afhandeling van gelijktijdige
  -- boekingspogingen binnen hetzelfde venster.
  select * into v_window from public.availability where id = p_window_id for update;
  if not found then
    raise exception 'Tijdvenster bestaat niet.';
  end if;
  if p_start_time < v_window.start_time or p_end_time > v_window.end_time then
    raise exception 'Kies een tijdstip binnen het beschikbare venster.';
  end if;

  select exists (
    select 1 from public.tasks
    where date = v_window.slot_date
      and time < p_end_time
      and end_time > p_start_time
  ) into v_overlap;
  if v_overlap then
    raise exception 'Dit tijdstip overlapt met een al bestaande boeking.';
  end if;

  v_hours := extract(epoch from (p_end_time - p_start_time)) / 3600.0;
  select hourly_rate into v_rate from public.platform_settings where id = 1;

  insert into public.tasks (
    title, category, description, date, time, end_time, location, city, hours,
    rate_at_creation, client_id, client_name, client_email, client_phone,
    status, extra_info, window_id
  ) values (
    p_category, p_category, p_description, v_window.slot_date, p_start_time, p_end_time,
    p_location, coalesce(p_city, ''), v_hours, v_rate, v_profile.id, v_profile.name,
    v_profile.email, v_profile.phone,
    'open', coalesce(p_extra_info, ''), p_window_id
  ) returning * into v_task;

  return v_task;
end;
$$;
revoke all on function public.book_time_range(uuid, time, time, text, text, text, text, text) from public;
grant execute on function public.book_time_range(uuid, time, time, text, text, text, text, text) to authenticated;

-- =========================================================
-- RLS — tasks
-- =========================================================
create policy "tasks_select_own_client" on public.tasks for select
  to authenticated using (client_id = auth.uid());

-- Studenten zien enkel hun TOEGEWEZEN taak volledig; open klussen zien ze
-- via task_board (zonder klantgegevens), zie onderaan.
create policy "tasks_select_assigned_student" on public.tasks for select
  to authenticated using (student_id = auth.uid());

create policy "tasks_select_admin" on public.tasks for select
  to authenticated using (public.get_my_role() = 'admin');

create policy "tasks_insert_client" on public.tasks for insert
  to authenticated with check (
    public.get_my_role() = 'client'
    and client_id = auth.uid()
    and status = 'open'
    and student_id is null
  );

create policy "tasks_delete_own_open_client" on public.tasks for delete
  to authenticated using (client_id = auth.uid() and status = 'open');

create policy "tasks_delete_admin" on public.tasks for delete
  to authenticated using (public.get_my_role() = 'admin');

-- Een student kan enkel zijn eigen toegewezen taak bijwerken (afronden);
-- de enforce_task_transitions()-trigger bewaakt accepted->done.
create policy "tasks_update_student" on public.tasks for update
  to authenticated
  using (public.get_my_role() = 'student' and student_id = auth.uid())
  with check (public.get_my_role() = 'student' and student_id = auth.uid());

create policy "tasks_update_admin" on public.tasks for update
  to authenticated using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- Klanten mogen hun eigen taak updaten (bewerken/beoordelen) — de
-- enforce_task_transitions()-trigger bepaalt exact wat toegestaan is.
create policy "tasks_update_own_client" on public.tasks for update
  to authenticated
  using (public.get_my_role() = 'client' and client_id = auth.uid())
  with check (public.get_my_role() = 'client' and client_id = auth.uid());

-- =========================================================
-- requests — losse, lichtgewicht aanvraag voor extra uren naast het
-- rechtstreeks boeken van een vrijgegeven tijdvenster. Er wordt niets
-- automatisch geboekt: de admin beslist zelf of en wanneer hij daarvoor
-- een tijdvenster vrijgeeft.
-- =========================================================
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

-- =========================================================
-- Publieke projecties van tasks, zonder persoonsgegevens, bijgehouden door
-- een trigger. tasks zelf is enkel leesbaar voor de klant, de admin en de
-- toegewezen student.
--  * task_busy: bezette tijdstippen (voor klanten die boeken)
--  * task_board: open klussen met enkel gemeente (voor studenten)
-- =========================================================
create table public.task_busy (
  id uuid primary key,
  date date not null,
  time time not null,
  end_time time not null
);
alter table public.task_busy enable row level security;
alter publication supabase_realtime add table public.task_busy;

create policy "task_busy_select_authenticated" on public.task_busy for select
  to authenticated using (true);

create table public.task_board (
  id uuid primary key,
  category text not null,
  description text not null default '',
  city text not null default '',
  date date not null,
  time time not null,
  end_time time not null,
  hours numeric(5,2) not null,
  rate_at_creation numeric(10,2) not null,
  created_at timestamptz not null
);
alter table public.task_board enable row level security;
alter publication supabase_realtime add table public.task_board;

create policy "task_board_select_student_admin" on public.task_board for select
  to authenticated using (public.get_my_role() in ('student', 'admin'));

create or replace function public.sync_task_projections()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    delete from public.task_busy where id = old.id;
    delete from public.task_board where id = old.id;
    return old;
  end if;

  insert into public.task_busy (id, date, time, end_time)
  values (new.id, new.date, new.time, new.end_time)
  on conflict (id) do update
    set date = excluded.date, time = excluded.time, end_time = excluded.end_time;

  if new.status = 'open' then
    insert into public.task_board
      (id, category, description, city, date, time, end_time, hours, rate_at_creation, created_at)
    values
      (new.id, new.category, new.description, new.city, new.date, new.time,
       new.end_time, new.hours, new.rate_at_creation, new.created_at)
    on conflict (id) do update
      set category = excluded.category, description = excluded.description,
          city = excluded.city, date = excluded.date, time = excluded.time,
          end_time = excluded.end_time, hours = excluded.hours,
          rate_at_creation = excluded.rate_at_creation;
  else
    delete from public.task_board where id = new.id;
  end if;

  return new;
end;
$$;

create trigger tasks_sync_projections
  after insert or update or delete on public.tasks
  for each row execute function public.sync_task_projections();

-- =========================================================
-- task_applications — studenten tonen interesse in een openstaande taak;
-- de klant kiest zelf wie de taak toegewezen krijgt (zie acceptStudent()
-- server action, die na verificatie via de service-role client schrijft).
-- =========================================================
create table public.task_applications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  student_name text not null,
  student_email text not null,
  student_phone text,
  -- Momentopname bij het aanmelden (zie migration_v11_student_profile.sql)
  student_bio text,
  student_jobs_done integer not null default 0,
  student_avg_rating numeric(3,2),
  student_rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (task_id, student_id)
);
alter table public.task_applications enable row level security;
alter publication supabase_realtime add table public.task_applications;

create policy "applications_select_own_student" on public.task_applications for select
  to authenticated using (student_id = auth.uid());

create policy "applications_select_task_owner" on public.task_applications for select
  to authenticated using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and t.client_id = auth.uid()
    )
  );

create policy "applications_select_admin" on public.task_applications for select
  to authenticated using (public.get_my_role() = 'admin');

create policy "applications_insert_student" on public.task_applications for insert
  to authenticated with check (
    public.get_my_role() = 'student'
    and student_id = auth.uid()
    and exists (select 1 from public.task_board tb where tb.id = task_id)
    and not exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.banned
    )
  );

create policy "applications_delete_own_student" on public.task_applications for delete
  to authenticated using (student_id = auth.uid());

create policy "applications_delete_admin" on public.task_applications for delete
  to authenticated using (public.get_my_role() = 'admin');

-- =========================================================
-- invoices — aangemaakt zodra een taak als voltooid gemarkeerd wordt
-- (markTaskDone(), via de service-role client). Vrijstellingsregeling
-- kleine ondernemingen: geen BTW. Enkel leesbaar via RLS, geschreven
-- via de backend — een uitgegeven factuur blijft onveranderlijk.
-- =========================================================
create sequence if not exists public.invoice_number_seq start 1;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number integer not null unique default nextval('invoice_number_seq'),
  task_id uuid not null unique references public.tasks(id) on delete restrict,
  client_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_address text not null default '',
  category text not null,
  description text not null default '',
  service_date date not null,
  service_time time not null,
  service_end_time time not null,
  hours numeric(5,2) not null,
  rate numeric(10,2) not null,
  total numeric(10,2) not null,
  vat_exempt boolean not null default true,
  issued_at timestamptz not null default now()
);
alter table public.invoices enable row level security;

create policy "invoices_select_own_client" on public.invoices for select
  to authenticated using (client_id = auth.uid());

create policy "invoices_select_admin" on public.invoices for select
  to authenticated using (public.get_my_role() = 'admin');
