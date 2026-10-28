import { describe, expect, it } from "vitest";
import { lifecycle } from "./lifecycle";

describe("lifecycle", () => {
  it("Termin 5: bis Termin 7, bis Termin 6, nur noch Termin 5", () => {
    expect([1, 2, 3].map((c) => lifecycle(c as 1 | 2 | 3, 5).until)).toEqual([
      "bis Termin 7",
      "bis Termin 6",
      "nur noch Termin 5",
    ]);
  });

  it("Termin 1", () => {
    expect(lifecycle(1, 1)).toMatchObject({ title: "Neu", remaining: 3, lastMeeting: 3 });
    expect(lifecycle(3, 1)).toMatchObject({ title: "Letzte Runde", remaining: 1, lastMeeting: 1 });
  });

  it("Lebensanzeige auf Karten", () => {
    expect([1, 2, 3].map((c) => lifecycle(c as 1 | 2 | 3, 5).cardLabel)).toEqual([
      "noch 3 Termine",
      "noch 2 Termine",
      "letzte Chance",
    ]);
  });
});
