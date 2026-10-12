"use client";

import { useMemo, useState } from "react";
import { setUserBanned } from "@/app/admin/actions";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import type { Profile, Task } from "@/lib/types/domain";

type Kind = "client" | "student";

const COPY: Record<
  Kind,
  { empty: string; noun: string; banText: string; unit: string }
> = {
  client: {
    empty: "Nog geen klanten geregistreerd.",
    noun: "klanten",
    banText:
      "Deze klant kan dan niet meer boeken of aanvragen indienen. Je kan dit later ongedaan maken.",
    unit: "taken",
  },
  student: {
    empty: "Nog geen studenten geregistreerd.",
    noun: "studenten",
    banText:
      "Deze student kan zich dan niet meer aanmelden voor klussen. Reeds toegewezen klussen blijven staan. Je kan dit later ongedaan maken.",
    unit: "klussen",
  },
};

export function AdminUsersPanel({
  kind,
  users,
  tasks,
}: {
  kind: Kind;
  users: Profile[];
  tasks: Task[];
}) {
  const copy = COPY[kind];
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Aantal taken (klant) of voltooide klussen + gemiddelde score (student).
  const stats = useMemo(() => {
    const map = new Map<string, { count: number; ratings: number[] }>();
    for (const t of tasks) {
      const id = kind === "client" ? t.client_id : t.student_id;
      if (!id) continue;
      if (kind === "student" && t.status !== "done") continue;
      const entry = map.get(id) ?? { count: 0, ratings: [] };
      entry.count += 1;
      if (kind === "student" && t.rating !== null) entry.ratings.push(t.rating);
      map.set(id, entry);
    }
    return map;
  }, [tasks, kind]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.phone].some((v) => v?.toLowerCase().includes(q))
    );
  }, [users, query]);

  const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (users.length === 0) {
    return (
      <div className="rounded border border-dashed border-line p-8 text-center text-sm text-ink-soft">
        {copy.empty}
      </div>
    );
  }

  return (
    <div>
      <div className="field mb-4 w-full max-w-sm">
        <label htmlFor={`search_${kind}`} className="sr-only">
          Zoeken
        </label>
        <input
          id={`search_${kind}`}
          type="search"
          placeholder="Zoek op naam, e-mail of telefoon"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-x-auto rounded border border-line bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#FAF9F6] text-left text-ink-soft">
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">Naam</th>
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">Contact</th>
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">
                {kind === "client" ? "Taken" : "Klussen · score"}
              </th>
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">Status</th>
              <th className="border-b border-line px-3.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3.5 py-6 text-ink-soft">
                  Geen {copy.noun} gevonden voor deze zoekopdracht.
                </td>
              </tr>
            ) : (
              visible.map((u) => {
                const s = stats.get(u.id);
                const avg =
                  s && s.ratings.length
                    ? (s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length)
                        .toFixed(1)
                        .replace(".", ",")
                    : null;
                return (
                  <tr key={u.id}>
                    <td className="border-b border-line px-3.5 py-2.5">{u.name}</td>
                    <td className="border-b border-line px-3.5 py-2.5">
                      {u.email}
                      {u.phone && (
                        <span className="block text-xs text-ink-soft">{u.phone}</span>
                      )}
                    </td>
                    <td className="border-b border-line px-3.5 py-2.5">
                      {s?.count ?? 0}
                      {kind === "student" && (avg ? ` · ★ ${avg}` : " · nog geen score")}
                    </td>
                    <td className="border-b border-line px-3.5 py-2.5">
                      {u.banned ? (
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
                      {u.banned ? (
                        <ConfirmAction
                          action={setUserBanned.bind(null, u.id, false)}
                          label="Deblokkeren"
                          successMessage={`${u.name} is gedeblokkeerd.`}
                        />
                      ) : (
                        <ConfirmAction
                          action={setUserBanned.bind(null, u.id, true)}
                          label="Blokkeren"
                          successMessage={`${u.name} is geblokkeerd.`}
                          confirm={{
                            title: `${u.name} blokkeren?`,
                            text: copy.banText,
                            confirmLabel: "Ja, blokkeer",
                            danger: true,
                          }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={currentPage} total={filtered.length} onPage={setPage} />
    </div>
  );
}
