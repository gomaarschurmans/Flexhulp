import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Privacyverklaring — Flexhulp" };

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-6 py-6">
          <Link href="/">
            <Image
              src="/flexhulp-logo.png"
              alt="Flexhulp"
              width={150}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] flex-1 px-6 py-12 text-sm leading-relaxed text-ink">
        <h1 className="mb-2 text-3xl text-navy">Privacyverklaring</h1>
        <p className="mb-8 text-xs text-ink-soft">Laatst bijgewerkt: september 2026</p>

        <div className="mb-8 rounded border border-line bg-navy-tint px-4 py-3 text-xs text-ink-soft">
          Dit is een zorgvuldig opgestelde standaardtekst als degelijk
          startpunt, geen juridisch advies. Laat deze tekst nog nakijken door
          een jurist voor ze definitief scherp moet staan.
        </div>

        <h2 className="mb-2 mt-8 text-lg">1. Wie zijn we</h2>
        <p className="mb-4">
          Flexhulp (eenmanszaak Gomar Schurmans), Nielstraat 73, 3840
          Borgloon, België, BTW BE 1031.198.882, is verantwoordelijk voor de
          verwerking van je persoonsgegevens zoals beschreven in deze
          verklaring. Vragen? Mail naar{" "}
          <a href="mailto:gomaar.schurmans@gmail.com" className="text-navy underline">
            gomaar.schurmans@gmail.com
          </a>
          .
        </p>

        <h2 className="mb-2 mt-8 text-lg">2. Welke gegevens verzamelen we</h2>
        <ul className="mb-4 list-disc pl-5">
          <li>Naam, e-mailadres en (optioneel) telefoonnummer bij registratie</li>
          <li>Locatie en beschrijving van de klus die je boekt</li>
          <li>Communicatie tussen jou en Flexhulp</li>
          <li>Technische gegevens zoals IP-adres, via onze hostingprovider</li>
        </ul>

        <h2 className="mb-2 mt-8 text-lg">3. Waarom we deze gegevens verwerken</h2>
        <ul className="mb-4 list-disc pl-5">
          <li>Om je account aan te maken en te beheren</li>
          <li>Om een geboekte klus te plannen en uit te voeren</li>
          <li>Om je te contacteren over je boeking (e-mail, eventueel sms)</li>
          <li>Om onze dienstverlening te verbeteren</li>
        </ul>
        <p className="mb-4">
          De rechtsgrond hiervoor is de uitvoering van de overeenkomst tussen
          jou en Flexhulp, en ons gerechtvaardigd belang bij een goed werkend
          platform.
        </p>

        <h2 className="mb-2 mt-8 text-lg">4. Met wie delen we gegevens</h2>
        <p className="mb-4">
          We werken met een beperkt aantal zorgvuldig gekozen
          dienstverleners die ons platform draaiende houden:
        </p>
        <ul className="mb-4 list-disc pl-5">
          <li>
            <strong>Supabase</strong> — database en gebruikersaccounts
          </li>
          <li>
            <strong>Resend</strong> — verzending van e-mails
          </li>
          <li>
            <strong>Vercel</strong> — hosting van de website
          </li>
        </ul>
        <p className="mb-4">
          We verkopen je gegevens nooit aan derden en gebruiken ze niet voor
          advertentiedoeleinden.
        </p>

        <h2 className="mb-2 mt-8 text-lg">5. Hoe lang bewaren we je gegevens</h2>
        <p className="mb-4">
          We bewaren je gegevens zolang je een account hebt. Vraag je je
          account te verwijderen, dan verwijderen of anonimiseren we je
          persoonsgegevens, behalve wat we wettelijk verplicht zijn te
          bewaren (bijvoorbeeld voor boekhoudkundige doeleinden).
        </p>

        <h2 className="mb-2 mt-8 text-lg">6. Jouw rechten</h2>
        <p className="mb-4">Je hebt het recht om:</p>
        <ul className="mb-4 list-disc pl-5">
          <li>je gegevens in te kijken en te corrigeren</li>
          <li>je gegevens te laten verwijderen</li>
          <li>bezwaar te maken tegen bepaalde verwerkingen</li>
          <li>je gegevens over te dragen naar een andere dienst</li>
          <li>
            een klacht in te dienen bij de{" "}
            <a
              href="https://www.gegevensbeschermingsautoriteit.be"
              className="text-navy underline"
              target="_blank"
              rel="noreferrer"
            >
              Gegevensbeschermingsautoriteit
            </a>
          </li>
        </ul>
        <p className="mb-4">
          Je kan je account (en de bijhorende gegevens) op elk moment zelf
          verwijderen via je accountinstellingen, of ons contacteren op het
          e-mailadres hierboven.
        </p>

        <h2 className="mb-2 mt-8 text-lg">7. Beveiliging</h2>
        <p className="mb-4">
          We nemen redelijke technische en organisatorische maatregelen om je
          gegevens te beschermen: versleutelde verbindingen (HTTPS),
          gehashte wachtwoorden en toegangscontrole op basis van je rol.
        </p>

        <h2 className="mb-2 mt-8 text-lg">8. Cookies</h2>
        <p className="mb-4">
          We gebruiken enkel functionele cookies die nodig zijn om je
          ingelogd te houden. We gebruiken geen tracking- of
          marketingcookies.
        </p>

        <h2 className="mb-2 mt-8 text-lg">9. Wijzigingen</h2>
        <p className="mb-4">
          We kunnen deze verklaring aanpassen. Belangrijke wijzigingen
          communiceren we via e-mail of een melding op het platform.
        </p>
      </main>

      <Footer />
    </div>
  );
}
