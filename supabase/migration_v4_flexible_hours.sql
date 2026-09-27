-- ============================================================
-- Flexhulp migratie v4: klant kiest zelf hoeveel uren binnen een
-- vrijgegeven venster (i.p.v. het volledige blok in één keer te boeken)
-- ============================================================

-- 1. tasks: expliciete eindtijd + koppeling naar het venster waaruit
--    de boeking komt (enkel voor traceerbaarheid, niet voor booking-logica)
alter table public.tasks
  add column if not exists end_time time,
  add column if not exists window_id uuid references public.availability(id) on delete set null;

update public.tasks
set end_time = (time + (hours || ' hours')::interval)::time
where end_time is null;

alter table public.tasks alter column end_time set not null;

-- 2. Oude atomaire boekingsfunctie + slot-vrijgave-mechanisme weg — niet
--    meer nodig: beschikbaarheid wordt nu altijd dynamisch berekend
--    (venster minus reeds bestaande boekingen), dus een taak verwijderen
--    maakt automatisch weer ruimte vrij zonder trigger.
drop function if exists public.book_slot(uuid, text, text, text, text);
drop trigger if exists tasks_release_slot_before_delete on public.tasks;
drop trigger if exists tasks_release_slot_after_delete on public.tasks;
drop function if exists public.release_slot_on_task_delete();

-- 3. availability wordt een puur tijdvenster: geen status/koppeling meer
alter table public.availability drop constraint if exists availability_booked_has_task;
alter table public.availability drop column if exists status;
alter table public.availability drop column if exists task_id;

-- 4. Nieuwe boekingsfunctie: klant kiest een sub-tijdstip binnen het venster
create or replace function public.book_time_range(
  p_window_id uuid,
  p_start_time time,
  p_end_time time,
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
    title, category, description, date, time, end_time, location, hours,
    rate_at_creation, client_id, client_name, client_email, client_phone,
    status, extra_info, window_id
  ) values (
    p_category, p_category, p_description, v_window.slot_date, p_start_time, p_end_time,
    p_location, v_hours, v_rate, v_profile.id, v_profile.name, v_profile.email, v_profile.phone,
    'open', coalesce(p_extra_info, ''), p_window_id
  ) returning * into v_task;

  return v_task;
end;
$$;

revoke all on function public.book_time_range(uuid, time, time, text, text, text, text) from public;
grant execute on function public.book_time_range(uuid, time, time, text, text, text, text) to authenticated;
