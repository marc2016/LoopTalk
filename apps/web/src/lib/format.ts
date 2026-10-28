const dateTime = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });
const time = new Intl.DateTimeFormat("de-DE", { timeStyle: "short" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatTime = (iso: string) => time.format(new Date(iso));

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase() || "?";
}

/** Laufzeit eines Termins: „seit 23 min“, ab einer Stunde „seit 1 h 05 min“. */
export function formatDuration(startedAt: string, now: Date): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 60_000));
  if (minutes < 60) return `seit ${minutes} min`;
  return `seit ${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
}
