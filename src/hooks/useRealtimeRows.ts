"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Generieke realtime-lijst voor tabellen met een `id`-kolom. Kanaalnaam is
 * uniek per instantie, zie useRealtimeTasks voor waarom.
 */
export function useRealtimeRows<T extends { id: string }>(
  table: string,
  initialRows: T[]
) {
  const [rows, setRows] = useState<T[]>(initialRows);
  const id = useId();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`${table}-changes-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          setRows((current) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id: string }).id;
              return current.filter((r) => r.id !== oldId);
            }
            const row = payload.new as T;
            if (current.some((r) => r.id === row.id)) {
              return current.map((r) => (r.id === row.id ? row : r));
            }
            return [row, ...current];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, table]);

  return rows;
}
