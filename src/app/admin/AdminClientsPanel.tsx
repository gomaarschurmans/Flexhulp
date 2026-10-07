"use client";

import { setClientBanned } from "@/app/admin/actions";
import { ConfirmAction } from "@/components/ConfirmAction";
import type { Profile } from "@/lib/types/domain";

export function AdminClientsPanel({ clients }: { clients: Profile[] }) {
  if (clients.length === 0) {
    return (
      <div className="rounded border border-dashed border-line p-8 text-center text-sm text-ink-soft">
        Nog geen klanten geregistreerd.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-line bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#FAF9F6] text-left text-ink-soft">
            <th className="border-b border-line px-3.5 py-2.5 font-semibold">Naam</th>
            <th className="border-b border-line px-3.5 py-2.5 font-semibold">E-mail</th>
            <th className="border-b border-line px-3.5 py-2.5 font-semibold">Status</th>
            <th className="border-b border-line px-3.5 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td className="border-b border-line px-3.5 py-2.5">{c.name}</td>
              <td className="border-b border-line px-3.5 py-2.5">{c.email}</td>
              <td className="border-b border-line px-3.5 py-2.5">
                {c.banned ? (
                  <span className="rounded-full bg-[#FBEAE6] px-2.5 py-1 text-xs font-semibold text-danger">
                    Geblokkeerd
                  </span>
                ) : (
                  <span className="rounded-full bg-teal-soft px-2.5 py-1 text-xs font-semibold text-teal">
                    Actief
                  </span>
                )}
              </td>
              <td className="border-b border-line px-3.5 py-2.5">
                {c.banned ? (
                  <ConfirmAction
                    action={setClientBanned.bind(null, c.id, false)}
                    label="Deblokkeren"
                    successMessage={`${c.name} is gedeblokkeerd.`}
                  />
                ) : (
                  <ConfirmAction
                    action={setClientBanned.bind(null, c.id, true)}
                    label="Blokkeren"
                    successMessage={`${c.name} is geblokkeerd.`}
                    confirm={{
                      title: `${c.name} blokkeren?`,
                      text: "Deze klant kan dan niet meer boeken of aanvragen indienen. Je kan dit later ongedaan maken.",
                      confirmLabel: "Ja, blokkeer",
                      danger: true,
                    }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
