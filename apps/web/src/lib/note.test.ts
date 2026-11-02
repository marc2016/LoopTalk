import fs from "node:fs";
import path from "node:path";
import { CARD_COLORS } from "@looptalk/shared";
import { describe, expect, it } from "vitest";
import { MAX_TILT, noteAge, noteTilt } from "./note";

describe("noteTilt", () => {
  it("ist für dieselbe Karte immer gleich", () => {
    expect(noteTilt(42)).toBe(noteTilt(42));
  });

  it("bleibt im Bereich von ±1,5 Grad", () => {
    for (let id = 1; id <= 500; id++) {
      expect(Math.abs(noteTilt(id))).toBeLessThanOrEqual(MAX_TILT);
    }
  });

  it("dreht benachbarte Karten unterschiedlich", () => {
    const tilts = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(noteTilt));
    expect(tilts.size).toBeGreaterThan(5);
  });
});

describe("noteAge", () => {
  it("entspricht den verbleibenden Terminen", () => {
    expect([noteAge(1), noteAge(2), noteAge(3)]).toEqual([3, 2, 1]);
  });
});

// ---------------------------------------------------------------------------
// Kontrast der Zettelfarben, gelesen aus index.css
// ---------------------------------------------------------------------------

const css = fs.readFileSync(path.join(import.meta.dirname, "../index.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Token --${name} fehlt in index.css`);
  return match[1]!.trim();
}

type Oklch = [l: number, c: number, h: number];

function oklch(name: string): Oklch {
  const match = token(name).match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/);
  if (!match) throw new Error(`--${name} ist kein oklch(L C H)`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Wie `color-mix(in oklch, color p%, white)`: Weiß hat keinen Farbton, also bleibt der der Farbe. */
function mixWithWhite([l, c, h]: Oklch, share: number): Oklch {
  return [l * share + (1 - share), c * share, h];
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

describe("Zettelfarben", () => {
  const ages = [3, 2, 1].map((age) => Number.parseFloat(token(`note-age-${age}`)) / 100);

  for (const color of CARD_COLORS) {
    it(`${color}: Schrift erreicht in jedem Alter WCAG AA`, () => {
      for (const share of ages) {
        const paper = mixWithWhite(oklch(`note-${color}`), share);
        expect(contrast(paper, oklch("note-foreground"))).toBeGreaterThanOrEqual(4.5);
        expect(contrast(paper, oklch("note-muted"))).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  it("Altern macht das Papier blasser", () => {
    expect(ages).toEqual([...ages].sort((a, b) => b - a));
    expect(ages[2]).toBeLessThan(ages[0]!);
  });
});
