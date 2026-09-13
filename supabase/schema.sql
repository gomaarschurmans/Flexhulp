-- =========================================================
-- Flexhulp schema — plak dit volledig in Supabase Dashboard > SQL Editor > Run
-- =========================================================
create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'client' check (role in ('client','student','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ---------- platform_settings (1 rij: het platformbrede uurtarief) ----------
create table public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  hourly_rate numeric(10,2) not null default 15.00 check (hourly_rate > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
insert into public.platform_settings (id, hourly_rate) values (1, 15.00);
alter table public.platform_settings enable row level security;

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
  location text not null,
  hours numeric(5,2) not null check (hours > 0),
  rate_at_creation numeric(10,2) not null,
  client_id uuid not null references public.profiles(id),
  client_name text not null,
  client_email text not null,
  student_id uuid references public.profiles(id),
  student_name text,
  student_email text,
  status text not null default 'open' check (status in ('open','accepted','done')),
  extra_info text not null default '',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz
);
alter table public.tasks enable row level security;
alter publication supabase_realtime add table public.tasks;

-- ---------- availability (concrete, eenmalig boekbare tijdsloten) ----------
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'open' check (status in ('open','booked')),
  task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint availability_time_order check (end_time > start_time),
  constraint availability_booked_has_task check (
    (status = 'open' and task_id is null) or
    (status = 'booked' and task_id is not null)
  )
);
alter table public.availability enable row level security;
alter publication supabase_realtime add table public.availability;

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

  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
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
grant update (name) on public.profiles to authenticated;

-- =========================================================
-- Trigger: bewaakt geldige status-overgangen van een taak
-- (defense-in-depth: Postgres combineert meerdere permissieve RLS-policies
-- met OR, onafhankelijk per USING/WITH CHECK — zonder deze trigger zou een
-- student in theorie een open taak direct naar 'done' kunnen zetten)
-- =========================================================
create or replace function public.enforce_task_transitions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.get_my_role() = 'admin' then
    return new;
  end if;

  if old.status = 'open' and new.status = 'accepted' then
    if old.student_id is not null then
      raise exception 'Deze taak is al geaccepteerd.';
    end if;
    if new.student_id is distinct from auth.uid() then
      raise exception 'Je kan een taak enkel voor jezelf accepteren.';
    end if;
    return new;
  end if;

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
-- via de SECURITY DEFINER-functie book_slot() hieronder.
-- =========================================================
create policy "availability_select_all_authenticated" on public.availability for select
  to authenticated using (true);

create policy "availability_admin_write" on public.availability for all
  to authenticated using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- =========================================================
-- Functie: atomair en race-safe een tijdslot boeken
-- =========================================================
create or replace function public.book_slot(
  p_slot_id uuid,
  p_category text,
  p_description text,
  p_location text,
  p_extra_info text
) returns public.tasks
language plpgsql security definer set search_path = public as $$
declare
  v_slot    record;
  v_rate    numeric(10,2);
  v_hours   numeric(5,2);
  v_profile record;
  v_task    public.tasks;
begin
  if public.get_my_role() <> 'client' then
    raise exception 'Alleen klanten kunnen een tijdslot boeken.';
  end if;

  select id, name, email into v_profile
  from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Profiel niet gevonden.';
  end if;

  if p_category not in (
    'Tuinonderhoud','Auto naar carwash','Boodschappen doen',
    'Planten water geven (vakantie)','Hond eten geven (vakantie)',
    'Hond uitlaten (korte wandeling)','Helpen op een feest',
    'Op- en afbouw evenement','Gezelschap houden','Kleine verhuis'
  ) then
    raise exception 'Ongeldige categorie.';
  end if;

  select * into v_slot from public.availability where id = p_slot_id for update;

  if not found then
    raise exception 'Tijdslot bestaat niet.';
  end if;
  if v_slot.status <> 'open' then
    raise exception 'Dit tijdslot is niet meer beschikbaar.';
  end if;

  v_hours := extract(epoch from (v_slot.end_time - v_slot.start_time)) / 3600.0;
  select hourly_rate into v_rate from public.platform_settings where id = 1;

  insert into public.tasks (
    title, category, description, date, time, location, hours,
    rate_at_creation, client_id, client_name, client_email, status, extra_info
  ) values (
    p_category, p_category, p_description, v_slot.slot_date, v_slot.start_time, p_location,
    v_hours, v_rate, v_profile.id, v_profile.name, v_profile.email, 'open',
    coalesce(p_extra_info, '')
  ) returning * into v_task;

  update public.availability set status = 'booked', task_id = v_task.id where id = p_slot_id;

  return v_task;
end;
$$;
revoke all on function public.book_slot(uuid, text, text, text, text) from public;
grant execute on function public.book_slot(uuid, text, text, text, text) to authenticated;

-- =========================================================
-- Trigger: slot terug vrijgeven als de bijhorende taak verwijderd wordt
-- =========================================================
create or replace function public.release_slot_on_task_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.availability set status = 'open', task_id = null where task_id = old.id;
  return old;
end;
$$;
create trigger tasks_release_slot_after_delete
  after delete on public.tasks
  for each row execute function public.release_slot_on_task_delete();

-- =========================================================
-- RLS — tasks
-- =========================================================
create policy "tasks_select_own_client" on public.tasks for select
  to authenticated using (client_id = auth.uid());

create policy "tasks_select_open_or_own_student" on public.tasks for select
  to authenticated using (status = 'open' or student_id = auth.uid());

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

-- Alleen eigendom wordt hier gecontroleerd — de enforce_task_transitions()
-- trigger bewaakt de eigenlijke open->accepted->done statusmachine.
create policy "tasks_update_student" on public.tasks for update
  to authenticated
  using (public.get_my_role() = 'student' and (status = 'open' or student_id = auth.uid()))
  with check (public.get_my_role() = 'student' and student_id = auth.uid());

create policy "tasks_update_admin" on public.tasks for update
  to authenticated using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');
