import type { Column, MeetingStatus } from "@looptalk/shared";

export type UserId = number;

/** Liefert eine Zahl in [0, 1), wie `Math.random`. In Tests deterministisch. */
export type Rng = () => number;

export interface Meeting {
  number: number;
  status: MeetingStatus;
  moderatorId: UserId;
  protocolId: UserId | null;
  startedAt: Date | null;
  endedAt: Date | null;
  version: number;
}

export interface CardPosition {
  id: number;
  column: Column;
}

export interface CardMove {
  cardId: number;
  from: Column;
  to: Column;
}

export type DomainErrorCode = "conflict" | "invalid";

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

function assertVersion(meeting: Meeting, expectedVersion: number): void {
  if (meeting.version !== expectedVersion) {
    throw new DomainError("conflict", "Der Termin wurde inzwischen geändert. Bitte neu laden.");
  }
}

/** Erster Termin eines neuen Boards: der Ersteller moderiert, Protokoll offen. */
export function firstMeeting(creatorId: UserId): Meeting {
  return {
    number: 1,
    status: "planned",
    moderatorId: creatorId,
    protocolId: null,
    startedAt: null,
    endedAt: null,
    version: 0,
  };
}

export function startMeeting(meeting: Meeting, expectedVersion: number, now: Date): Meeting {
  assertVersion(meeting, expectedVersion);
  if (meeting.status !== "planned") {
    throw new DomainError("conflict", "Der Termin läuft bereits.");
  }
  return { ...meeting, status: "running", startedAt: now, version: meeting.version + 1 };
}

export interface RolesInput {
  meeting: Meeting;
  pool: UserId[];
  activeIds: UserId[];
}

/**
 * Manuelle Rollenänderung. Der neue Moderator verlässt den Rotationstopf, der
 * ersetzte kommt zurück: Moderiert hat er erst, wenn der Termin beendet ist.
 */
export function setRoles(
  { meeting, pool, activeIds }: RolesInput,
  roles: { moderatorId: UserId; protocolId: UserId | null },
  expectedVersion: number,
): { meeting: Meeting; pool: UserId[] } {
  assertVersion(meeting, expectedVersion);
  if (meeting.status === "ended") {
    throw new DomainError("conflict", "Der Termin ist bereits beendet.");
  }
  const active = new Set(activeIds);
  if (!active.has(roles.moderatorId)) {
    throw new DomainError("invalid", "Moderator muss ein aktiver Teilnehmer sein.");
  }
  if (roles.protocolId !== null && !active.has(roles.protocolId)) {
    throw new DomainError("invalid", "Protokollant muss ein aktiver Teilnehmer sein.");
  }
  if (roles.moderatorId === roles.protocolId) {
    throw new DomainError("invalid", "Moderator und Protokollant dürfen nicht dieselbe Person sein.");
  }

  let nextPool = pool;
  if (roles.moderatorId !== meeting.moderatorId) {
    nextPool = pool.filter((id) => id !== roles.moderatorId);
    if (active.has(meeting.moderatorId) && !nextPool.includes(meeting.moderatorId)) {
      nextPool = [...nextPool, meeting.moderatorId];
    }
  }

  return {
    meeting: {
      ...meeting,
      moderatorId: roles.moderatorId,
      protocolId: roles.protocolId,
      version: meeting.version + 1,
    },
    pool: sorted(nextPool),
  };
}

/** Alle Karten rücken eine Spalte weiter, Spalte 3 wird archiviert. */
export function advanceCards(cards: CardPosition[]): { moves: CardMove[]; archivedCardIds: number[] } {
  const moves: CardMove[] = [];
  const archivedCardIds: number[] = [];
  for (const card of cards) {
    if (card.column === 3) {
      archivedCardIds.push(card.id);
    } else {
      moves.push({ cardId: card.id, from: card.column, to: (card.column + 1) as Column });
    }
  }
  return { moves, archivedCardIds };
}

/**
 * Zieht den nächsten Moderator fair aus dem Topf. Der neue Protokollant ist
 * ausgeschlossen. Ist der Topf leer, wird er mit allen aktiven Teilnehmern außer
 * dem Protokollanten neu gefüllt. Gibt es keinen anderen aktiven Teilnehmer,
 * moderiert der Protokollant weiter und das Protokoll bleibt leer.
 */
export function drawModerator(
  { pool, activeIds, protocolId }: { pool: UserId[]; activeIds: UserId[]; protocolId: UserId },
  rng: Rng,
): { moderatorId: UserId; protocolId: UserId | null; pool: UserId[] } {
  const active = new Set(activeIds);
  let candidates = sorted(pool.filter((id) => active.has(id) && id !== protocolId));
  if (candidates.length === 0) {
    candidates = sorted(activeIds.filter((id) => id !== protocolId));
  }
  if (candidates.length === 0) {
    return { moderatorId: protocolId, protocolId: null, pool: [] };
  }
  const index = Math.min(Math.floor(rng() * candidates.length), candidates.length - 1);
  const moderatorId = candidates[index]!;
  return { moderatorId, protocolId, pool: candidates.filter((id) => id !== moderatorId) };
}

export interface EndMeetingInput {
  meeting: Meeting;
  pool: UserId[];
  activeIds: UserId[];
  cards: CardPosition[];
}

export interface EndMeetingResult {
  ended: Meeting;
  next: Meeting;
  pool: UserId[];
  moves: CardMove[];
  archivedCardIds: number[];
}

export function endMeeting(
  { meeting, pool, activeIds, cards }: EndMeetingInput,
  expectedVersion: number,
  rng: Rng,
  now: Date,
): EndMeetingResult {
  assertVersion(meeting, expectedVersion);
  if (meeting.status !== "running") {
    throw new DomainError("conflict", "Der Termin läuft nicht und kann nicht beendet werden.");
  }

  const draw = drawModerator({ pool, activeIds, protocolId: meeting.moderatorId }, rng);
  const { moves, archivedCardIds } = advanceCards(cards);

  return {
    ended: { ...meeting, status: "ended", endedAt: now, version: meeting.version + 1 },
    next: {
      number: meeting.number + 1,
      status: "planned",
      moderatorId: draw.moderatorId,
      protocolId: draw.protocolId,
      startedAt: null,
      endedAt: null,
      version: 0,
    },
    pool: draw.pool,
    moves,
    archivedCardIds,
  };
}

/** Neuer oder wieder aktiver Teilnehmer kommt in den Topf, außer er moderiert gerade. */
export function addToPool(pool: UserId[], userId: UserId, currentModeratorId: UserId): UserId[] {
  if (userId === currentModeratorId || pool.includes(userId)) return pool;
  return sorted([...pool, userId]);
}

export function removeFromPool(pool: UserId[], userId: UserId): UserId[] {
  return pool.filter((id) => id !== userId);
}

function sorted(ids: UserId[]): UserId[] {
  return [...new Set(ids)].sort((a, b) => a - b);
}
