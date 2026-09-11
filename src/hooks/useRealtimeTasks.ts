"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/types/domain";

/**
 * Houdt een lijst taken live via Supabase Realtime. RLS bepaalt welke
 * rijen een gebruiker ontvangt (open taken + eigen taken), dus deze hook
 * hoeft zelf niet te filteren op rol — enkel te mergen.
 */
export function useRealtimeTasks(initialTasks: Task[]) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          setTasks((current) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id: string }).id;
              return current.filter((t) => t.id !== oldId);
            }
            const row = payload.new as Task;
            const exists = current.some((t) => t.id === row.id);
            if (exists) {
              return current.map((t) => (t.id === row.id ? row : t));
            }
            return [row, ...current];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return tasks;
}
