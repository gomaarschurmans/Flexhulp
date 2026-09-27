-- ============================================================
-- Flexhulp fix: taak intrekken/verwijderen faalde
-- Oorzaak: de check-constraint "availability_booked_has_task" botst met
-- Postgres' eigen "on delete set null"-actie op availability.task_id — die
-- zet enkel task_id op null (in een aparte, eerdere stap), wat de
-- constraint (tijdelijk, binnen dezelfde transactie) laat falen nog voor
-- onze eigen trigger de status mee kan terugzetten naar 'open'.
-- Deze constraint voegde geen bescherming toe die book_slot()/
-- release_slot_on_task_delete() niet al zelf garanderen — gewoon droppen.
-- ============================================================

alter table public.availability
  drop constraint if exists availability_booked_has_task;
