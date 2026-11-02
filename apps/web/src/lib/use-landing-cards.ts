import { useState } from "react";

/**
 * Merkt sich, welche Karten seit dem ersten Anzeigen des Boards neu hinzugekommen sind,
 * egal ob über die eigene Mutation oder ein Live-Event. Beim Laden und nach einem
 * Reconnect landet nichts; Karten, die nur die Spalte wechseln, auch nicht.
 */
export function useLandingCards(cardIds: number[]): { landing: ReadonlySet<number>; landed: (id: number) => void } {
  const [known, setKnown] = useState(() => new Set(cardIds));
  const [landing, setLanding] = useState<ReadonlySet<number>>(() => new Set());

  const fresh = cardIds.filter((id) => !known.has(id));
  if (fresh.length > 0) {
    setKnown(new Set([...known, ...fresh]));
    setLanding(new Set([...landing, ...fresh]));
  }

  const landed = (id: number) =>
    setLanding((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  return { landing, landed };
}
