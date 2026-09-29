"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { HourRequest } from "@/lib/types/domain";

/**
 * Houdt een lijst aanvragen live via Supabase Realtime — zie
 * useRealtimeTasks voor waarom de kanaalnaam uniek moet zijn per
 * hook-instantie.
 */
export function useRealtimeRequests(initialRequests: HourRequest[]) {
  const [requests, setRequests] = useState<HourRequest[]>(initialRequests);
  const id = useId();

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`requests-changes-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        (payload) => {
          setRequests((current) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id: string }).id;
              return current.filter((r) => r.id !== oldId);
            }
            const row = payload.new as HourRequest;
            const exists = current.some((r) => r.id === row.id);
            if (exists) {
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
  }, [id]);

  return requests;
}
