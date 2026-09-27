"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatEuro } from "@/lib/utils";
import type { Task } from "@/lib/types/domain";

const MONTH_LABELS = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

export function AdminRevenueReport({ tasks }: { tasks: Task[] }) {
  const done = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);

  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of done) {
      const [y, m] = t.date.split("-");
      const key = `${y}-${m}`;
      map.set(key, (map.get(key) ?? 0) + t.hours * t.rate_at_creation);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, revenue]) => {
        const [, m] = key.split("-");
        return { label: MONTH_LABELS[parseInt(m, 10) - 1], revenue };
      });
  }, [done]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of done) {
      map.set(t.category, (map.get(t.category) ?? 0) + t.hours * t.rate_at_creation);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [done]);

  const totalRevenue = done.reduce((sum, t) => sum + t.hours * t.rate_at_creation, 0);
  const avgRating = useMemo(() => {
    const rated = done.filter((t) => t.rating !== null);
    if (rated.length === 0) return null;
    return rated.reduce((s, t) => s + (t.rating ?? 0), 0) / rated.length;
  }, [done]);

  if (done.length === 0) {
    return (
      <div className="rounded border border-dashed border-line p-8 text-center text-sm text-ink-soft">
        Nog geen voltooide taken om te rapporteren.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="card">
          <span className="mb-0.5 block text-2xl font-semibold">
            {formatEuro(totalRevenue)}
          </span>
          <span className="text-xs text-ink-soft">Totale omzet (voltooid)</span>
        </div>
        <div className="card">
          <span className="mb-0.5 block text-2xl font-semibold">{done.length}</span>
          <span className="text-xs text-ink-soft">Voltooide klussen</span>
        </div>
        <div className="card">
          <span className="mb-0.5 block text-2xl font-semibold">
            {avgRating !== null ? `${avgRating.toFixed(1)} / 5` : "—"}
          </span>
          <span className="text-xs text-ink-soft">Gemiddelde beoordeling</span>
        </div>
      </div>

      <div className="mb-6" style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={byMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1DDD3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => formatEuro(v)} />
            <Bar dataKey="revenue" fill="#1E2A44" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 className="mb-2 text-base">Omzet per categorie</h3>
      <div className="flex flex-col gap-1.5">
        {byCategory.map(([category, revenue]) => (
          <div
            key={category}
            className="flex items-center justify-between rounded border border-line bg-[#FAF9F6] px-3.5 py-2 text-sm"
          >
            <span>{category}</span>
            <strong>{formatEuro(revenue)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
