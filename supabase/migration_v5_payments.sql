-- ============================================================
-- Flexhulp migratie v5: online betalen via Mollie na voltooiing
-- ============================================================

alter table public.tasks
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending','paid','failed','expired','canceled')),
  add column if not exists mollie_payment_id text,
  add column if not exists paid_at timestamptz;

-- Klanten mogen deze velden nooit rechtstreeks wijzigen — enkel de
-- backend (via de service-role client, die deze trigger overslaat omdat
-- auth.uid() dan null is) mag een betaling aanmaken of bevestigen.
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
