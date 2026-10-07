-- ============================================================
-- Flexhulp migratie v11: studentenprofiel
-- Een student schrijft een korte "over mij". Bij het aanmelden voor een klus
-- bewaren we een momentopname van die tekst, het aantal voltooide klussen en
-- de gemiddelde beoordeling op de aanmelding zelf (task_applications), zodat de
-- klant bij het kiezen meer ziet dan enkel een naam, zonder dat klanten
-- de taken van studenten hoeven te kunnen lezen.
-- ============================================================

alter table public.profiles add column if not exists bio text;

grant update (name, phone, address, bio) on public.profiles to authenticated;

alter table public.task_applications
  add column if not exists student_bio text,
  add column if not exists student_jobs_done integer not null default 0,
  add column if not exists student_avg_rating numeric(3,2),
  add column if not exists student_rating_count integer not null default 0;
