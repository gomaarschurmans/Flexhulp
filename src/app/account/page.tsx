import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { DeleteAccountButton } from "@/app/account/DeleteAccountButton";
import { ProfileForm } from "@/app/account/ProfileForm";
import { PhotoUploader } from "@/app/account/PhotoUploader";
import type { Role } from "@/lib/types/domain";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "name, email, phone, address, bio, role, notify_new_tasks, traits, photo_status, photo_reject_reason, photo_updated_at"
    )
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  return (
    <div>
      <Navbar name={profile.name} role={profile.role as Role} />
      <div className="mx-auto max-w-[640px] px-6 pb-20 pt-8">
        <h1 className="mb-6 text-2xl">Mijn account</h1>

        {profile.role === "student" && (
          <div className="card mb-6">
            <h2 className="mb-1 text-lg">Profielfoto</h2>
            <p className="mb-4 text-sm text-ink-soft">
              Klanten zien je foto wanneer je je aanmeldt voor hun klus. Zo weten ze wie er
              aan de deur komt.
            </p>
            <PhotoUploader
              studentId={user.id}
              name={profile.name}
              status={profile.photo_status}
              rejectReason={profile.photo_reject_reason}
              version={profile.photo_updated_at}
            />
          </div>
        )}

        <div className="card mb-6">
          <h2 className="mb-4 text-lg">Gegevens</h2>
          <dl className="mb-4 grid grid-cols-[100px_minmax(0,1fr)] gap-y-2 text-sm">
            <dt className="text-ink-soft">Naam</dt>
            <dd className="break-words">{profile.name}</dd>
            <dt className="text-ink-soft">E-mail</dt>
            <dd className="break-all">{profile.email}</dd>
          </dl>
          <ProfileForm
            phone={profile.phone}
            address={profile.address}
            bio={profile.bio}
            traits={profile.traits ?? []}
            notifyNewTasks={profile.notify_new_tasks}
            isStudent={profile.role === "student"}
          />
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
