-- v16: de reviewscore per student wordt vast bijgehouden.
-- Voorheen werd de score telkens opnieuw berekend en kreeg de klant bij een
-- aanmelding een momentopname die kon verouderen. Nu houdt de database per
-- student het aantal voltooide klussen, de gemiddelde score en het aantal
-- beoordelingen bij, en ververst ze ook de aanmeldingen van die student.
-- Draaien in de Supabase SQL Editor, voor de bijhorende code-versie.

-- 1. Vaste score per student op het profiel
alter table public.profiles
  add column if not exists jobs_done integer not null default 0,
  add column if not exists rating_avg numeric(3, 2),
  add column if not exists rating_count integer not null default 0;

-- 2. Herberekent de cijfers van één student en zet ze op profiel en aanmeldingen
create or replace function public.refresh_student_stats(p_student uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_jobs integer;
  v_avg numeric(3, 2);
  v_cnt integer;
  v_reviews jsonb;
begin
  if p_student is null then
    return;
  end if;

  select count(*), round(avg(rating)::numeric, 2), count(rating)
    into v_jobs, v_avg, v_cnt
  from public.tasks
  where student_id = p_student and status = 'done';

  select coalesce(
           jsonb_agg(
             jsonb_build_object('rating', r.rating, 'comment', r.comment)
             order by r.completed_at desc nulls last
           ),
           '[]'::jsonb
         )
    into v_reviews
  from (
    select rating, left(btrim(review_comment), 240) as comment, completed_at
    from public.tasks
    where student_id = p_student
      and status = 'done'
      and rating is not null
      and btrim(coalesce(review_comment, '')) <> ''
    order by completed_at desc nulls last
    limit 3
  ) r;

  update public.profiles
    set jobs_done = v_jobs, rating_avg = v_avg, rating_count = v_cnt
  where id = p_student;

  -- Aanmeldingen tonen altijd de actuele score, niet die van het moment van aanmelden.
  update public.task_applications
    set student_jobs_done = v_jobs,
        student_avg_rating = v_avg,
        student_rating_count = v_cnt,
        student_reviews = v_reviews
  where student_id = p_student;
end;
$$;

-- 3. Trigger: bij elke relevante wijziging aan een klus de score verversen
create or replace function public.tasks_refresh_student_stats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_student_stats(old.student_id);
    return old;
  end if;

  if tg_op = 'UPDATE'
     and old.status is not distinct from new.status
     and old.rating is not distinct from new.rating
     and old.review_comment is not distinct from new.review_comment
     and old.student_id is not distinct from new.student_id then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.student_id is distinct from new.student_id then
    perform public.refresh_student_stats(old.student_id);
  end if;
  perform public.refresh_student_stats(new.student_id);
  return new;
end;
$$;

drop trigger if exists tasks_refresh_student_stats on public.tasks;
create trigger tasks_refresh_student_stats
  after insert or update or delete on public.tasks
  for each row execute function public.tasks_refresh_student_stats();

-- Niemand hoeft deze functies rechtstreeks aan te roepen.
revoke all on function public.refresh_student_stats(uuid) from public, anon, authenticated;
revoke all on function public.tasks_refresh_student_stats() from public, anon, authenticated;

-- 4. Bestaande studenten meteen goedzetten
select public.refresh_student_stats(id) from public.profiles where role = 'student';
