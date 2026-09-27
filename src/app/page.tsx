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
          <p className="mx-auto mb-8 max-w-[560px] text-base text-ink-soft">
            Flexhulp verbindt je met hulp voor tuinonderhoud, boodschappen,
            kleine verhuizen en meer — tegen een vast, eerlijk uurtarief. Kies
            gewoon een vrij tijdslot en beschrijf je klus.
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
            <h2 className="mb-10 text-center text-2xl">Hoe het werkt</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <div className="mb-3 h-2 w-10 rounded-full bg-navy" />
                <h3 className="mb-2 text-lg">1. Maak een account</h3>
                <p className="text-sm text-ink-soft">
                  Registreer gratis, in minder dan een minuut.
                </p>
              </div>
              <div>
                <div className="mb-3 h-2 w-10 rounded-full bg-teal" />
                <h3 className="mb-2 text-lg">2. Kies een tijdslot</h3>
                <p className="text-sm text-ink-soft">
                  Bekijk de vrijgegeven tijdsloten en kies wat jou past.
                </p>
              </div>
              <div>
                <div className="mb-3 h-2 w-10 rounded-full bg-amber" />
                <h3 className="mb-2 text-lg">3. Beschrijf je klus</h3>
                <p className="text-sm text-ink-soft">
                  Vertel wat er moet gebeuren, en de klus wordt ingepland.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
