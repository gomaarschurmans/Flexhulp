-- v14: verplicht studentenprofiel met foto (door admin goedgekeurd) en
-- karaktereigenschappen, zichtbaar voor de klant bij een aanmelding, plus een
-- beoordeling van de student over de klant.
-- Draaien in de Supabase SQL Editor, NA migration_v13_workflow.sql.

-- 1. Profiel: foto, goedkeuringsstatus en karaktereigenschappen
alter table public.profiles
  add column if not exists photo_path text,
  add column if not exists photo_status text
    check (photo_status in ('pending', 'approved', 'rejected')),
  add column if not exists photo_reject_reason text,
  add column if not exists photo_updated_at timestamptz,
  add column if not exists traits text[] not null default '{}';

-- Gebruikers mogen enkel hun eigen eigenschappen aanpassen; de foto en de
-- goedkeuring lopen uitsluitend via de server (service role).
grant update (traits) on public.profiles to authenticated;

-- 2. Privé opslag voor foto's: geen enkele policy, dus enkel bereikbaar via de
--    service role (de app geeft foto's enkel aan wie ze mag zien).
insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', false)
on conflict (id) do nothing;

-- 3. Momentopname op elke aanmelding (zoals bio/score al deden)
alter table public.task_applications
  add column if not exists student_has_photo boolean not null default false,
  add column if not exists student_traits text[] not null default '{}',
  add column if not exists student_reviews jsonb not null default '[]'::jsonb;

-- 4. Beoordeling van de student over de klant
alter table public.tasks
  add column if not exists student_rating smallint
    check (student_rating between 1 and 5),
  add column if not exists student_review_comment text;

-- 5. Prikbord toont (anoniem) hoe studenten de klant beoordelen
alter table public.task_board
  add column if not exists client_rating_avg numeric(3, 2),
  add column if not exists client_rating_count integer not null default 0;

create or replace function public.sync_task_projections()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_avg numeric(3, 2);
  v_cnt integer;
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
    select round(avg(student_rating)::numeric, 2), count(student_rating)
      into v_avg, v_cnt
    from public.tasks
    where client_id = new.client_id and student_rating is not null;

    insert into public.task_board
      (id, category, description, city, date, time, end_time, hours,
       rate_at_creation, created_at, client_rating_avg, client_rating_count)
    values
      (new.id, new.category, new.description, new.city, new.date, new.time,
       new.end_time, new.hours, new.rate_at_creation, new.created_at,
       v_avg, coalesce(v_cnt, 0))
    on conflict (id) do update
      set category = excluded.category, description = excluded.description,
          city = excluded.city, date = excluded.date, time = excluded.time,
          end_time = excluded.end_time, hours = excluded.hours,
          rate_at_creation = excluded.rate_at_creation,
          client_rating_avg = excluded.client_rating_avg,
          client_rating_count = excluded.client_rating_count;
  else
    delete from public.task_board where id = new.id;
  end if;

  -- Nieuwe beoordeling van een klant: ook zijn andere open klussen verversen.
  if tg_op = 'UPDATE' and new.client_id is not null
     and new.student_rating is distinct from old.student_rating then
    select round(avg(student_rating)::numeric, 2), count(student_rating)
      into v_avg, v_cnt
    from public.tasks
    where client_id = new.client_id and student_rating is not null;

    update public.task_board
      set client_rating_avg = v_avg, client_rating_count = coalesce(v_cnt, 0)
    where id in (
      select id from public.tasks where client_id = new.client_id and status = 'open'
    );
  end if;

  return new;
end;
$$;

-- 6. Statusovergangen: de beoordeling van de student mag enkel via de server
--    (service role) geschreven worden, nooit rechtstreeks door klant of student.
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
         or new.student_rating is distinct from old.student_rating
         or new.student_review_comment is distinct from old.student_review_comment
         or new.payment_status is distinct from old.payment_status
         or new.mollie_payment_id is distinct from old.mollie_payment_id
         or new.paid_at is distinct from old.paid_at
         or new.student_paid_at is distinct from old.student_paid_at
         or new.completion_reminder_sent_at is distinct from old.completion_reminder_sent_at then
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
         or new.student_rating is distinct from old.student_rating
         or new.student_review_comment is distinct from old.student_review_comment
         or new.payment_status is distinct from old.payment_status
         or new.mollie_payment_id is distinct from old.mollie_payment_id
         or new.paid_at is distinct from old.paid_at
         or new.student_paid_at is distinct from old.student_paid_at
         or new.completion_reminder_sent_at is distinct from old.completion_reminder_sent_at then
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
    if ((old.date + old.time) at time zone 'Europe/Brussels') > now() then
      raise exception 'Je kan een klus pas afronden vanaf het begin ervan.';
    end if;
    if new.date <> old.date or new.time <> old.time or new.end_time <> old.end_time
       or new.hours <> old.hours or new.rate_at_creation <> old.rate_at_creation
       or new.rating is distinct from old.rating
       or new.review_comment is distinct from old.review_comment
       or new.student_rating is distinct from old.student_rating
       or new.student_review_comment is distinct from old.student_review_comment
       or new.payment_status is distinct from old.payment_status
       or new.mollie_payment_id is distinct from old.mollie_payment_id
       or new.paid_at is distinct from old.paid_at
       or new.student_paid_at is distinct from old.student_paid_at
       or new.completion_reminder_sent_at is distinct from old.completion_reminder_sent_at then
      raise exception 'Bij het afronden mag je niets anders aanpassen.';
    end if;
    return new;
  end if;

  raise exception 'Ongeldige statuswijziging.';
end;
$$;
