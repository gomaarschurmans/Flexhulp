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
