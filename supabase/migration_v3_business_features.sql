-- ============================================================
-- Flexhulp migratie v3: klantfuncties, annuleringsbeleid, reviews,
-- blokkeren van klanten, SMS-telefoonnummer
-- Eenmalig draaien in Supabase Dashboard > SQL Editor > Run
-- Veilig voor bestaande data (enkel nieuwe kolommen, geen drops).
-- ============================================================

-- 1. profiles: telefoonnummer (voor sms) en blokkeer-vlag
alter table public.profiles
  add column if not exists phone text,
  add column if not exists banned boolean not null default false;

grant update (name, phone) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  chosen_role text;
begin
  chosen_role := new.raw_user_meta_data ->> 'role';
  if chosen_role is null or chosen_role not in ('client','student') then
    chosen_role := 'client';
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

-- 2. platform_settings: annuleringstermijn (in uren)
alter table public.platform_settings
  add column if not exists cancellation_notice_hours integer not null default 24
    check (cancellation_notice_hours >= 0);

-- 3. tasks: beoordeling door de klant na afronding, en telefoonnummer voor sms
alter table public.tasks
  add column if not exists rating smallint check (rating between 1 and 5),
  add column if not exists review_comment text,
  add column if not exists client_phone text;

-- 3b. Ontkoppel client_id/student_id/updated_by zodat een account verwijderd
--     kan worden zonder de taakhistoriek te moeten wissen (nodig voor het
--     "recht op vergetelheid" — de taak blijft bestaan voor de boekhouding,
--     enkel de koppeling naar het verwijderde account valt weg).
alter table public.tasks alter column client_id drop not null;
alter table public.tasks drop constraint if exists tasks_client_id_fkey;
alter table public.tasks add constraint tasks_client_id_fkey
  foreign key (client_id) references public.profiles(id) on delete set null;

alter table public.tasks drop constraint if exists tasks_student_id_fkey;
alter table public.tasks add constraint tasks_student_id_fkey
  foreign key (student_id) references public.profiles(id) on delete set null;

alter table public.platform_settings drop constraint if exists platform_settings_updated_by_fkey;
alter table public.platform_settings add constraint platform_settings_updated_by_fkey
  foreign key (updated_by) references public.profiles(id) on delete set null;

-- 4. book_slot(): geblokkeerde klanten kunnen niet meer boeken
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
  v_banned  boolean;
  v_task    public.tasks;
begin
  if public.get_my_role() <> 'client' then
    raise exception 'Alleen klanten kunnen een tijdslot boeken.';
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
    rate_at_creation, client_id, client_name, client_email, client_phone,
    status, extra_info
  ) values (
    p_category, p_category, p_description, v_slot.slot_date, v_slot.start_time, p_location,
    v_hours, v_rate, v_profile.id, v_profile.name, v_profile.email, v_profile.phone,
    'open', coalesce(p_extra_info, '')
  ) returning * into v_task;

  update public.availability set status = 'booked', task_id = v_task.id where id = p_slot_id;

  return v_task;
end;
$$;

-- 5. enforce_task_transitions(): uitgebreid met klant-toegestane wijzigingen
--    (eigen open taak bewerken, eigen voltooide taak beoordelen)
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
    if old.status = 'open' and new.status = 'open' then
      if new.date <> old.date or new.time <> old.time or new.hours <> old.hours
         or new.rate_at_creation <> old.rate_at_creation
         or new.client_id <> old.client_id or new.student_id is not null
         or new.rating is distinct from old.rating
         or new.review_comment is distinct from old.review_comment then
        raise exception 'Deze velden mag je niet aanpassen.';
      end if;
      return new;
    end if;

    -- Eigen voltooide taak beoordelen: enkel rating/review_comment mogen wijzigen.
    if old.status = 'done' and new.status = 'done' then
      if new.date <> old.date or new.time <> old.time or new.hours <> old.hours
         or new.rate_at_creation <> old.rate_at_creation
         or new.category <> old.category or new.description <> old.description
         or new.location <> old.location or new.extra_info <> old.extra_info
         or new.student_id is distinct from old.student_id then
        raise exception 'Deze velden mag je niet aanpassen.';
      end if;
      return new;
    end if;

    raise exception 'Ongeldige aanpassing.';
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

-- 6. RLS — klanten mogen hun eigen taak updaten (bewerken/beoordelen).
--    De trigger hierboven bepaalt exact wat toegestaan is per status.
drop policy if exists "tasks_update_own_client" on public.tasks;
create policy "tasks_update_own_client" on public.tasks for update
  to authenticated
  using (public.get_my_role() = 'client' and client_id = auth.uid())
  with check (public.get_my_role() = 'client' and client_id = auth.uid());
