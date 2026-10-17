-- v15: beoordelingen in halve sterren (1, 1,5, 2 ... 5).
-- Draaien in de Supabase SQL Editor, voor de bijhorende code-versie.
-- Bestaande beoordelingen (hele getallen) blijven ongewijzigd geldig.

alter table public.tasks drop constraint if exists tasks_rating_check;
alter table public.tasks drop constraint if exists tasks_student_rating_check;

alter table public.tasks
  alter column rating type numeric(2, 1) using rating::numeric,
  alter column student_rating type numeric(2, 1) using student_rating::numeric;

alter table public.tasks
  add constraint tasks_rating_check
    check (rating is null or (rating between 1 and 5 and rating * 2 = round(rating * 2))),
  add constraint tasks_student_rating_check
    check (student_rating is null or (student_rating between 1 and 5 and student_rating * 2 = round(student_rating * 2)));
