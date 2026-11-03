import fs from "node:fs";
import path from "node:path";
import { BOARD_WALLS, CARD_COLORS } from "@looptalk/shared";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Kontrast auf Glas: Weiß mit der Deckung aus --glass-bg über jeder Zettelfarbe
// und jeder Wand, gelesen aus index.css
// ---------------------------------------------------------------------------

const css = fs.readFileSync(path.join(import.meta.dirname, "../index.css"), "utf8");

type Oklch = [l: number, c: number, h: number];

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Token --${name} fehlt in index.css`);
  return match[1]!.trim();
}

function oklch(name: string): Oklch {
  const match = token(name).match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/);
  if (!match) throw new Error(`--${name} ist kein oklch(L C H)`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Deckung des Glases, z. B. 0.8 aus `oklch(1 0 0 / 0.8)`. */
function glassAlpha(): number {
  const match = token("glass-bg").match(/^oklch\(1 0 0 \/ ([\d.]+)\)$/);
  if (!match) throw new Error("--glass-bg ist kein weißes oklch mit Deckung");
  return Number(match[1]);
}

/** Weiß mit Deckung `alpha` über einer Farbe: Helligkeit und Chroma linear gemischt. */
function whiteOver([l, c, h]: Oklch, alpha: number): Oklch {
  return [l * (1 - alpha) + alpha, c * (1 - alpha), h];
}

function luminance([l, c, h]: Oklch): number {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const r = clamp(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_);
  const g = clamp(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_);
  const bl = clamp(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

function contrast(x: Oklch, y: Oklch): number {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe("Glas", () => {
  const alpha = glassAlpha();
  const behind = [
    ...CARD_COLORS.map((color) => [`Zettel ${color}`, oklch(`note-${color}`)] as const),
    ...BOARD_WALLS.map((wall) => [`Wand ${wall}`, oklch(`wall-${wall}-bg`)] as const),
  ];

  for (const [name, color] of behind) {
    it(`über ${name}: Schrift und Akzent erreichen WCAG AA`, () => {
      const glass = whiteOver(color, alpha);
      expect(contrast(glass, oklch("foreground"))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(glass, oklch("muted-foreground"))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(glass, oklch("primary"))).toBeGreaterThanOrEqual(4.5);
    });
  }
});
