import { type RefObject, useLayoutEffect } from "react";

/**
 * Schreibt die Höhe des festen Stapels unten (Fokus-Toast + Dock) als `--dock-h` ans
 * Dokument. Die Wand nutzt sie als Innenabstand, `scroll-padding` hält fokussierte
 * Zettel oberhalb des Docks.
 */
export function useDockHeight(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = () => root.style.setProperty("--dock-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--dock-h");
    };
  }, [ref]);
}
