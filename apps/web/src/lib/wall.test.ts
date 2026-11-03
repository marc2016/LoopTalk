import fs from "node:fs";
import path from "node:path";
import { BOARD_WALLS } from "@looptalk/shared";
import { describe, expect, it } from "vitest";
import { wallName, wallNames } from "./wall";

describe("wallNames", () => {
  it("hat für jede Wand einen Namen", () => {
    for (const wall of BOARD_WALLS) expect(wallNames[wall]).toBeTruthy();
    expect(wallName("cork")).toBe("Kork");
    expect(wallName("beton")).toBe("beton");
  });
});

// ---------------------------------------------------------------------------
// Kontrast auf jeder Wand, gelesen aus index.css
// ---------------------------------------------------------------------------

const css = fs.readFileSync(path.join(import.meta.dirname, "../index.css"), "utf8");

type Oklch = [l: number, c: number, h: number];

function oklch(name: string): Oklch {
  const match = css.match(new RegExp(`--${name}:\\s*oklch\\(([\\d.]+) ([\\d.]+) ([\\d.]+)\\)`));
  if (!match) throw new Error(`--${name} fehlt in index.css oder ist kein oklch(L C H)`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
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

describe("Wände", () => {
  for (const wall of BOARD_WALLS) {
    it(`${wall}: Schrift erreicht WCAG AA, Linien 3:1`, () => {
      const bg = oklch(`wall-${wall}-bg`);
      expect(contrast(bg, oklch("foreground"))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(bg, oklch(`wall-${wall}-muted`))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(bg, oklch("last-round-foreground"))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(bg, oklch("primary"))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(bg, oklch(`wall-${wall}-line`))).toBeGreaterThanOrEqual(3);
    });
  }
});
