import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { DeleteAccountButton } from "@/app/account/DeleteAccountButton";
import { ProfileForm } from "@/app/account/ProfileForm";
import type { Role } from "@/lib/types/domain";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, phone, address, role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  return (
    <div>
      <Navbar name={profile.name} role={profile.role as Role} />
      <div className="mx-auto max-w-[640px] px-6 pb-20 pt-8">
        <h1 className="mb-6 text-2xl">Mijn account</h1>

        <div className="card mb-6">
          <h2 className="mb-4 text-lg">Gegevens</h2>
          <dl className="mb-4 grid grid-cols-[100px_1fr] gap-y-2 text-sm">
            <dt className="text-ink-soft">Naam</dt>
            <dd>{profile.name}</dd>
            <dt className="text-ink-soft">E-mail</dt>
            <dd>{profile.email}</dd>
          </dl>
          <ProfileForm phone={profile.phone} address={profile.address} />
        </div>

        <div className="card border-danger/30">
          <h2 className="mb-2 text-lg">Account verwijderen</h2>
          <p className="mb-4 text-sm text-ink-soft">
            Je account en persoonsgegevens worden verwijderd. Reeds geboekte
            klussen blijven om administratieve redenen bewaard, maar zonder
            jouw naam of contactgegevens. Dit kan niet ongedaan gemaakt
            worden.
          </p>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
