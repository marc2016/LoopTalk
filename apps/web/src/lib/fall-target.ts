export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Fallweg ohne sichtbare Ablage: schräg nach rechts unten aus dem Board. */
export const DEFAULT_FALL = { dx: 40, dy: 140 };

/**
 * Wohin ein archivierter Zettel fällt: in die Mitte der Archiv-Ablage, sofern sie im
 * sichtbaren Bereich liegt; sonst der bisherige feste Weg.
 */
export function fallTarget(from: Box, tray: Box | null, viewport: { width: number; height: number }) {
  if (!tray || tray.width === 0 || tray.height === 0) return DEFAULT_FALL;
  const cx = tray.left + tray.width / 2;
  const cy = tray.top + tray.height / 2;
  if (cx < 0 || cy < 0 || cx > viewport.width || cy > viewport.height) return DEFAULT_FALL;
  return { dx: cx - (from.left + from.width / 2), dy: cy - (from.top + from.height / 2) };
}
