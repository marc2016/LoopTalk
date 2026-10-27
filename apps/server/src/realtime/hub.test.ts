import { EventEmitter } from "node:events";
import type { Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RealtimeHub } from "./hub";

class FakeResponse extends EventEmitter {
  chunks: string[] = [];
  ended = false;
  writeHead() {
    return this;
  }
  write(chunk: string) {
    this.chunks.push(chunk);
    return true;
  }
  end() {
    this.ended = true;
    this.emit("close");
  }
  /** Alle Events eines Typs, als geparste Daten. */
  events(name: string): unknown[] {
    return this.chunks
      .filter((c) => c.startsWith(`event: ${name}\n`))
      .map((c) => JSON.parse(c.split("data: ")[1]!));
  }
  lastPresence(): string[] {
    const all = this.events("presence") as { users: { name: string }[] }[];
    return all.at(-1)!.users.map((u) => u.name);
  }
}

const anna = { id: 1, name: "Anna" };
const ben = { id: 2, name: "Ben" };
const valid = () => Promise.resolve(true);

let hub: RealtimeHub;
beforeEach(() => {
  vi.useFakeTimers();
  hub = new RealtimeHub({ heartbeatMs: 15_000, leaveGraceMs: 10_000 });
});
afterEach(() => {
  hub.close();
  vi.useRealTimers();
});

function connect(boardId: number, user: typeof anna, isSessionValid = valid) {
  const res = new FakeResponse();
  hub.connect(boardId, { res: res as unknown as Response, user, isSessionValid });
  return res;
}

describe("RealtimeHub", () => {
  it("zeigt, wer gerade auf dem Board ist", () => {
    const a = connect(1, anna);
    expect(a.lastPresence()).toEqual(["Anna"]);
    const b = connect(1, ben);
    expect(a.lastPresence()).toEqual(["Anna", "Ben"]);
    expect(b.lastPresence()).toEqual(["Anna", "Ben"]);
  });

  it("zählt mehrere Tabs eines Benutzers nur einmal", () => {
    const a = connect(1, anna);
    connect(1, ben);
    connect(1, ben);
    expect(a.lastPresence()).toEqual(["Anna", "Ben"]);
    expect(hub.presenceOf(1)).toHaveLength(2);
  });

  it("entfernt einen Benutzer erst nach der Karenzzeit und erst mit dem letzten Tab", () => {
    const a = connect(1, anna);
    const b1 = connect(1, ben);
    const b2 = connect(1, ben);
    b1.end();
    vi.advanceTimersByTime(20_000);
    expect(hub.presenceOf(1).map((u) => u.name)).toEqual(["Anna", "Ben"]);

    b2.end();
    vi.advanceTimersByTime(9_000);
    expect(a.lastPresence()).toEqual(["Anna", "Ben"]);
    vi.advanceTimersByTime(1_000);
    expect(a.lastPresence()).toEqual(["Anna"]);
  });

  it("ein Reload innerhalb der Karenzzeit lässt die Anzeige stabil", () => {
    const a = connect(1, anna);
    connect(1, ben).end();
    const before = a.events("presence").length;
    connect(1, ben);
    vi.advanceTimersByTime(30_000);
    expect(a.events("presence").length).toBe(before);
    expect(hub.presenceOf(1).map((u) => u.name)).toEqual(["Anna", "Ben"]);
  });

  it("verteilt Events und Anwesenheit nur innerhalb eines Boards", () => {
    const a = connect(1, anna);
    const b = connect(2, ben);
    hub.boardChanged(1, "card.created");
    expect(a.events("board")).toEqual([{ reason: "card.created" }]);
    expect(b.events("board")).toEqual([]);
    expect(a.lastPresence()).toEqual(["Anna"]);
    expect(b.lastPresence()).toEqual(["Ben"]);
  });

  it("beendet die Verbindung, wenn die Session abgelaufen ist", async () => {
    let sessionValid = true;
    const a = connect(1, anna, () => Promise.resolve(sessionValid));
    await vi.advanceTimersByTimeAsync(15_000);
    expect(a.ended).toBe(false);
    expect(a.chunks.at(-1)).toBe(": ping\n\n");

    sessionValid = false;
    await vi.advanceTimersByTimeAsync(15_000);
    expect(a.events("unauthorized")).toHaveLength(1);
    expect(a.ended).toBe(true);
  });
});
