-- ============================================================
-- Flexhulp migratie v9: klant kan tijdslot enkel per half uur aanpassen
-- Wordt al client-side (step + afronding) en in book_time_range() via de
-- zod-validatie in de server action afgedwongen — deze constraint is de
-- databank-brede vangnet-laag, ongeacht via welk pad een rij ontstaat.
-- ============================================================

alter table public.tasks
  add constraint tasks_half_hour_times check (
    extract(minute from time) in (0, 30)
    and extract(minute from end_time) in (0, 30)
  );
