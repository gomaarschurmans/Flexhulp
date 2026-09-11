import type { Role } from "@/lib/types/domain";
import { LogoutButton } from "@/components/LogoutButton";

const ROLE_LABEL: Record<Role, string> = {
  client: "Klant",
  student: "Student",
  admin: "Admin",
};

const ROLE_DOT: Record<Role, string> = {
  client: "bg-navy",
  student: "bg-teal",
  admin: "bg-admin",
};

export function Navbar({ name, role }: { name: string; role: Role }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div className="flex items-baseline gap-3">
          <h1 className="m-0 text-3xl text-navy">Flexhulp</h1>
          <span className="text-sm text-ink-soft">
            klussen &amp; opdrachten voor studenten
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${ROLE_DOT[role]}`} />
            {name} · {ROLE_LABEL[role]}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
