import type { AuditAction, AuditEntry, UserRef } from "@looptalk/shared";

export const actionLabels: Record<AuditAction, string> = {
  "board.created": "Board erstellt",
  "board.renamed": "Board umbenannt",
  "member.joined": "Beigetreten",
  "member.activated": "Teilnehmer aktiviert",
  "member.deactivated": "Teilnehmer deaktiviert",
  "card.created": "Thema angelegt",
  "card.updated": "Thema bearbeitet",
  "card.deleted": "Thema gelöscht",
  "card.person_added": "Name hinzugefügt",
  "card.person_removed": "Name entfernt",
  "meeting.started": "Termin gestartet",
  "meeting.roles_changed": "Rollen geändert",
  "meeting.ended": "Termin beendet",
};

type Data = Record<string, unknown>;
const obj = (v: unknown): Data => (v && typeof v === "object" ? (v as Data) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const person = (v: unknown): string => (v && typeof v === "object" ? (v as UserRef).name : "niemand");
const quote = (s: string) => `„${s}“`;
const topics = (n: number) => (n === 1 ? "1 Thema" : `${n} Themen`);
const shorten = (s: string, n = 80) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** Satz und optionale Details für einen Audit-Eintrag, z. B. für Tabelle und Kartenverlauf. */
export function describeAudit(entry: AuditEntry): { text: string; details: string[] } {
  const d = entry.data;
  const before = obj(d.before);
  const after = obj(d.after);
  const title = str(d.title) || str(after.title) || str(before.title);
  const details: string[] = [];

  switch (entry.action) {
    case "board.created":
      return { text: `hat das Board ${quote(str(after.name))} erstellt`, details };
    case "board.renamed":
      return { text: `hat das Board von ${quote(str(before.name))} in ${quote(str(after.name))} umbenannt`, details };
    case "member.joined":
      return { text: "ist dem Board beigetreten", details };
    case "member.activated":
      return { text: `hat ${person(d.user)} aktiviert`, details };
    case "member.deactivated":
      return { text: `hat ${person(d.user)} deaktiviert`, details };
    case "card.created":
      if (str(after.description)) details.push(`Beschreibung: ${shorten(str(after.description))}`);
      return { text: `hat das Thema ${quote(title)} angelegt`, details };
    case "card.updated":
      if ("title" in after) details.push(`Titel: ${quote(str(before.title))} → ${quote(str(after.title))}`);
      if ("description" in after) {
        details.push(`Beschreibung vorher: ${shorten(str(before.description)) || "(leer)"}`);
        details.push(`Beschreibung nachher: ${shorten(str(after.description)) || "(leer)"}`);
      }
      return { text: `hat das Thema ${quote(str(d.title))} bearbeitet`, details };
    case "card.deleted": {
      if (str(before.description)) details.push(`Beschreibung: ${shorten(str(before.description))}`);
      const people = Array.isArray(before.people) ? (before.people as string[]) : [];
      if (people.length > 0) details.push(`Namen: ${people.join(", ")}`);
      return { text: `hat das Thema ${quote(title)} gelöscht`, details };
    }
    case "card.person_added":
      return { text: `hat ${quote(str(after.name))} zum Thema ${quote(title)} hinzugefügt`, details };
    case "card.person_removed":
      return { text: `hat ${quote(str(before.name))} vom Thema ${quote(title)} entfernt`, details };
    case "meeting.started":
      return { text: `hat Termin ${String(d.number)} gestartet`, details };
    case "meeting.roles_changed":
      if (person(before.moderator) !== person(after.moderator)) {
        details.push(`Moderation: ${person(before.moderator)} → ${person(after.moderator)}`);
      }
      if (person(before.protocol) !== person(after.protocol)) {
        details.push(`Protokoll: ${person(before.protocol)} → ${person(after.protocol)}`);
      }
      return { text: `hat die Rollen für Termin ${String(d.number)} geändert`, details };
    case "meeting.ended": {
      const next = obj(d.next);
      const moved = Array.isArray(d.moved) ? d.moved.length : 0;
      const archived = Array.isArray(d.archivedCardIds) ? d.archivedCardIds.length : 0;
      details.push(`Nächste Moderation: ${person(next.moderator)}, Protokoll: ${person(next.protocol)}`);
      details.push(`${topics(moved)} weitergerückt, ${archived} archiviert`);
      return { text: `hat Termin ${String(d.number)} beendet`, details };
    }
  }
}
