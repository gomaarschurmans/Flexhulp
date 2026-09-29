-- ============================================================
-- Flexhulp migratie v8: facturatie
-- Facturen worden aangemaakt zodra een taak als voltooid gemarkeerd
-- wordt (in markTaskDone(), via de service-role client), naast het
-- bestaande Mollie-betaalverzoek. Vrijstellingsregeling kleine
-- ondernemingen: geen BTW op de factuur.
-- ============================================================

alter table public.profiles add column if not exists address text;

-- Klant mag voortaan ook zijn adres zelf ingeven (nodig als correcte
-- factuurvermelding) — enkel deze drie kolommen blijven vrij te wijzigen.
grant update (name, phone, address) on public.profiles to authenticated;

create sequence if not exists public.invoice_number_seq start 1;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number integer not null unique default nextval('invoice_number_seq'),
  task_id uuid not null unique references public.tasks(id) on delete restrict,
  client_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_address text not null default '',
  category text not null,
  description text not null default '',
  service_date date not null,
  service_time time not null,
  service_end_time time not null,
  hours numeric(5,2) not null,
  rate numeric(10,2) not null,
  total numeric(10,2) not null,
  vat_exempt boolean not null default true,
  issued_at timestamptz not null default now()
);
alter table public.invoices enable row level security;

create policy "invoices_select_own_client" on public.invoices for select
  to authenticated using (client_id = auth.uid());

create policy "invoices_select_admin" on public.invoices for select
  to authenticated using (public.get_my_role() = 'admin');

-- Geen insert/update/delete-policies voor gewone gebruikers: facturen
-- worden uitsluitend aangemaakt via de service-role client
-- (createInvoiceForTask(), aangeroepen vanuit markTaskDone()) en blijven
-- daarna onveranderlijk — net als in de praktijk een uitgegeven factuur.
