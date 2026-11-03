import type { ReactNode } from "react";

/** Begrenzter Inhalt mit Rand für alle Seiten außer der randlosen Wand des Boards. */
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>;
}
