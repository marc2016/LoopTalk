import { CARD_COLORS, type CardColor, type Column } from "@looptalk/shared";

/** Größte Drehung eines Zettels in Grad, in beide Richtungen. */
export const MAX_TILT = 1.5;

/** Feste, leichte Drehung aus der Karten-ID: auf allen Geräten und nach dem Neuladen gleich. */
export function noteTilt(cardId: number): number {
  // Integer-Hash (Knuth), damit benachbarte IDs nicht gleich gedreht sind.
  const hash = Math.imul(cardId, 2654435761) >>> 0;
  const unit = (hash % 1000) / 999; // 0 … 1
  return Math.round((unit * 2 - 1) * MAX_TILT * 100) / 100;
}

/** Alter eines Zettels = verbleibende Termine: 3 in Spalte 1, 2 in Spalte 2, 1 in Spalte 3. */
export function noteAge(column: Column): 1 | 2 | 3 {
  return (4 - column) as 1 | 2 | 3;
}

export const noteColorNames: Record<CardColor, string> = {
  yellow: "Gelb",
  orange: "Orange",
  pink: "Rosa",
  green: "Grün",
  blue: "Blau",
  purple: "Lila",
};

export const noteColors = CARD_COLORS;
