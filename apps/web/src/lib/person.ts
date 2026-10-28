const PALETTE_SIZE = 8;

/** Feste Personenfarbe aus der Benutzer-ID (nicht dem Namen), als CSS-Variablen. */
export function personColor(userId: number): { bg: string; fg: string } {
  const index = ((userId % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE;
  return { bg: `var(--person-${index}-bg)`, fg: `var(--person-${index}-fg)` };
}
