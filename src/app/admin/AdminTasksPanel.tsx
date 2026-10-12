"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { adminDeleteTask, markTaskDone } from "@/app/admin/actions";
import { formatEuro } from "@/lib/utils";
import { formatInvoiceNumber } from "@/lib/invoicing/business";
import type { InvoiceSummary, PaymentStatus, Task, TaskStatus } from "@/lib/types/domain";

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: "–",
  pending: "Wacht op betaling",
  paid: "Betaald",
  failed: "Mislukt",
  expired: "Verlopen",
  canceled: "Geannuleerd",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  unpaid: "text-ink-soft",
  pending: "text-amber-deep",
  paid: "text-teal",
  failed: "text-danger",
  expired: "text-ink-soft",
  canceled: "text-ink-soft",
};

export function AdminTasksPanel({
  initialTasks,
  invoices,
}: {
  initialTasks: Task[];
  invoices: InvoiceSummary[];
}) {
  const tasks = useRealtimeTasks(initialTasks);

  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status === "open").length;
    const accepted = tasks.filter((t) => t.status === "accepted").length;
    const done = tasks.filter((t) => t.status === "done");
    const payout = done.reduce((sum, t) => sum + t.hours * t.rate_at_creation, 0);
    return { open, accepted, done: done.length, payout };
  }, [tasks]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...tasks]
      .filter((t) => statusFilter === "all" || t.status === statusFilter)
      .filter(
        (t) =>
          !q ||
          [t.title, t.client_name, t.student_name, t.description, t.category]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
      )
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [tasks, query, statusFilter]);

  // Blijf op een geldige pagina als filters of realtime-updates de lijst verkleinen.
  const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const sorted = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="mb-7 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Open taken" value={String(stats.open)} />
        <StatCard label="Toegewezen" value={String(stats.accepted)} />
        <StatCard label="Voltooid" value={String(stats.done)} />
        <StatCard label="Uitbetaald (voltooid)" value={formatEuro(stats.payout)} />
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2>Alle taken</h2>
        <div className="flex flex-wrap gap-3">
          <div className="field mb-0 w-56">
            <label htmlFor="task_search" className="sr-only">
              Zoeken
            </label>
            <input
              id="task_search"
              type="search"
              placeholder="Zoek op taak, klant of student"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="field mb-0 w-40">
            <label htmlFor="task_status" className="sr-only">
              Status
            </label>
            <select
              id="task_status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "all" | TaskStatus);
                setPage(1);
              }}
            >
              <option value="all">Alle statussen</option>
              <option value="open">Open</option>
              <option value="accepted">Toegewezen</option>
              <option value="done">Voltooid</option>
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded border border-line bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#FAF9F6] text-left text-ink-soft">
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">Taak</th>
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">Klant</th>
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">Student</th>
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">Uren</th>
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">Uitbetaling</th>
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">Status</th>
              <th className="border-b border-line px-3.5 py-2.5 font-semibold">Betaling</th>
              <th className="border-b border-line px-3.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3.5 py-6 text-ink-soft">
                  {tasks.length === 0
                    ? "Nog geen taken op het platform."
                    : "Geen taken gevonden voor deze zoekopdracht."}
                </td>
              </tr>
            ) : (
              sorted.map((t) => (
                <tr key={t.id}>
                  <td className="border-b border-line px-3.5 py-2.5">{t.title}</td>
                  <td className="border-b border-line px-3.5 py-2.5">{t.client_name}</td>
                  <td className="border-b border-line px-3.5 py-2.5">{t.student_name ?? "–"}</td>
                  <td className="border-b border-line px-3.5 py-2.5">{t.hours}</td>
                  <td className="border-b border-line px-3.5 py-2.5">
                    {formatEuro(t.hours * t.rate_at_creation)}
                  </td>
                  <td className="border-b border-line px-3.5 py-2.5">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className={`border-b border-line px-3.5 py-2.5 ${PAYMENT_STYLES[t.payment_status]}`}>
                    {PAYMENT_LABELS[t.payment_status]}
                  </td>
                  <td className="border-b border-line px-3.5 py-2.5">
                    <div className="flex flex-wrap gap-2">
                      {t.status === "open" && (
                        <ConfirmAction
                          action={markTaskDone.bind(null, t.id)}
                          label="Markeer voltooid"
                          successMessage="Klus voltooid. De klant ontvangt de factuur per mail."
                          confirm={{
                            title: "Klus als voltooid markeren?",
                            text: `${t.client_name} ontvangt meteen een factuur per mail (met betaallink als online betalen actief is). Dit kan je niet ongedaan maken.`,
                            confirmLabel: "Ja, voltooid",
                          }}
                        />
                      )}
                      {(() => {
                        const invoice = invoices.find((i) => i.task_id === t.id);
                        return invoice ? (
                          <Link
                            href={`/admin/facturen/${invoice.id}`}
                            className="btn btn-ghost px-3.5 py-2 text-xs"
                          >
                            {formatInvoiceNumber(invoice.invoice_number)}
                          </Link>
                        ) : null;
                      })()}
                      <ConfirmAction
                        action={adminDeleteTask.bind(null, t.id)}
                        label="Verwijder"
                        successMessage="Taak verwijderd."
                        confirm={{
                          title: "Taak verwijderen?",
                          text: "De taak verdwijnt definitief en het tijdstip komt weer vrij. Een taak met een factuur kan om boekhoudkundige redenen niet verwijderd worden.",
                          confirmLabel: "Ja, verwijder",
                          danger: true,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={currentPage} total={filtered.length} onPage={setPage} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <span className="mb-0.5 block text-[28px] font-semibold">{value}</span>
      <span className="text-xs text-ink-soft">{label}</span>
    </div>
  );
}
