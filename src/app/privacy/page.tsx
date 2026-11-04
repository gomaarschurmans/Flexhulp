import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { CONTACT_EMAIL, SELLER } from "@/lib/invoicing/business";

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
        <p className="mb-8 text-xs text-ink-soft">Laatst bijgewerkt: november 2026</p>

        <h2 className="mb-2 mt-8 text-lg">1. Wie zijn we</h2>
        <p className="mb-4">
          Flexhulp is de handelsnaam van {SELLER.name}, eenmanszaak, {SELLER.address},
          ondernemingsnummer {SELLER.vatNumber}. Wij zijn verantwoordelijk voor de verwerking
          van je persoonsgegevens zoals beschreven in deze verklaring. Vragen of een verzoek?
          Mail naar{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-navy underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        <h2 className="mb-2 mt-8 text-lg">2. Welke gegevens verzamelen we</h2>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>Naam, e-mailadres en (optioneel) telefoonnummer bij registratie</li>
          <li>Klanten: adres (voor de factuur) en de locatie en beschrijving van de klus</li>
          <li>
            Studenten: een profielfoto, een korte voorstelling, gekozen eigenschappen, je
            voltooide klussen en de beoordelingen die je krijgt
          </li>
          <li>
            Beoordelingen die je geeft, met een eventuele opmerking (zie punt 4 voor wie
            wat ziet)
          </li>
          <li>Facturen en de betaalstatus van een klus</li>
          <li>Communicatie tussen jou en Flexhulp</li>
          <li>
            Technische gegevens zoals je IP-adres en foutmeldingen, via onze hosting en
            foutmonitoring
          </li>
        </ul>

        <h2 className="mb-2 mt-8 text-lg">3. Waarom verwerken we deze gegevens</h2>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>
            <strong>Uitvoering van de overeenkomst:</strong> je account beheren, klussen
            plannen en uitvoeren, je contacteren over je boeking en je laten betalen.
          </li>
          <li>
            <strong>Wettelijke verplichting:</strong> facturen opmaken en boekhoudkundig
            bewaren.
          </li>
          <li>
            <strong>Gerechtvaardigd belang:</strong> het platform beveiligen, spam en misbruik
            tegengaan, fouten opsporen en de dienstverlening verbeteren.
          </li>
          <li>
            <strong>Toestemming:</strong> je profielfoto en optionele meldingen (zoals mails
            over nieuwe klussen voor studenten). Je kan je foto altijd vervangen en de
            meldingen op je accountpagina uitzetten of je toestemming intrekken.
          </li>
        </ul>

        <h2 className="mb-2 mt-8 text-lg">4. Met wie delen we gegevens</h2>
        <p className="mb-2 font-semibold">Met andere gebruikers van het platform</p>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>
            Wanneer een student zich aanmeldt voor een klus, ziet de klant zijn of haar naam,
            profielfoto, voorstelling, eigenschappen, aantal voltooide klussen, gemiddelde
            score en recente opmerkingen van eerdere klanten. Een foto is pas zichtbaar na
            goedkeuring door Flexhulp en enkel voor klanten bij wie de student zich heeft
            aangemeld of aan wie de student toegewezen is.
          </li>
          <li>
            Pas wanneer de klant een student kiest, ziet die student het volledige adres en de
            contactgegevens van de klant.
          </li>
          <li>
            Studenten zien de klus (categorie, gemeente, tijd en vergoeding) en de gemiddelde
            score van de klant, zonder naam of adres. Wat een student over een klant schrijft,
            ziet enkel Flexhulp.
          </li>
        </ul>

        <p className="mb-2 font-semibold">Met dienstverleners die ons platform draaiende houden</p>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong>: database, gebruikersaccounts en opslag van profielfoto&apos;s
          </li>
          <li>
            <strong>Vercel</strong>: hosting van de website
          </li>
          <li>
            <strong>Resend</strong>: verzending van e-mails
          </li>
          <li>
            <strong>Mollie</strong>: verwerking van online betalingen (Bancontact, iDEAL,
            kaart, PayPal). Mollie verwerkt je betaalgegevens; wij zien ze niet.
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong>: spamcontrole bij registreren en boeken
          </li>
          <li>
            <strong>Sentry</strong>: opsporen van fouten op de website (EU-server)
          </li>
        </ul>
        <p className="mb-4">
          Sommige van deze partijen zijn gevestigd buiten de Europese Economische Ruimte. De
          doorgifte gebeurt dan op basis van een adequaatheidsbesluit of de
          standaardcontractbepalingen van de Europese Commissie. We verkopen je gegevens nooit
          en gebruiken ze niet voor advertenties.
        </p>

        <h2 className="mb-2 mt-8 text-lg">5. Hoe lang bewaren we je gegevens</h2>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>
            <strong>Account en profiel:</strong> zolang je een account hebt. Verwijder je je
            account, dan verwijderen we je gegevens, je profielfoto en je voorstelling, en
            anonimiseren we je naam en contactgegevens op afgeronde klussen.
          </li>
          <li>
            <strong>Facturen en boekhouding:</strong> 7 jaar, zoals de wet voorschrijft. Op
            een factuur blijven naam en adres van de klant bewaard.
          </li>
          <li>
            <strong>Foutmeldingen en logs:</strong> beperkte tijd, enkel om fouten op te
            sporen.
          </li>
        </ul>

        <h2 className="mb-2 mt-8 text-lg">6. Jouw rechten</h2>
        <p className="mb-2">Je hebt het recht om:</p>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>je gegevens in te kijken en te corrigeren</li>
          <li>je gegevens te laten verwijderen</li>
          <li>de verwerking te beperken of er bezwaar tegen te maken</li>
          <li>je gegevens over te dragen naar een andere dienst</li>
          <li>je toestemming in te trekken, bijvoorbeeld voor je profielfoto</li>
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
          Je kan je account (en de bijhorende gegevens) op elk moment zelf verwijderen via je
          accountpagina, of ons contacteren op het e-mailadres hierboven. We antwoorden binnen
          een maand.
        </p>

        <h2 className="mb-2 mt-8 text-lg">7. Beveiliging</h2>
        <p className="mb-4">
          We nemen passende technische en organisatorische maatregelen om je gegevens te
          beschermen: versleutelde verbindingen (HTTPS), gehashte wachtwoorden,
          toegangscontrole op basis van je rol, een privé opslag voor profielfoto&apos;s en
          spambescherming.
        </p>

        <h2 className="mb-2 mt-8 text-lg">8. Cookies</h2>
        <p className="mb-4">
          We gebruiken enkel functionele cookies die nodig zijn om je ingelogd te houden en je
          keuze &ldquo;onthoud mij&rdquo; te bewaren. We gebruiken geen tracking- of
          marketingcookies. De spamcontrole van Cloudflare kan tijdelijk technische gegevens
          van je browser lezen om te controleren dat je geen bot bent.
        </p>

        <h2 className="mb-2 mt-8 text-lg">9. Wijzigingen</h2>
        <p className="mb-4">
          We kunnen deze verklaring aanpassen. Belangrijke wijzigingen laten we je weten via
          e-mail of een melding op het platform.
        </p>
      </main>

      <Footer />
    </div>
  );
}
