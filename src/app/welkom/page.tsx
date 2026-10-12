import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEuro } from "@/lib/utils";

const STEPS = {
  client: (rate: number | null) => [
    {
      title: "Kies een dag en tijdstip",
      text: `Op je overzicht zie je de dagen waarop een student beschikbaar is. Kies wanneer je hulp nodig hebt, per half uur${
        rate ? `, aan ${formatEuro(rate)} per uur` : ""
      }.`,
    },
    {
      title: "Studenten melden zich aan",
      text: "Beschrijf kort wat er moet gebeuren. Geïnteresseerde studenten melden zich aan, met een korte voorstelling en hun score.",
    },
    {
      title: "Jij kiest wie komt",
      text: "Pas als jij een student kiest, krijgt die je adres en contactgegevens te zien. Na de klus ontvang je automatisch een factuur.",
    },
  ],
  student: () => [
    {
      title: "Maak je profiel af",
      text: "Vertel kort iets over jezelf. Klanten zien dit bij je aanmelding en kiezen sneller een student die ze kennen.",
    },
    {
      title: "Meld je aan voor klussen",
      text: "Op je overzicht staan alle openstaande klussen met plaats, tijd en vergoeding. Klik op “Ik wil dit doen” bij wat bij je past.",
    },
    {
      title: "Wacht op de keuze van de klant",
      text: "Kiest de klant jou, dan krijg je een mail en zie je het volledige adres. Na de klus markeer je hem als voltooid.",
    },
  ],
};

export default async function WelkomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  const isStudent = profile.role === "student";

  let steps;
  if (isStudent) {
    steps = STEPS.student();
  } else {
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("hourly_rate")
      .eq("id", 1)
      .single();
    steps = STEPS.client(settings?.hourly_rate ?? null);
  }

  const firstName = profile.name.split(" ")[0];

  return (
    <div className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center px-6 py-10">
      <Image
        src="/flexhulp-logo.png"
        alt="Flexhulp"
        width={190}
        height={40}
        priority
        className="mx-auto mb-8 h-10 w-auto"
      />

      <div className="card">
        <h1 className="mb-1 text-2xl text-navy">Welkom, {firstName}!</h1>
        <p className="mb-6 text-sm text-ink-soft">
          Je account is bevestigd.{" "}
          {isStudent
            ? "Zo werkt Flexhulp voor studenten:"
            : "Zo werkt Flexhulp voor klanten:"}
        </p>

        <ol className="mb-7 space-y-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <h2 className="text-base font-semibold">{step.title}</h2>
                <p className="text-sm text-ink-soft">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        {isStudent ? (
          <div className="flex flex-col gap-2">
            <Link href="/account" className="btn btn-navy w-full text-center">
              Profiel aanvullen
            </Link>
            <Link href="/student" className="btn btn-ghost w-full text-center">
              Eerst de klussen bekijken
            </Link>
          </div>
        ) : (
          <Link href="/klant" className="btn btn-navy block w-full text-center">
            Mijn eerste taak plaatsen
          </Link>
        )}
      </div>
    </div>
  );
}
