import { useRef } from "react";

const OPEN_MS = 320;
const CLOSE_MS = 240;
const EASING = "cubic-bezier(0.2, 0.7, 0.2, 1)";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function cardElement(cardId: number | null): HTMLElement | null {
  if (cardId === null) return null;
  return document.querySelector<HTMLElement>(`[data-card-id="${cardId}"]`);
}

/** Ungedrehte Maße des kleinen Zettels (die Bounding Box wäre durch die Drehung größer). */
function cardBox(card: HTMLElement) {
  const rect = card.getBoundingClientRect();
  const width = card.offsetWidth;
  const height = card.offsetHeight;
  const left = rect.left + (rect.width - width) / 2;
  const top = rect.top + (rect.height - height) / 2;
  const rotate = getComputedStyle(card).rotate;
  return { left, top, width, height, rotate: rotate === "none" ? "0deg" : rotate };
}

/** Keyframes, die den großen Zettel von Lage, Größe und Drehung des kleinen auf seine Position ziehen. */
function fromCard(card: HTMLElement, target: HTMLElement): Keyframe[] {
  const box = cardBox(card);
  const rect = target.getBoundingClientRect();
  // Mitte auf Mitte, damit die Drehung um denselben Punkt läuft wie beim kleinen Zettel.
  const dx = box.left + box.width / 2 - (rect.left + rect.width / 2);
  const dy = box.top + box.height / 2 - (rect.top + rect.height / 2);
  const sx = box.width / rect.width;
  const sy = box.height / rect.height;
  return [
    { transformOrigin: "center", transform: `translate(${dx}px, ${dy}px) rotate(${box.rotate}) scale(${sx}, ${sy})` },
    { transformOrigin: "center", transform: "none" },
  ];
}

/** Der kleine Zettel ist der, der gerade groß ist: Solange er offen ist, steht er nicht zusätzlich auf dem Board. */
function hide(card: HTMLElement | null) {
  if (card) card.style.visibility = "hidden";
}
function show(card: HTMLElement | null) {
  if (card) card.style.visibility = "";
}

/**
 * Lässt den kleinen Zettel zum großen wachsen und beim Schließen dorthin zurückschrumpfen.
 * Währenddessen ist der kleine Zettel ausgeblendet, damit es wirklich derselbe Zettel ist.
 * Ohne sichtbaren Zettel oder bei reduzierter Bewegung wird nur geöffnet und geschlossen.
 *
 * `attach` ist eine Callback-Ref: Der Dialog hängt seinen Inhalt über ein Portal erst
 * nach dem ersten Rendern ein, ein Layout-Effekt käme zu früh.
 */
export function useGrowFromCard(cardId: number | null) {
  const element = useRef<HTMLElement | null>(null);
  // Jedes Element nur einmal animieren: Im StrictMode wird die Ref doppelt angehängt, und eine
  // zweite Messung während der laufenden Animation ergäbe leere Keyframes, die die erste überdecken.
  const animated = useRef<HTMLElement | null>(null);
  const hidden = useRef<HTMLElement | null>(null);

  const attach = (el: HTMLElement | null) => {
    if (el && animated.current !== el) {
      animated.current = el;
      const card = cardElement(cardId);
      if (card && !prefersReducedMotion()) {
        el.animate(fromCard(card, el), { duration: OPEN_MS, easing: EASING });
      }
    }
    // Bei jedem Anhängen ausblenden, nicht nur beim ersten: Im StrictMode folgt auf das erste
    // Anhängen ein Abhängen (zeigt den Zettel wieder) und ein zweites Anhängen.
    if (el) {
      hidden.current = cardElement(cardId);
      hide(hidden.current);
    }
    // Ansicht ausgehängt (auch ohne `close`, z. B. Wechsel in die Fokusansicht): Zettel wieder zeigen.
    if (!el) {
      show(hidden.current);
      hidden.current = null;
    }
    element.current = el;
  };

  /** Schließt mit Rückweg zum Zettel; `done` wird danach (oder sofort) aufgerufen. */
  const close = (done: () => void) => {
    const el = element.current;
    const card = cardElement(cardId);
    const finish = () => {
      show(card);
      done();
    };
    if (!el || !card || prefersReducedMotion()) return finish();
    el.animate(fromCard(card, el).reverse(), {
      duration: CLOSE_MS,
      easing: EASING,
      fill: "forwards",
    }).finished.then(finish, finish);
  };

  return { attach, close };
}
