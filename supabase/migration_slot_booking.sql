-- ============================================================
-- Flexhulp migratie: van vrije taak-invoer naar boekbare tijdsloten
-- Eenmalig draaien in Supabase Dashboard > SQL Editor > Run
-- Veilig voor bestaande profiles/tasks/platform_settings-data.
-- De availability-tabel bevat enkel test-/demodata en wordt
-- volledig herbouwd.
-- ============================================================

-- 1. tasks: nieuw vrij tekstveld voor "extra info / benodigdheden"
alter table public.tasks
  add column if not exists extra_info text not null default '';

-- 2. Oude, op weekdag-gebaseerde availability-tabel weg
drop table if exists public.availability cascade;

-- 3. Nieuwe availability: concrete, eenmalig boekbare tijdsloten
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

create policy "availability_select_all_authenticated" on public.availability
  for select to authenticated using (true);

create policy "availability_admin_write" on public.availability
  for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

alter publication supabase_realtime add table public.availability;

-- 4. Atomaire, race-safe boekingsfunctie
create or replace function public.book_slot(
  p_slot_id uuid,
  p_category text,
  p_description text,
  p_location text,
  p_extra_info text
) returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
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

  -- Rij-lock: een gelijktijdige aanvraag wacht hier tot deze transactie
  -- afgerond is, en ziet dan de correcte (al 'booked') status.
  select * into v_slot
  from public.availability
  where id = p_slot_id
  for update;

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
    rate_at_creation, client_id, client_name, client_email,
    status, extra_info
  ) values (
    p_category,
    p_category, p_description, v_slot.slot_date, v_slot.start_time, p_location, v_hours,
    v_rate, v_profile.id, v_profile.name, v_profile.email,
    'open', coalesce(p_extra_info, '')
  )
  returning * into v_task;

  update public.availability
  set status = 'booked', task_id = v_task.id
  where id = p_slot_id;

  return v_task;
end;
$$;

revoke all on function public.book_slot(uuid, text, text, text, text) from public;
grant execute on function public.book_slot(uuid, text, text, text, text) to authenticated;

-- 5. Slot automatisch weer vrijgeven als de bijhorende taak verwijderd wordt
create or replace function public.release_slot_on_task_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.availability
  set status = 'open', task_id = null
  where task_id = old.id;
  return old;
end;
$$;

create trigger tasks_release_slot_after_delete
after delete on public.tasks
for each row
execute function public.release_slot_on_task_delete();
