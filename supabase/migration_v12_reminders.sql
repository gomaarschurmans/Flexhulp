-- ============================================================
-- Flexhulp migratie v12: herinneringen
-- Houdt per klus bij wanneer de herinnering (dag ervoor) verstuurd werd,
-- zodat de dagelijkse cron (/api/cron/reminders) niets dubbel verstuurt.
-- ============================================================

alter table public.tasks add column if not exists reminder_sent_at timestamptz;
