import type { PresenceEvent, UserRef } from "@looptalk/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "./api";
import { keys } from "./queries";

/**
 * Live-Verbindung zu einem Board. Ein `board`-Event lädt alle Daten des Boards
 * neu, `presence` zeigt, wer gerade da ist. Bricht die Verbindung ab, verbindet
 * sich der Browser selbst neu; nach dem Wiederverbinden wird neu geladen.
 */
export function useBoardEvents(slug: string): { present: UserRef[]; connected: boolean } {
  const qc = useQueryClient();
  const [present, setPresent] = useState<UserRef[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let opened = false;
    let stopped = false;
    const reload = () => qc.invalidateQueries({ queryKey: keys.board(slug) });

    const open = () => {
      source = new EventSource(`/api/boards/${slug}/events`);
      source.onopen = () => {
        setConnected(true);
        if (opened) void reload();
        opened = true;
      };
      source.addEventListener("board", () => void reload());
      source.addEventListener("presence", (e) => setPresent((JSON.parse(e.data) as PresenceEvent).users));
      source.addEventListener("unauthorized", () => {
        source?.close();
        // Löst bei abgelaufener Session die Umleitung zum Login aus.
        void api("/me").catch(() => undefined);
      });
      source.onerror = () => {
        setConnected(false);
        // Bei HTTP-Fehlern (z. B. 401) gibt EventSource auf; dann selbst prüfen und neu verbinden.
        if (source?.readyState === EventSource.CLOSED && !stopped) {
          void api("/me")
            .then(() => {
              retry = setTimeout(open, 3000);
            })
            .catch(() => undefined);
        }
      };
    };

    open();
    return () => {
      stopped = true;
      clearTimeout(retry);
      source?.close();
    };
  }, [qc, slug]);

  return { present, connected };
}
