import { useEffect, useState } from "react";

/** Selektor für offene Dialoge außer der eigenen Karten-Ansicht (`data-card-sheet`). */
const OTHER_OPEN_DIALOG = '[data-slot$="dialog-content"][data-state="open"]:not([data-card-sheet])';

/**
 * Ist gerade ein anderer Dialog offen (z. B. Board umbenennen, Löschen bestätigen)?
 * Dann soll der gemeinsame Fokus nicht dazwischenfunken.
 */
export function useOtherDialogOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const check = () => setOpen(document.querySelector(OTHER_OPEN_DIALOG) !== null);
    const observer = new MutationObserver(check);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-state"] });
    return () => observer.disconnect();
  }, []);
  return open;
}
