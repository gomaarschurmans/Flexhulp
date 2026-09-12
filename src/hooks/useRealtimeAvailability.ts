"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AvailabilitySlot } from "@/lib/types/domain";

/**
 * Houdt een lijst tijdsloten live via Supabase Realtime, zodat een geboekt
 * slot meteen verdwijnt (of "booked" toont) zonder paginaverversing.
 */
export function useRealtimeAvailability(initialSlots: AvailabilitySlot[]) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);

  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("availability-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "availability" },
        (payload) => {
          setSlots((current) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id: string }).id;
              return current.filter((s) => s.id !== oldId);
            }
            const row = payload.new as AvailabilitySlot;
            const exists = current.some((s) => s.id === row.id);
            if (exists) {
              return current.map((s) => (s.id === row.id ? row : s));
            }
            return [...current, row];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return slots;
}
