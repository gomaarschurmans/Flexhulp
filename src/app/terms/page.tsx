import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { CONTACT_EMAIL, PAYMENT_TERM_DAYS, SELLER } from "@/lib/invoicing/business";

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
        <p className="mb-8 text-xs text-ink-soft">Laatst bijgewerkt: november 2026</p>

        <h2 className="mb-2 mt-8 text-lg">1. Wie zijn we</h2>
        <p className="mb-4">
          Flexhulp is de handelsnaam van {SELLER.name}, eenmanszaak, {SELLER.address},
          ondernemingsnummer {SELLER.vatNumber} (&ldquo;Flexhulp&rdquo;, &ldquo;wij&rdquo;).
          Je bereikt ons via{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-navy underline">
            {CONTACT_EMAIL}
          </a>
          . Flexhulp past de btw-vrijstelling voor kleine ondernemingen toe en rekent daarom
          geen btw aan. Deze voorwaarden gelden voor elk gebruik van het platform en voor
          elke klus die via het platform geboekt wordt.
        </p>

        <h2 className="mb-2 mt-8 text-lg">2. Hoe het platform werkt</h2>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>
            Flexhulp geeft tijdsloten vrij. Een klant maakt een gratis account, kiest een vrij
            tijdslot (per half uur) en beschrijft de klus.
          </li>
          <li>
            Studenten met een goedgekeurd profiel kunnen zich aanmelden voor de klus. De klant
            kiest zelf welke student de klus uitvoert. Pas dan krijgt die student het volledige
            adres en de contactgegevens van de klant.
          </li>
          <li>
            De boeking is bindend zodra ze op het platform bevestigd is. De overeenkomst voor
            de klus komt tot stand tussen de klant en Flexhulp. Flexhulp factureert de klus en
            laat ze uitvoeren door de student die de klant gekozen heeft.
          </li>
          <li>
            Flexhulp kan een boeking weigeren of annuleren, bijvoorbeeld voor een klus die
            onveilig, onwettig of niet passend is. Reeds betaalde bedragen worden dan
            terugbetaald.
          </li>
        </ul>

        <h2 className="mb-2 mt-8 text-lg">3. Account</h2>
        <p className="mb-4">
          Je bent zelf verantwoordelijk voor de juistheid van de gegevens die je opgeeft, voor
          het vertrouwelijk houden van je wachtwoord en voor alles wat via je account gebeurt.
          Je hebt maximaal één account. Flexhulp kan een account tijdelijk of definitief
          blokkeren bij misbruik.
        </p>

        <h2 className="mb-2 mt-8 text-lg">4. Voor klanten</h2>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>
            Beschrijf de klus correct en volledig: wat er moet gebeuren, waar, hoe lang en wat
            de student nodig heeft.
          </li>
          <li>Zorg voor een veilige werkomgeving en voor toegang tot wat nodig is.</li>
          <li>
            Studenten voeren geen werkzaamheden uit die gevaarlijk zijn of een vakbekwaamheid
            vereisen (zoals werken op hoogte, aan elektriciteit of gas, of met zware
            machines). Vraag enkel de werkzaamheden die je bij het boeken beschreven hebt.
          </li>
          <li>
            Is de student ter plaatse en kan hij of zij niet starten omdat je er niet bent of
            geen toegang geeft, dan kan Flexhulp de voorziene tijd toch aanrekenen.
          </li>
        </ul>

        <h2 className="mb-2 mt-8 text-lg">5. Voor studenten</h2>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>
            Je profielfoto, voorstelling en eigenschappen moeten kloppen, recent zijn en over
            jezelf gaan. Flexhulp keurt elke foto goed voor klanten ze zien en kan een foto
            afkeuren.
          </li>
          <li>
            Aanmelden voor een klus is vrijblijvend. Kiest de klant jou, dan kom je op het
            afgesproken moment. Kan je toch niet, verwittig Flexhulp en de klant zo snel
            mogelijk.
          </li>
          <li>
            Het adres en de contactgegevens van de klant gebruik je enkel voor de klus. Deel
            ze niet met anderen.
          </li>
          <li>
            Je vergoeding en de voorwaarden waaronder je werkt (zoals je statuut als student)
            spreek je apart met Flexhulp af. Je bent zelf verantwoordelijk om aan de wettelijke
            voorwaarden van je statuut te voldoen.
          </li>
          <li>Werk zorgvuldig, veilig en beleefd, en volg de afspraken met de klant.</li>
        </ul>

        <h2 className="mb-2 mt-8 text-lg">6. Prijs en betaling</h2>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>
            De prijs van een klus is het uurtarief dat bij het boeken op het platform staat,
            vermenigvuldigd met de duur van het gekozen tijdslot (per half uur). Vóór je boekt
            zie je een schatting van het bedrag. Alle prijzen zijn in euro en zonder btw (zie
            artikel 1).
          </li>
          <li>
            Na de klus ontvang je per e-mail een factuur. Betaal binnen {PAYMENT_TERM_DAYS}{" "}
            dagen na de factuurdatum, via de betaallink (Bancontact, iDEAL, kaart of PayPal,
            verwerkt door Mollie) of via overschrijving met vermelding van het factuurnummer.
            Wij zien je kaart- of bankgegevens niet.
          </li>
          <li>
            Betaal je niet op tijd, dan sturen we een herinnering. Daarna kunnen we de
            wettelijke verwijlinterest aanrekenen en je account beperken tot de betaling in
            orde is.
          </li>
        </ul>

        <h2 className="mb-2 mt-8 text-lg">7. Annuleren</h2>
        <p className="mb-4">
          Als klant kan je een boeking kosteloos intrekken op je overzicht, tot het aantal
          uren voor de start dat op het platform vermeld staat bij het boeken. Heeft de klant
          al een student gekozen of is die termijn voorbij, neem dan zo snel mogelijk contact
          met ons op; we zoeken samen een oplossing. Bij herhaaldelijk te laat annuleren of
          niet opdagen kan Flexhulp je account beperken.
        </p>

        <h2 className="mb-2 mt-8 text-lg">8. Herroepingsrecht voor consumenten</h2>
        <p className="mb-4">
          Als consument heb je bij een overeenkomst op afstand in principe 14 dagen om zonder
          opgave van reden af te zien van je boeking. Omdat een klus meestal binnen die
          termijn plaatsvindt, vragen we je bij het boeken om uitdrukkelijk te vragen dat de
          klus op het afgesproken moment start. Door te boeken en dat vakje aan te vinken:
        </p>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>vraag je dat de klus binnen de herroepingstermijn start, en</li>
          <li>
            erken je dat je je herroepingsrecht verliest zodra de klus volledig is uitgevoerd.
          </li>
        </ul>
        <p className="mb-4">
          Herroep je nadat de klus gestart is maar voor ze volledig is uitgevoerd, dan betaal
          je een bedrag in verhouding tot wat al is uitgevoerd. Wil je herroepen of annuleren,
          mail ons dan op{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-navy underline">
            {CONTACT_EMAIL}
          </a>
          . Het kosteloos intrekken volgens artikel 7 blijft daarnaast gelden.
        </p>

        <h2 className="mb-2 mt-8 text-lg">9. Aansprakelijkheid</h2>
        <p className="mb-4">
          Flexhulp levert haar diensten met de nodige zorg. We zijn niet aansprakelijk voor
          onrechtstreekse schade, en onze aansprakelijkheid is beperkt tot het bedrag van de
          betreffende boeking. Dat geldt niet voor opzet, zware fout, lichamelijke schade of
          wat wettelijk niet beperkt mag worden. Meld schade zo snel mogelijk, bij voorkeur
          binnen 3 werkdagen na de klus.
        </p>

        <h2 className="mb-2 mt-8 text-lg">10. Beoordelingen</h2>
        <p className="mb-4">
          Na een klus kan de klant de student beoordelen, en de student de klant. Wees eerlijk
          en respectvol, zonder beledigingen of persoonsgegevens van anderen. Flexhulp kan
          beoordelingen verwijderen die hier niet aan voldoen. Beoordelingen van studenten zijn
          zichtbaar voor klanten wanneer de student zich aanmeldt. Wat studenten over een klant
          schrijven, ziet enkel Flexhulp; studenten zien alleen de gemiddelde score van de
          klant.
        </p>

        <h2 className="mb-2 mt-8 text-lg">11. Persoonsgegevens</h2>
        <p className="mb-4">
          Hoe we met je gegevens omgaan, lees je in onze{" "}
          <Link href="/privacy" className="text-navy underline">
            privacyverklaring
          </Link>
          .
        </p>

        <h2 className="mb-2 mt-8 text-lg">12. Klachten</h2>
        <p className="mb-4">
          Heb je een klacht over een klus of over het platform? Mail naar{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-navy underline">
            {CONTACT_EMAIL}
          </a>
          ; we proberen dit binnen 5 werkdagen op te lossen. Komen we er samen niet uit, dan
          kan je als consument terecht bij de{" "}
          <a
            href="https://www.consumentenombudsdienst.be"
            className="text-navy underline"
            target="_blank"
            rel="noreferrer"
          >
            Consumentenombudsdienst
          </a>
          .
        </p>

        <h2 className="mb-2 mt-8 text-lg">13. Toepasselijk recht</h2>
        <p className="mb-4">
          Op deze voorwaarden is Belgisch recht van toepassing. Geschillen worden voorgelegd
          aan de bevoegde rechtbank van de zetel van Flexhulp, onverminderd de dwingende
          regels die een consument toelaten naar de rechter van zijn of haar woonplaats te
          stappen.
        </p>

        <h2 className="mb-2 mt-8 text-lg">14. Wijzigingen</h2>
        <p className="mb-4">
          We kunnen deze voorwaarden aanpassen. De meest recente versie staat altijd op deze
          pagina. Bij een belangrijke wijziging verwittigen we je per e-mail. Voor een boeking
          gelden de voorwaarden zoals ze golden op het moment van boeken.
        </p>
      </main>

      <Footer />
    </div>
  );
}
