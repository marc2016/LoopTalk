import type { Column } from "@looptalk/shared";

export const columns: Column[] = [1, 2, 3];

const titles: Record<Column, string> = { 1: "Neu", 2: "Zweite Runde", 3: "Letzte Runde" };

export interface ColumnLifecycle {
  column: Column;
  title: string;
  /** Termine, bei denen ein Thema dieser Spalte noch auf dem Board steht (inklusive aktuellem). */
  remaining: number;
  /** Letzter Termin, bei dem es noch auf dem Board steht. */
  lastMeeting: number;
  /** Text für den Spaltenkopf, z. B. „bis Termin 7“ oder „nur noch Termin 5“. */
  until: string;
  /** Text für die Karte, z. B. „noch 3 Termine“ oder „letzte Chance“. */
  cardLabel: string;
}

/** Wie lange Themen einer Spalte noch auf dem Board bleiben, gemessen am aktuellen Termin. */
export function lifecycle(column: Column, meetingNumber: number): ColumnLifecycle {
  const remaining = 4 - column;
  const lastMeeting = meetingNumber + remaining - 1;
  return {
    column,
    title: titles[column],
    remaining,
    lastMeeting,
    until: remaining === 1 ? `nur noch Termin ${lastMeeting}` : `bis Termin ${lastMeeting}`,
    cardLabel: remaining === 1 ? "letzte Chance" : `noch ${remaining} Termine`,
  };
}

export const columnTitle = (column: Column) => titles[column];
