import Image from "next/image";
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
        <div className="flex items-center gap-3">
          <Image
            src="/flexhulp-logo.png"
            alt="Flexhulp"
            width={190}
            height={40}
            priority
            className="h-9 w-auto"
          />
          <span className="hidden text-sm text-ink-soft sm:inline">
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
