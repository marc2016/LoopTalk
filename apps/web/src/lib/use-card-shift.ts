import { type RefObject, useLayoutEffect, useRef } from "react";

const DURATION_MS = 650;
const EASING = "cubic-bezier(0.2, 0.7, 0.2, 1)";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Lässt Karten beim Weiterrücken in ihre neue Spalte wandern (FLIP): Der Zettel wird
 * angehoben, gleitet hinüber und wird wieder angedrückt. Archivierte Zettel lösen sich
 * und fallen.
 *
 * Ausgelöst wird nur, wenn die Terminnummer steigt, egal ob die neuen Daten über die
 * eigene Mutation oder über ein Live-Event kommen. Nach jedem Rendern werden die
 * Positionen aller Karten (`[data-card-id]`) gemerkt; archivierte Karten fehlen danach
 * im DOM und werden als Klon an ihrer alten Stelle ausgeblendet.
 */
export function useCardShift(
  container: RefObject<HTMLElement | null>,
  meetingNumber: number,
  onShift: (info: { animated: boolean }) => void,
): void {
  const rects = useRef(new Map<string, DOMRect>());
  const clones = useRef(new Map<string, HTMLElement>());
  const lastNumber = useRef(meetingNumber);
  const onShiftRef = useRef(onShift);

  useLayoutEffect(() => {
    onShiftRef.current = onShift;
  });

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const elements = [...root.querySelectorAll<HTMLElement>("[data-card-id]")];
    const current = new Map(elements.map((el) => [el.dataset.cardId!, el.getBoundingClientRect()]));

    if (meetingNumber > lastNumber.current) {
      const animated = !prefersReducedMotion();
      if (animated) {
        slide(elements, rects.current);
        fall(
          [...clones.current].filter(([id]) => !current.has(id)),
          rects.current,
        );
      }
      onShiftRef.current({ animated });
    }

    lastNumber.current = meetingNumber;
    rects.current = current;
    // Klone für den Fall merken, dass Karten beim nächsten Weiterrücken verschwinden.
    clones.current = new Map(elements.map((el) => [el.dataset.cardId!, el.cloneNode(true) as HTMLElement]));
  });
}

function slide(elements: HTMLElement[], before: Map<string, DOMRect>) {
  const maxJump = window.innerWidth * 1.5;
  for (const el of elements) {
    const old = before.get(el.dataset.cardId!);
    if (!old) continue;
    const now = el.getBoundingClientRect();
    const dx = old.left - now.left;
    const dy = old.top - now.top;
    if ((dx === 0 && dy === 0) || Math.abs(dx) > maxJump || Math.abs(dy) > maxJump) continue;
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(1)` },
        { transform: `translate(${dx}px, ${dy - 6}px) scale(1.04)`, offset: 0.15 },
        { transform: "translate(0, -6px) scale(1.04)", offset: 0.8 },
        { transform: "translate(0, 0) scale(1)" },
      ],
      { duration: DURATION_MS, easing: EASING },
    );
  }
}

function fall(gone: [string, HTMLElement][], before: Map<string, DOMRect>) {
  if (gone.length === 0) return;
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "30" });
  for (const [id, clone] of gone) {
    const rect = before.get(id);
    if (!rect) continue;
    Object.assign(clone.style, {
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: "0",
    });
    clone.removeAttribute("data-card-id");
    clone.removeAttribute("data-testid");
    clone.tabIndex = -1;
    layer.append(clone);
    clone.animate(
      [
        { opacity: 1, transform: "translate(0, 0) rotate(0deg)" },
        // Erst löst sich der Zettel oben, dann kippt er und fällt.
        { opacity: 1, transform: "translate(4px, -6px) rotate(-3deg)", offset: 0.25 },
        { opacity: 0, transform: "translate(40px, 140px) rotate(16deg)" },
      ],
      { duration: DURATION_MS, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" },
    );
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), DURATION_MS + 50);
}
