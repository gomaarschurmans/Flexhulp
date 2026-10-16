import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { PhotoUploader } from "@/app/account/PhotoUploader";
import { ProfileForm } from "@/app/account/ProfileForm";
import { isStudentProfileComplete } from "@/lib/studentProfile";

/** Verplichte stap voor nieuwe studenten: foto, voorstelling en eigenschappen. */
export default async function ProfielAfmakenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "name, role, phone, address, bio, traits, notify_new_tasks, photo_path, photo_status, photo_reject_reason, photo_updated_at"
    )
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect("/");
  if (isStudentProfileComplete(profile)) redirect("/student");

  const hasPhoto = Boolean(profile.photo_path) && profile.photo_status !== "rejected";

  return (
    <div>
      <Navbar name={profile.name} role="student" />
      <div className="mx-auto max-w-[640px] px-6 pb-20 pt-8">
        <h1 className="mb-2 text-2xl">Maak je profiel af</h1>
        <p className="mb-6 text-sm text-ink-soft">
          Klanten kiezen zelf welke student bij hen komt. Daarom is een duidelijke foto en een
          korte voorstelling verplicht voor je klussen kan bekijken. Het duurt maar enkele
          minuten.
        </p>

        <div className="card mb-6">
          <h2 className="mb-1 text-lg">
            1. Je foto {hasPhoto && <span className="text-teal">✓</span>}
          </h2>
          <p className="mb-4 text-sm text-ink-soft">
            Klanten zien deze foto wanneer je je aanmeldt, zodat ze weten wie er aan de deur
            komt. We keuren elke foto goed voor een klant ze ziet.
          </p>
          <PhotoUploader
            studentId={user.id}
            name={profile.name}
            status={profile.photo_status}
            rejectReason={profile.photo_reject_reason}
            version={profile.photo_updated_at}
          />
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg">2. Wie ben je?</h2>
          <ProfileForm
            phone={profile.phone}
            address={profile.address}
            bio={profile.bio}
            traits={profile.traits ?? []}
            notifyNewTasks={profile.notify_new_tasks}
            isStudent
          />
        </div>
      </div>
    </div>
  );
}
