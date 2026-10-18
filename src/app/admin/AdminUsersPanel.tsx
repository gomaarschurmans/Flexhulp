"use client";

import { useMemo, useState } from "react";
import { setUserBanned } from "@/app/admin/actions";
import { ConfirmAction } from "@/components/ConfirmAction";
import { StudentAvatar } from "@/components/StudentAvatar";
import { Stars } from "@/components/Stars";
import { formatRating } from "@/lib/utils";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { formatEuro } from "@/lib/utils";
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
    const map = new Map<
      string,
      { count: number; ratings: number[]; clientRatings: number[]; toPay: number; paid: number }
    >();
    for (const t of tasks) {
      const id = kind === "client" ? t.client_id : t.student_id;
      if (!id) continue;
      if (kind === "student" && t.status !== "done") continue;
      const entry = map.get(id) ?? { count: 0, ratings: [], clientRatings: [], toPay: 0, paid: 0 };
      if (kind === "client" && t.student_rating !== null) entry.clientRatings.push(t.student_rating);
      entry.count += 1;
      if (kind === "student") {
        const amount = t.hours * t.rate_at_creation;
        if (t.student_paid_at) entry.paid += amount;
        else entry.toPay += amount;
      }
      if (kind === "student" && t.rating !== null) entry.ratings.push(t.rating);
      map.set(id, entry);
    }
    return map;
  }, [tasks, kind]);

  // Alle beoordelingen die een student van klanten kreeg, nieuwste eerst.
  const reviewsByStudent = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.student_id || t.status !== "done" || t.rating === null) continue;
      map.set(t.student_id, [...(map.get(t.student_id) ?? []), t]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => ((a.completed_at ?? "") < (b.completed_at ?? "") ? 1 : -1));
    }
    return map;
  }, [tasks]);

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
              {kind === "student" && (
                <th className="border-b border-line px-3.5 py-2.5 font-semibold">Uitbetaling</th>
              )}
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">Status</th>
              <th className="border-b border-line px-3.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={kind === "student" ? 6 : 5} className="px-3.5 py-6 text-ink-soft">
                  Geen {copy.noun} gevonden voor deze zoekopdracht.
                </td>
              </tr>
            ) : (
              visible.map((u) => {
                const s = stats.get(u.id);
                const reviews = reviewsByStudent.get(u.id) ?? [];
                return (
                  <tr key={u.id}>
                    <td className="border-b border-line px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {kind === "student" && (
                          <StudentAvatar
                            studentId={u.id}
                            name={u.name}
                            hasPhoto={Boolean(u.photo_path)}
                            size={36}
                            version={u.photo_updated_at}
                          />
                        )}
                        <div>
                          {u.name}
                          {kind === "student" && (
                            <span
                              className={`block text-xs ${
                                u.photo_status === "approved"
                                  ? "text-teal"
                                  : u.photo_status === "pending"
                                    ? "text-amber-deep"
                                    : "text-danger"
                              }`}
                            >
                              {u.photo_status === "approved"
                                ? "Foto goedgekeurd"
                                : u.photo_status === "pending"
                                  ? "Foto wacht op goedkeuring"
                                  : u.photo_status === "rejected"
                                    ? "Foto afgekeurd"
                                    : "Nog geen foto"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-line px-3.5 py-2.5">
                      {u.email}
                      {u.phone && (
                        <span className="block text-xs text-ink-soft">{u.phone}</span>
                      )}
                    </td>
                    <td className="border-b border-line px-3.5 py-2.5">
                      {kind === "student" ? u.jobs_done : (s?.count ?? 0)}
                      {kind === "student" && (
                        <span className="mt-1 block">
                          {u.rating_count > 0 && u.rating_avg !== null ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <Stars value={Number(u.rating_avg)} size={14} />
                              <span className="font-semibold">{formatRating(Number(u.rating_avg))}</span>
                              <span className="text-ink-soft">
                                ({u.rating_count} beoordeling{u.rating_count > 1 ? "en" : ""})
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-ink-soft">Nog geen beoordelingen</span>
                          )}
                        </span>
                      )}
                      {kind === "student" && reviews.length > 0 && (
                        <details className="mt-1.5 text-xs">
                          <summary className="cursor-pointer font-semibold text-ink-soft">
                            Alle beoordelingen
                          </summary>
                          <ul className="mt-1.5 flex flex-col gap-1.5">
                            {reviews.map((r) => (
                              <li key={r.id} className="rounded border border-line bg-[#FAF9F6] p-2">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <Stars value={Number(r.rating)} size={12} />
                                  <span className="font-semibold">{formatRating(Number(r.rating))}</span>
                                  <span className="text-ink-soft">
                                    · {r.category} · {r.client_name} ·{" "}
                                    {new Date(r.completed_at ?? r.created_at).toLocaleDateString("nl-BE")}
                                  </span>
                                </span>
                                {r.review_comment && <span className="mt-0.5 block">“{r.review_comment}”</span>}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {kind === "client" && s && s.clientRatings.length > 0 && (
                        <span className="block text-xs text-ink-soft">
                          Beoordeeld door studenten: ★{" "}
                          {(s.clientRatings.reduce((a, b) => a + b, 0) / s.clientRatings.length)
                            .toFixed(1)
                            .replace(".", ",")}{" "}
                          ({s.clientRatings.length})
                        </span>
                      )}
                    </td>
                    {kind === "student" && (
                      <td className="border-b border-line px-3.5 py-2.5 text-xs">
                        <span className={s && s.toPay > 0 ? "font-semibold text-amber-deep" : "text-ink-soft"}>
                          Te betalen: {formatEuro(s?.toPay ?? 0)}
                        </span>
                        <span className="block text-ink-soft">
                          Uitbetaald: {formatEuro(s?.paid ?? 0)}
                        </span>
                      </td>
                    )}
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
