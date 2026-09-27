-- ============================================================
-- Flexhulp fix: slot bleef op "booked" staan na intrekken/verwijderen
-- Oorzaak: de trigger die het slot vrijgeeft liep AFTER DELETE, maar
-- Postgres' eigen "on delete set null"-actie op availability.task_id had
-- de kolom dan al op null gezet — waardoor de WHERE-clause van onze
-- trigger (task_id = old.id) niets meer vond en de status nooit
-- terugveranderde naar 'open'. Fix: de trigger BEFORE DELETE laten lopen,
-- zodat hij het slot bijwerkt terwijl task_id nog wel overeenkomt.
-- ============================================================

drop trigger if exists tasks_release_slot_after_delete on public.tasks;

create trigger tasks_release_slot_before_delete
  before delete on public.tasks
  for each row execute function public.release_slot_on_task_delete();

-- Reeds "vastzittende" sloten (task_id al null, maar status nog 'booked')
-- van vóór deze fix, terug op 'open' zetten.
update public.availability
set status = 'open'
where task_id is null and status = 'booked';
