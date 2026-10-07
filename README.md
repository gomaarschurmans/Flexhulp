# Flexhulp

Klussen & opdrachten voor studenten — klanten plaatsen taken, studenten
accepteren en voltooien ze, admin beheert het uurtarief, beschikbaarheid en
alle taken. Gebouwd met Next.js (App Router), Supabase (database, auth, RLS,
realtime) en Resend (transactionele e-mails).

## Vereisten

- [Node.js](https://nodejs.org) (LTS) — nog niet geïnstalleerd op deze
  machine op het moment van schrijven.
- Een gratis [Supabase](https://supabase.com)-project.
- Een gratis [Resend](https://resend.com)-account.

## Setup

1. **Node.js installeren** als dat nog niet is gebeurd.

2. **Dependencies installeren**:

   ```bash
   npm install
   ```

3. **Supabase-project aanmaken** op [supabase.com](https://supabase.com/dashboard).
   Kopieer de Project URL en de `anon` `public` API key (Project Settings →
   API).

4. **Database-schema aanmaken**: open in het Supabase-dashboard de
   **SQL Editor**, plak de volledige inhoud van [`supabase/schema.sql`](supabase/schema.sql)
   en klik **Run**. Dit maakt alle tabellen, RLS-policies en triggers aan.

5. **E-mailbevestiging instellen**: ga naar **Authentication → Email
   Templates → Confirm signup** en zet de link in de template op:

   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
   ```

6. **Realtime controleren**: ga naar **Database → Replication** en controleer
   dat de tabel `tasks` aan staat voor Realtime (dit gebeurt automatisch door
   `schema.sql`, maar dubbelcheck na het runnen).

7. **Resend instellen**: maak een API key aan op
   [resend.com/api-keys](https://resend.com/api-keys). Voor productie
   verifieer je een eigen domein; voor lokaal testen kan je Resend's
   test-adres gebruiken.

8. **Omgevingsvariabelen instellen**: kopieer `.env.local.example` naar
   `.env.local` en vul in:

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   RESEND_API_KEY=...
   RESEND_FROM_EMAIL="Flexhulp <noreply@flexhulp.be>"
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

9. **Starten**:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Admin-toegang toekennen

Er is geen admin-registratie — dat is bewust zo (geen hardcoded wachtwoord
meer zoals in de oorspronkelijke mockup). Om iemand admin te maken:

1. Laat die persoon gewoon registreren als klant of student.
2. Ga in het Supabase-dashboard naar **Table Editor → profiles**.
3. Zoek de rij van die gebruiker en zet de kolom `role` op `admin`.
4. De volgende keer dat die persoon inlogt, komt die op `/admin` terecht.

## Projectstructuur

```
src/
├── middleware.ts          # sessie-refresh + rol-gebaseerde route-guarding
├── app/
│   ├── login/, signup/    # authenticatie
│   ├── auth/              # server actions + email-confirmatie
│   ├── klant/             # klant-dashboard (taak plaatsen/annuleren)
│   ├── student/           # student-dashboard (taak accepteren/voltooien)
│   └── admin/             # admin-dashboard (tarief, beschikbaarheid, taken)
├── components/            # gedeelde UI-componenten
├── hooks/useRealtimeTasks.ts
└── lib/
    ├── supabase/          # server-, browser- en middleware-clients
    ├── resend/            # e-mail-client + templates
    └── types/, constants.ts, utils.ts
```

## Deployment

Deze app is klaar om te deployen op [Vercel](https://vercel.com): koppel de
repo, vul dezelfde omgevingsvariabelen in als hierboven (met
`NEXT_PUBLIC_SITE_URL` op je echte domein), en zet de confirm-signup redirect
in Supabase op dat domein.

## Optionele diensten (v3: bedrijfsklare functies)

Deze werken allemaal **zonder** dat je ze instelt (de app degradeert netjes),
maar zijn aan te raden voor echt gebruik:

- **CAPTCHA / spambescherming** ([Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile),
  gratis, geen betaalgegevens): maak een widget aan, kopieer de **Site key**
  naar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` en de **Secret key** naar
  `TURNSTILE_SECRET_KEY`.
- **Foutmonitoring** ([Sentry](https://sentry.io), gratis tier): maak een
  Next.js-project aan, kopieer de **DSN** naar `NEXT_PUBLIC_SENTRY_DSN`.
- **Sms-meldingen** ([Twilio](https://www.twilio.com), **betalend**: een
  telefoonnummer + kosten per bericht): zet `TWILIO_ACCOUNT_SID`,
  `TWILIO_AUTH_TOKEN` en `TWILIO_FROM_NUMBER`.
- **Account-verwijdering (GDPR)**: vereist `SUPABASE_SERVICE_ROLE_KEY`
  (Supabase → Project Settings → API → `service_role` key). **Geheim** — nooit
  delen, nooit als `NEXT_PUBLIC_`-variabele zetten.
- **Online betalen** ([Mollie](https://www.mollie.com), pay-per-transactie,
  geen abonnement): maak een account aan, kopieer een API-sleutel
  (Dashboard → Developers → API keys — begin met de `test_`-sleutel) naar
  `MOLLIE_API_KEY`. Zodra jij een taak als voltooid markeert, krijgt de klant
  automatisch een betaalverzoek (e-mail + "Betaal nu"-knop op `/klant`). De
  webhook moet publiek bereikbaar zijn, dus dit werkt enkel op de deployed
  site, niet op `localhost`.

## Databasemigraties

Elke schemawijziging staat als apart, met de hand uit te voeren SQL-bestand
in `supabase/`, in volgorde:

1. `schema.sql` — volledig schema (enkel nodig bij een nieuw project vanaf nul)
2. `migration_slot_booking.sql`
3. `migration_v3_business_features.sql`
4. `migration_v3b_fix_slot_release.sql`
5. `migration_v3c_fix_trigger_timing.sql`
6. `migration_v4_flexible_hours.sql` — klant kiest zelf een sub-tijdstip
   binnen een vrijgegeven venster (i.p.v. het hele blok te moeten boeken)
7. `migration_v5_payments.sql` — betaalstatus-velden + Mollie-koppeling
8. `migration_v6_requests.sql` — losse aanvragen voor extra uren
9. `migration_v7_task_applications.sql` — studenten melden interesse aan,
   de klant kiest zelf wie de taak toegewezen krijgt
10. `migration_v8_invoicing.sql` — facturatie (vrijstellingsregeling kleine
    ondernemingen), plus adresveld op profiles
11. `migration_v9_half_hour_slots.sql` — tijdslot enkel per half uur
    instelbaar (databank-brede check-constraint)
12. `migration_v10_privacy.sql` — klantgegevens enkel nog zichtbaar voor de
    klant, de admin en de toegewezen student (gemeente-veld, prikbord- en
    bezet-projecties)
13. `migration_v11_student_profile.sql` — "over mij" voor studenten, met
    score en aantal klussen op elke aanmelding

Draai ontbrekende migraties in de Supabase SQL Editor **voor** je de
bijhorende code-versie deployt.
