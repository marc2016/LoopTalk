import { describe, expect, it } from "vitest";
import { DEFAULT_FALL, fallTarget } from "./fall-target";

const viewport = { width: 1200, height: 800 };
const note = { left: 100, top: 100, width: 100, height: 100 };

describe("fallTarget", () => {
  it("zielt auf die Mitte der Ablage", () => {
    expect(fallTarget(note, { left: 400, top: 600, width: 200, height: 60 }, viewport)).toEqual({ dx: 350, dy: 480 });
  });

  it("fällt ohne Ablage wie bisher", () => {
    expect(fallTarget(note, null, viewport)).toEqual(DEFAULT_FALL);
    expect(fallTarget(note, { left: 0, top: 0, width: 0, height: 0 }, viewport)).toEqual(DEFAULT_FALL);
  });

  it("fällt wie bisher, wenn die Ablage außerhalb des sichtbaren Bereichs liegt", () => {
    expect(fallTarget(note, { left: 400, top: 900, width: 200, height: 60 }, viewport)).toEqual(DEFAULT_FALL);
  });
});
