-- ============================================================
-- Flexhulp migratie v10: privacy van klantgegevens
-- Tot nu toe kon elke ingelogde gebruiker alle open taken volledig zien
-- (naam, e-mail, telefoon, exact adres, extra info). Nu:
--  * tasks is enkel nog leesbaar voor de klant zelf, de admin en de
--    TOEGEWEZEN student;
--  * studenten zien open klussen via task_board (zonder klantgegevens,
--    enkel gemeente i.p.v. adres);
--  * klanten zien bezette tijdstippen via task_busy (enkel datum/uren).
-- ============================================================

-- 1. Gemeente als publiek veld naast het (private) volledige adres
alter table public.tasks add column if not exists city text not null default '';

update public.tasks
set city = coalesce(trim(substring(location from '\d{4}\s+([^,]+)')), '')
where city = '';

-- 2. Basis-tabelrechten: geen brede leesrechten meer op tasks
drop policy if exists "tasks_select_open_or_own_student" on public.tasks;

create policy "tasks_select_assigned_student" on public.tasks for select
  to authenticated using (student_id = auth.uid());

-- Studenten kunnen enkel nog hun eigen toegewezen taak bijwerken (afronden);
-- zichzelf toewijzen aan een open taak kan niet meer, dat doet de klant.
drop policy if exists "tasks_update_student" on public.tasks;
create policy "tasks_update_student" on public.tasks for update
  to authenticated
  using (public.get_my_role() = 'student' and student_id = auth.uid())
  with check (public.get_my_role() = 'student' and student_id = auth.uid());

-- 3. Trigger: de directe student-toewijzing (open -> accepted door de
--    student zelf) bestaat niet meer.
create or replace function public.enforce_task_transitions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
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

-- 4. Publieke projecties (zonder persoonsgegevens), bijgehouden door een trigger
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

insert into public.task_busy (id, date, time, end_time)
select id, date, time, end_time from public.tasks
on conflict (id) do nothing;

insert into public.task_board
  (id, category, description, city, date, time, end_time, hours, rate_at_creation, created_at)
select id, category, description, city, date, time, end_time, hours, rate_at_creation, created_at
from public.tasks where status = 'open'
on conflict (id) do nothing;

-- 5. Aanmelden kan enkel voor een klus die op het prikbord staat
drop policy if exists "applications_insert_student" on public.task_applications;
create policy "applications_insert_student" on public.task_applications for insert
  to authenticated with check (
    public.get_my_role() = 'student'
    and student_id = auth.uid()
    and exists (select 1 from public.task_board tb where tb.id = task_id)
    and not exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.banned
    )
  );

-- 6. Boeken met gemeente
drop function if exists public.book_time_range(uuid, time, time, text, text, text, text);

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
