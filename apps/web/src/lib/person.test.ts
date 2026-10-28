import { describe, expect, it } from "vitest";
import { personColor } from "./person";

describe("personColor", () => {
  it("ist für dieselbe ID immer gleich", () => {
    expect(personColor(7)).toEqual(personColor(7));
  });

  it("gibt den ersten acht IDs verschiedene Farben", () => {
    const colors = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((id) => personColor(id).bg));
    expect(colors.size).toBe(8);
  });

  it("bleibt im Wertebereich der Palette", () => {
    for (const id of [0, 9, 123456789]) expect(personColor(id).bg).toMatch(/^var\(--person-[0-7]-bg\)$/);
  });
});
