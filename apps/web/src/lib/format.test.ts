import { describe, expect, it } from "vitest";
import { formatDuration } from "./format";

const start = "2026-10-27T10:00:00Z";
const at = (min: number) => new Date(new Date(start).getTime() + min * 60_000);

describe("formatDuration", () => {
  it("zeigt Minuten unter einer Stunde", () => {
    expect(formatDuration(start, at(0))).toBe("seit 0 min");
    expect(formatDuration(start, at(23.9))).toBe("seit 23 min");
    expect(formatDuration(start, at(59))).toBe("seit 59 min");
  });

  it("zeigt Stunden und Minuten ab einer Stunde", () => {
    expect(formatDuration(start, at(60))).toBe("seit 1 h 00 min");
    expect(formatDuration(start, at(125))).toBe("seit 2 h 05 min");
  });

  it("wird bei Uhrabweichung nicht negativ", () => {
    expect(formatDuration(start, at(-2))).toBe("seit 0 min");
  });
});
