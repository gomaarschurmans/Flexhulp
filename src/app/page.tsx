import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/components/Footer";
import type { Role } from "@/lib/types/domain";

const ROLE_HOME: Record<Role, string> = {
  client: "/klant",
  student: "/student",
  admin: "/admin",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    redirect(ROLE_HOME[(profile?.role as Role) ?? "client"]);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-6">
          <Image
            src="/flexhulp-logo.png"
            alt="Flexhulp"
            width={190}
            height={40}
            priority
            className="h-9 w-auto"
          />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-navy">
              Inloggen
            </Link>
            <Link href="/signup" className="btn btn-navy px-4 py-2 text-sm">
              Registreer
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-[1080px] px-6 py-20 text-center">
          <h1 className="mb-4 text-4xl text-navy md:text-5xl">
            Een extra paar handen, wanneer het jou uitkomt
          </h1>
          <p className="mx-auto mb-3 max-w-[600px] text-base text-ink-soft">
            Flexhulp brengt klanten en studenten samen voor tuinonderhoud,
            boodschappen, kleine verhuizen, hulp bij een evenement en nog veel
            meer. Altijd tegen een vast en eerlijk uurtarief.
          </p>
          <p className="mx-auto mb-8 max-w-[600px] text-sm font-medium text-navy">
            Voor particulieren die hulp zoeken, en voor studenten die op zoek
            zijn naar een flexibele job.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/signup" className="btn btn-navy px-6 py-3">
              Registreer
            </Link>
            <Link href="/login" className="btn btn-ghost px-6 py-3">
              Al een account? Log in
            </Link>
          </div>
        </section>

        <section className="border-t border-line bg-card">
          <div className="mx-auto max-w-[1080px] px-6 py-16">
            <span className="mb-2 block text-center text-xs font-semibold uppercase tracking-wide text-navy">
              Voor klanten
            </span>
            <h2 className="mb-3 text-center text-2xl">Hulp inschakelen doe je zo</h2>
            <p className="mx-auto mb-10 max-w-[560px] text-center text-sm text-ink-soft">
              Om een tijdslot te kunnen boeken, heb je eerst een gratis account
              nodig. Zo weten we wie de klus plaatst en houden we alles
              overzichtelijk voor jou en voor Flexhulp.
            </p>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <div className="mb-3 h-2 w-10 rounded-full bg-navy" />
                <h3 className="mb-2 text-lg">1. Maak een gratis account aan</h3>
                <p className="text-sm text-ink-soft">
                  Registreren duurt minder dan een minuut en is helemaal
                  gratis. Zonder account kan je niet boeken.
                </p>
              </div>
              <div>
                <div className="mb-3 h-2 w-10 rounded-full bg-teal" />
                <h3 className="mb-2 text-lg">2. Kies een vrij tijdslot</h3>
                <p className="text-sm text-ink-soft">
                  Bekijk welke dagen en uren beschikbaar zijn en kies wat jou
                  het beste past.
                </p>
              </div>
              <div>
                <div className="mb-3 h-2 w-10 rounded-full bg-amber" />
                <h3 className="mb-2 text-lg">3. Beschrijf je klus</h3>
                <p className="text-sm text-ink-soft">
                  Vertel wat er moet gebeuren, en je klus wordt ingepland.
                </p>
              </div>
            </div>
            <div className="mt-10 text-center">
              <Link href="/signup" className="btn btn-navy px-6 py-3">
                Registreer als klant
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-[1080px] px-6 py-16">
            <span className="mb-2 block text-center text-xs font-semibold uppercase tracking-wide text-teal">
              Voor studenten
            </span>
            <h2 className="mb-3 text-center text-2xl">
              Een flexibele job, volledig op jouw voorwaarden
            </h2>
            <p className="mx-auto mb-10 max-w-[560px] text-center text-sm text-ink-soft">
              Op zoek naar een bijverdienste die past rond je lessen en
              examens? Meld je gratis aan als student en kies zelf welke
              klussen je oppakt en wanneer.
            </p>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <div className="mb-3 h-2 w-10 rounded-full bg-teal" />
                <h3 className="mb-2 text-lg">1. Meld je gratis aan</h3>
                <p className="text-sm text-ink-soft">
                  Registreer als student in minder dan een minuut. Volledig
                  gratis, geen verplichtingen.
                </p>
              </div>
              <div>
                <div className="mb-3 h-2 w-10 rounded-full bg-navy" />
                <h3 className="mb-2 text-lg">2. Bekijk openstaande klussen</h3>
                <p className="text-sm text-ink-soft">
                  Blader door de klussen die klanten geplaatst hebben en kies
                  wat bij jouw agenda past.
                </p>
              </div>
              <div>
                <div className="mb-3 h-2 w-10 rounded-full bg-amber" />
                <h3 className="mb-2 text-lg">3. Meld je aan voor een klus</h3>
                <p className="text-sm text-ink-soft">
                  Toon je interesse, en de klant kiest wie de klus toegewezen
                  krijgt.
                </p>
              </div>
            </div>
            <div className="mt-10 text-center">
              <Link href="/signup?role=student" className="btn btn-teal px-6 py-3">
                Registreer als student
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
