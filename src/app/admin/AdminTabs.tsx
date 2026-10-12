"use client";

import { useState, type ReactNode } from "react";

export type AdminTab = {
  id: string;
  label: string;
  badge?: number;
  content: ReactNode;
};

/**
 * Tabbladen voor het adminpaneel. Alle inhoud wordt op de server opgebouwd en
 * enkel verborgen/getoond, zodat realtime-updates doorlopen. Het actieve
 * tabblad staat in de URL (?tab=...) zodat verversen en delen werkt.
 */
export function AdminTabs({
  tabs,
  initialTab,
}: {
  tabs: AdminTab[];
  initialTab: string;
}) {
  const [active, setActive] = useState(
    tabs.some((t) => t.id === initialTab) ? initialTab : tabs[0].id
  );

  function select(id: string) {
    setActive(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  }

  return (
    <div>
      <div
        role="tablist"
        className="mb-8 flex gap-1 overflow-x-auto border-b border-line"
      >
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              onClick={() => select(t.id)}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                selected
                  ? "border-navy text-navy"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {t.label}
              {t.badge ? (
                <span className="rounded-full bg-amber px-2 py-0.5 text-xs font-semibold text-white">
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={t.id !== active}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
