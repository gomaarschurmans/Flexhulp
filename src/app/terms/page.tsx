import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Algemene voorwaarden — Flexhulp" };

export default function TermsPage() {
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
        <h1 className="mb-2 text-3xl text-navy">Algemene voorwaarden</h1>
        <p className="mb-8 text-xs text-ink-soft">Laatst bijgewerkt: september 2026</p>

        <div className="mb-8 rounded border border-line bg-navy-tint px-4 py-3 text-xs text-ink-soft">
          Dit is een zorgvuldig opgestelde standaardtekst als degelijk
          startpunt, geen juridisch advies. Laat deze tekst nog nakijken door
          een jurist voor ze definitief scherp moet staan. Pas ook het
          betalingsartikel (5) aan naar hoe je in de praktijk betaald wil
          worden.
        </div>

        <h2 className="mb-2 mt-8 text-lg">1. Wie zijn we</h2>
        <p className="mb-4">
          Flexhulp (eenmanszaak Gomar Schurmans), Nielstraat 73, 3840
          Borgloon, België, BTW BE 1031.198.882 ("Flexhulp", "wij"), biedt
          via dit platform hulp aan bij dagelijkse klussen. Door een account
          aan te maken of het platform te gebruiken, ga je akkoord met deze
          voorwaarden.
        </p>

        <h2 className="mb-2 mt-8 text-lg">2. De dienst</h2>
        <p className="mb-4">
          Flexhulp geeft tijdsloten vrij. Klanten kunnen een vrij tijdslot
          boeken en daarbij aangeven welke klus moet gebeuren. Een boeking is
          bindend zodra ze bevestigd is op het platform.
        </p>

        <h2 className="mb-2 mt-8 text-lg">3. Account</h2>
        <p className="mb-4">
          Je bent zelf verantwoordelijk voor de juistheid van de gegevens die
          je opgeeft en voor het vertrouwelijk houden van je
          wachtwoord. Flexhulp kan een account tijdelijk of definitief
          blokkeren bij misbruik.
        </p>

        <h2 className="mb-2 mt-8 text-lg">4. Annuleren</h2>
        <p className="mb-4">
          Je kan een boeking kosteloos annuleren tot het aantal uren op
          voorhand dat op het platform vermeld staat bij het boeken. Na dat
          tijdstip kan een boeking niet meer via het platform ingetrokken
          worden — neem in dat geval rechtstreeks contact op.
        </p>

        <h2 className="mb-2 mt-8 text-lg">5. Prijs en betaling</h2>
        <p className="mb-4">
          De prijs van een klus wordt berekend op basis van het uurtarief dat
          op het moment van boeken op het platform vermeld staat, vermenigvuldigd
          met de duur van het gekozen tijdslot. Betaling gebeurt in onderling
          overleg tussen klant en Flexhulp, tenzij op het platform anders
          aangegeven.
        </p>

        <h2 className="mb-2 mt-8 text-lg">6. Aansprakelijkheid</h2>
        <p className="mb-4">
          Flexhulp levert haar diensten met de nodige zorgvuldigheid, maar is
          niet aansprakelijk voor onrechtstreekse schade. Onze
          aansprakelijkheid is in elk geval beperkt tot het bedrag van de
          betreffende boeking.
        </p>

        <h2 className="mb-2 mt-8 text-lg">7. Klachten</h2>
        <p className="mb-4">
          Heb je een klacht over een uitgevoerde klus of over het platform?
          Mail naar{" "}
          <a href="mailto:gomaar.schurmans@gmail.com" className="text-navy underline">
            gomaar.schurmans@gmail.com
          </a>{" "}
          — we proberen dit binnen de 5 werkdagen op te lossen.
        </p>

        <h2 className="mb-2 mt-8 text-lg">8. Toepasselijk recht</h2>
        <p className="mb-4">
          Deze voorwaarden worden beheerst door Belgisch recht. Geschillen
          worden voorgelegd aan de bevoegde rechtbank van de zetel van
          Flexhulp.
        </p>

        <h2 className="mb-2 mt-8 text-lg">9. Wijzigingen</h2>
        <p className="mb-4">
          We kunnen deze voorwaarden aanpassen. De meest recente versie staat
          altijd op deze pagina.
        </p>
      </main>

      <Footer />
    </div>
  );
}
