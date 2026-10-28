import { useRef } from "react";

const OPEN_MS = 260;
const CLOSE_MS = 200;
const EASING = "cubic-bezier(0.2, 0.7, 0.2, 1)";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function cardRect(cardId: number | null): DOMRect | null {
  if (cardId === null) return null;
  return document.querySelector(`[data-card-id="${cardId}"]`)?.getBoundingClientRect() ?? null;
}

/** Keyframes, die das Element von der Karte auf seine endgültige Position ziehen. */
function fromCard(card: DOMRect, target: DOMRect): Keyframe[] {
  const dx = card.left - target.left;
  const dy = card.top - target.top;
  const sx = card.width / target.width;
  const sy = card.height / target.height;
  return [
    { transformOrigin: "top left", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.4 },
    { transformOrigin: "top left", transform: "none", opacity: 1 },
  ];
}

/**
 * Lässt die große Karten-Ansicht aus der Karte im Board wachsen und beim Schließen
 * dorthin zurückschrumpfen. Ohne sichtbare Karte oder bei reduzierter Bewegung
 * passiert nichts weiter als das normale Öffnen und Schließen.
 *
 * `attach` ist eine Callback-Ref: Der Dialog hängt seinen Inhalt über ein Portal erst
 * nach dem ersten Rendern ein, ein Layout-Effekt käme zu früh.
 */
export function useGrowFromCard(cardId: number | null) {
  const element = useRef<HTMLElement | null>(null);
  // Jedes Element nur einmal animieren: Im StrictMode wird die Ref doppelt angehängt, und eine
  // zweite Messung während der laufenden Animation ergäbe leere Keyframes, die die erste überdecken.
  const animated = useRef<HTMLElement | null>(null);

  const attach = (el: HTMLElement | null) => {
    if (el && animated.current !== el) {
      animated.current = el;
      const card = cardRect(cardId);
      if (card && !prefersReducedMotion()) {
        el.animate(fromCard(card, el.getBoundingClientRect()), { duration: OPEN_MS, easing: EASING });
      }
    }
    element.current = el;
  };

  /** Schließt mit Rückweg zur Karte; `done` wird danach (oder sofort) aufgerufen. */
  const close = (done: () => void) => {
    const el = element.current;
    const card = cardRect(cardId);
    if (!el || !card || prefersReducedMotion()) return done();
    el.animate(fromCard(card, el.getBoundingClientRect()).reverse(), {
      duration: CLOSE_MS,
      easing: EASING,
      fill: "forwards",
    }).finished.then(done, done);
  };

  return { attach, close };
}
