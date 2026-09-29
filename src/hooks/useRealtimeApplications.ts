"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TaskApplication } from "@/lib/types/domain";

/**
 * Houdt een lijst aanmeldingen (studenten die interesse toonden in een
 * taak) live via Supabase Realtime — zie useRealtimeTasks voor waarom de
 * kanaalnaam uniek moet zijn per hook-instantie.
 */
export function useRealtimeApplications(initialApplications: TaskApplication[]) {
  const [applications, setApplications] = useState<TaskApplication[]>(
    initialApplications
  );
  const id = useId();

  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`applications-changes-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_applications" },
        (payload) => {
          setApplications((current) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id: string }).id;
              return current.filter((a) => a.id !== oldId);
            }
            const row = payload.new as TaskApplication;
            const exists = current.some((a) => a.id === row.id);
            if (exists) {
              return current.map((a) => (a.id === row.id ? row : a));
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

  return applications;
}
