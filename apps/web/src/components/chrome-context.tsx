import { createContext, useContext } from "react";

/**
 * Slot in der Glasleiste: Das Board-Layout hängt dort per Portal Name, Bereiche,
 * Link und Anwesenheit ein; Seiten ohne Board lassen ihn leer.
 */
const ChromeSlotContext = createContext<HTMLElement | null>(null);

export const ChromeSlotProvider = ChromeSlotContext.Provider;
export const useChromeSlot = () => useContext(ChromeSlotContext);
