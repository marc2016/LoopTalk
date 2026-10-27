import { describe, expect, it } from "vitest";
import {
  addToPool,
  advanceCards,
  DomainError,
  drawModerator,
  endMeeting,
  firstMeeting,
  type Meeting,
  removeFromPool,
  type Rng,
  setRoles,
  startMeeting,
} from "./meeting";

const now = new Date("2026-10-27T10:00:00Z");
const first: Rng = () => 0;
const last: Rng = () => 0.999;

function running(overrides: Partial<Meeting> = {}): Meeting {
  return { ...firstMeeting(1), status: "running", startedAt: now, version: 1, ...overrides };
}

function expectDomainError(fn: () => unknown, code: DomainError["code"]) {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(DomainError);
    expect((err as DomainError).code).toBe(code);
    return;
  }
  throw new Error("DomainError erwartet");
}

describe("firstMeeting", () => {
  it("Ersteller moderiert, Protokoll ist leer", () => {
    expect(firstMeeting(7)).toMatchObject({ number: 1, status: "planned", moderatorId: 7, protocolId: null });
  });
});

describe("startMeeting", () => {
  it("setzt den Status auf läuft mit Startzeitpunkt und ändert die Rollen nicht", () => {
    const m = startMeeting({ ...firstMeeting(1), protocolId: 2 }, 0, now);
    expect(m).toMatchObject({ status: "running", startedAt: now, moderatorId: 1, protocolId: 2, version: 1 });
  });

  it("lehnt einen doppelten Start ab", () => {
    const m = startMeeting(firstMeeting(1), 0, now);
    expectDomainError(() => startMeeting(m, 0, now), "conflict");
    expectDomainError(() => startMeeting(m, 1, now), "conflict");
  });
});

describe("advanceCards", () => {
  it("A rückt nach 2, B nach 3, C wird archiviert", () => {
    const result = advanceCards([
      { id: 1, column: 1 },
      { id: 2, column: 2 },
      { id: 3, column: 3 },
    ]);
    expect(result.moves).toEqual([
      { cardId: 1, from: 1, to: 2 },
      { cardId: 2, from: 2, to: 3 },
    ]);
    expect(result.archivedCardIds).toEqual([3]);
  });
});

describe("endMeeting", () => {
  it("lehnt das Beenden eines nicht gestarteten Termins ab", () => {
    expectDomainError(
      () => endMeeting({ meeting: firstMeeting(1), pool: [2], activeIds: [1, 2], cards: [] }, 0, first, now),
      "conflict",
    );
  });

  it("lehnt doppeltes Beenden mit derselben Version ab", () => {
    const input = { meeting: running(), pool: [2, 3], activeIds: [1, 2, 3], cards: [] };
    const { ended } = endMeeting(input, 1, first, now);
    expectDomainError(() => endMeeting({ ...input, meeting: ended }, 1, first, now), "conflict");
  });

  it("schiebt Karten weiter, auch die während des Termins angelegten", () => {
    const result = endMeeting(
      {
        meeting: running(),
        pool: [2],
        activeIds: [1, 2],
        cards: [
          { id: 10, column: 1 },
          { id: 11, column: 1 },
          { id: 12, column: 3 },
        ],
      },
      1,
      first,
      now,
    );
    expect(result.moves.map((m) => [m.cardId, m.to])).toEqual([
      [10, 2],
      [11, 2],
    ]);
    expect(result.archivedCardIds).toEqual([12]);
  });

  it("macht den Moderator zum Protokollanten des nächsten Termins", () => {
    const result = endMeeting({ meeting: running(), pool: [2, 3], activeIds: [1, 2, 3], cards: [] }, 1, first, now);
    expect(result.ended).toMatchObject({ status: "ended", endedAt: now });
    expect(result.next).toMatchObject({ number: 2, status: "planned", protocolId: 1, version: 0 });
    expect(result.next.moderatorId).not.toBe(1);
  });

  it("jeder von vier Teilnehmern moderiert genau einmal in vier Terminen", () => {
    for (const rng of [first, last, () => 0.5]) {
      let meeting = running({ moderatorId: 1 });
      let pool = [2, 3, 4];
      const moderated: number[] = [];
      for (let i = 0; i < 4; i++) {
        moderated.push(meeting.moderatorId);
        const result = endMeeting({ meeting, pool, activeIds: [1, 2, 3, 4], cards: [] }, meeting.version, rng, now);
        pool = result.pool;
        meeting = startMeeting(result.next, 0, now);
      }
      expect(moderated.sort()).toEqual([1, 2, 3, 4]);
    }
  });

  it("zieht nie den Protokollanten desselben Termins", () => {
    for (let i = 0; i < 20; i++) {
      const rng: Rng = () => i / 20;
      const result = endMeeting({ meeting: running(), pool: [1, 2, 3], activeIds: [1, 2, 3], cards: [] }, 1, rng, now);
      expect(result.next.moderatorId).not.toBe(result.next.protocolId);
    }
  });

  it("bleibt mit einem Teilnehmer beim selben Moderator, Protokoll leer", () => {
    const result = endMeeting({ meeting: running(), pool: [], activeIds: [1], cards: [] }, 1, first, now);
    expect(result.next).toMatchObject({ moderatorId: 1, protocolId: null });
  });
});

describe("drawModerator", () => {
  it("füllt den leeren Topf mit allen aktiven außer dem neuen Protokollanten", () => {
    const result = drawModerator({ pool: [], activeIds: [1, 2, 3, 4], protocolId: 4 }, first);
    expect(result.moderatorId).toBe(1);
    expect(result.pool).toEqual([2, 3]);
  });

  it("zieht keine inaktiven Teilnehmer", () => {
    const result = drawModerator({ pool: [2, 3], activeIds: [1, 3], protocolId: 1 }, first);
    expect(result.moderatorId).toBe(3);
  });

  it("nutzt den Zufall für die Auswahl", () => {
    const input = { pool: [2, 3, 4], activeIds: [1, 2, 3, 4], protocolId: 1 };
    expect(drawModerator(input, first).moderatorId).toBe(2);
    expect(drawModerator(input, last).moderatorId).toBe(4);
  });
});

describe("setRoles", () => {
  const base = { meeting: running({ moderatorId: 1, protocolId: 2 }), pool: [3, 4], activeIds: [1, 2, 3, 4] };

  it("Moderator fehlt: Ersatz verlässt den Topf, der Ersetzte kommt zurück", () => {
    const result = setRoles(base, { moderatorId: 3, protocolId: 2 }, 1);
    expect(result.meeting).toMatchObject({ moderatorId: 3, protocolId: 2, version: 2 });
    expect(result.pool).toEqual([1, 4]);
  });

  it("Protokollant ändern lässt den Topf unverändert", () => {
    const result = setRoles(base, { moderatorId: 1, protocolId: 4 }, 1);
    expect(result.meeting.protocolId).toBe(4);
    expect(result.pool).toEqual([3, 4]);
  });

  it("manueller Moderator wird beim Beenden Protokollant", () => {
    const { meeting, pool } = setRoles(base, { moderatorId: 3, protocolId: 2 }, 1);
    const result = endMeeting({ meeting, pool, activeIds: base.activeIds, cards: [] }, meeting.version, first, now);
    expect(result.next.protocolId).toBe(3);
  });

  it("funktioniert auch bei geplantem Termin", () => {
    const result = setRoles({ ...base, meeting: { ...firstMeeting(1), protocolId: null } }, { moderatorId: 2, protocolId: 1 }, 0);
    expect(result.meeting).toMatchObject({ status: "planned", moderatorId: 2, protocolId: 1 });
  });

  it("lehnt dieselbe Person für beide Rollen ab", () => {
    expectDomainError(() => setRoles(base, { moderatorId: 1, protocolId: 1 }, 1), "invalid");
  });

  it("lehnt inaktive Teilnehmer ab", () => {
    expectDomainError(() => setRoles(base, { moderatorId: 9, protocolId: null }, 1), "invalid");
    expectDomainError(() => setRoles(base, { moderatorId: 1, protocolId: 9 }, 1), "invalid");
  });

  it("lehnt eine veraltete Version ab", () => {
    expectDomainError(() => setRoles(base, { moderatorId: 3, protocolId: 2 }, 0), "conflict");
  });
});

describe("Topf-Helfer", () => {
  it("neuer Teilnehmer kommt in den Topf, der aktuelle Moderator nicht", () => {
    expect(addToPool([2], 3, 1)).toEqual([2, 3]);
    expect(addToPool([2], 1, 1)).toEqual([2]);
    expect(addToPool([2], 2, 1)).toEqual([2]);
  });

  it("inaktiver Teilnehmer wird entfernt", () => {
    expect(removeFromPool([2, 3], 2)).toEqual([3]);
  });
});
