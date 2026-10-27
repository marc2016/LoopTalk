import type { AuditEntry } from "@looptalk/shared";
import { describe, expect, it } from "vitest";
import { describeAudit } from "./audit";

const entry = (action: AuditEntry["action"], data: Record<string, unknown>): AuditEntry => ({
  id: 1,
  at: "2026-10-27T10:00:00Z",
  actor: { id: 1, name: "Anna" },
  action,
  targetType: "card",
  targetId: 1,
  data,
});

describe("describeAudit", () => {
  it("beschreibt Bearbeitungen mit vorher/nachher", () => {
    const result = describeAudit(
      entry("card.updated", { title: "Release", before: { title: "Release" }, after: { title: "Release-Planung" } }),
    );
    expect(result.text).toBe("hat das Thema „Release“ bearbeitet");
    expect(result.details).toEqual(["Titel: „Release“ → „Release-Planung“"]);
  });

  it("nennt beim Löschen den letzten Inhalt", () => {
    const result = describeAudit(
      entry("card.deleted", { before: { title: "Weg", description: "Text", people: ["Ben", "Carla"] } }),
    );
    expect(result.text).toBe("hat das Thema „Weg“ gelöscht");
    expect(result.details).toEqual(["Beschreibung: Text", "Namen: Ben, Carla"]);
  });

  it("zeigt nur geänderte Rollen", () => {
    const result = describeAudit(
      entry("meeting.roles_changed", {
        number: 3,
        before: { moderator: { id: 1, name: "Anna" }, protocol: null },
        after: { moderator: { id: 2, name: "Ben" }, protocol: null },
      }),
    );
    expect(result.details).toEqual(["Moderation: Anna → Ben"]);
  });

  it("fasst das Beenden eines Termins zusammen", () => {
    const result = describeAudit(
      entry("meeting.ended", {
        number: 1,
        moved: [{ cardId: 1, from: 1, to: 2 }],
        archivedCardIds: [],
        next: { moderator: { id: 2, name: "Ben" }, protocol: { id: 1, name: "Anna" } },
      }),
    );
    expect(result.text).toBe("hat Termin 1 beendet");
    expect(result.details).toEqual(["Nächste Moderation: Ben, Protokoll: Anna", "1 Thema weitergerückt, 0 archiviert"]);
  });
});
