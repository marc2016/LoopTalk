import type { MeetingHistoryEntry, SetRolesInput, UserRef } from "@looptalk/shared";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { recordAudit } from "../audit/record";
import { cardPeople, cards, meetingCards, meetings } from "../db/schema";
import { DomainError, endMeeting, setRoles, startMeeting } from "../domain/meeting";
import { AppError } from "../errors";
import {
  activeMemberIds,
  type BoardRow,
  loadPool,
  lockCurrentMeeting,
  ref,
  refOrNull,
  replacePool,
  type ServiceDeps,
  toDomainMeeting,
  userRefs,
} from "./common";

function mapDomainError<T>(fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    if (err instanceof DomainError) {
      throw new AppError(err.code === "conflict" ? "conflict" : "bad_request", err.message);
    }
    throw err;
  }
}

export function meetingService({ db, notifier, rng, now }: ServiceDeps) {
  return {
    async start(board: BoardRow, userId: number, version: number): Promise<void> {
      await db.transaction(async (tx) => {
        const row = await lockCurrentMeeting(tx, board.id);
        const started = mapDomainError(() => startMeeting(toDomainMeeting(row), version, now()));
        await tx
          .update(meetings)
          .set({ status: started.status, startedAt: started.startedAt, startedBy: userId, version: started.version })
          .where(eq(meetings.id, row.id));
        await recordAudit(tx, {
          boardId: board.id,
          actorId: userId,
          action: "meeting.started",
          targetType: "meeting",
          targetId: row.id,
          data: { number: row.number },
        });
      });
      notifier.boardChanged(board.id, "meeting.started");
    },

    async setRoles(board: BoardRow, userId: number, input: SetRolesInput): Promise<void> {
      await db.transaction(async (tx) => {
        const row = await lockCurrentMeeting(tx, board.id);
        const pool = await loadPool(tx, board.id);
        const activeIds = await activeMemberIds(tx, board.id);
        const result = mapDomainError(() =>
          setRoles(
            { meeting: toDomainMeeting(row), pool, activeIds },
            { moderatorId: input.moderatorId, protocolId: input.protocolId },
            input.version,
          ),
        );
        await tx
          .update(meetings)
          .set({
            moderatorId: result.meeting.moderatorId,
            protocolId: result.meeting.protocolId,
            version: result.meeting.version,
          })
          .where(eq(meetings.id, row.id));
        await replacePool(tx, board.id, result.pool);
        const refs = await userRefs(tx, [row.moderatorId, row.protocolId, input.moderatorId, input.protocolId]);
        await recordAudit(tx, {
          boardId: board.id,
          actorId: userId,
          action: "meeting.roles_changed",
          targetType: "meeting",
          targetId: row.id,
          data: {
            number: row.number,
            before: { moderator: ref(refs, row.moderatorId), protocol: refOrNull(refs, row.protocolId) },
            after: { moderator: ref(refs, input.moderatorId), protocol: refOrNull(refs, input.protocolId) },
          },
        });
      });
      notifier.boardChanged(board.id, "meeting.roles_changed");
    },

    /** Beendet den Termin: Stand festhalten, Moderator ziehen, Rollen tauschen, Karten weiterschieben. */
    async end(
      board: BoardRow,
      userId: number,
      version: number,
    ): Promise<{ moderator: UserRef; protocol: UserRef | null }> {
      const next = await db.transaction(async (tx) => {
        const row = await lockCurrentMeeting(tx, board.id);
        const pool = await loadPool(tx, board.id);
        const activeIds = await activeMemberIds(tx, board.id);
        const openCards = await tx
          .select()
          .from(cards)
          .where(and(eq(cards.boardId, board.id), isNull(cards.deletedAt), isNull(cards.archivedAt)))
          .orderBy(asc(cards.id));

        const result = mapDomainError(() =>
          endMeeting(
            {
              meeting: toDomainMeeting(row),
              pool,
              activeIds,
              cards: openCards.map((c) => ({ id: c.id, column: c.column as 1 | 2 | 3 })),
            },
            version,
            rng,
            now(),
          ),
        );

        // 1. Stand der Karten für die Historie festhalten
        if (openCards.length > 0) {
          const people = await tx
            .select({ cardId: cardPeople.cardId, name: cardPeople.name })
            .from(cardPeople)
            .where(
              inArray(
                cardPeople.cardId,
                openCards.map((c) => c.id),
              ),
            )
            .orderBy(asc(cardPeople.id));
          await tx.insert(meetingCards).values(
            openCards.map((c) => ({
              meetingId: row.id,
              cardId: c.id,
              title: c.title,
              description: c.description,
              columnAtMeeting: c.column,
              people: people.filter((p) => p.cardId === c.id).map((p) => p.name),
            })),
          );
        }

        // 2. Termin beenden
        await tx
          .update(meetings)
          .set({ status: "ended", endedAt: result.ended.endedAt, endedBy: userId, version: result.ended.version })
          .where(eq(meetings.id, row.id));

        // 3. Karten weiterschieben und archivieren
        if (result.archivedCardIds.length > 0) {
          await tx.update(cards).set({ archivedAt: result.ended.endedAt }).where(inArray(cards.id, result.archivedCardIds));
        }
        for (const to of [2, 3] as const) {
          const ids = result.moves.filter((m) => m.to === to).map((m) => m.cardId);
          if (ids.length > 0) await tx.update(cards).set({ column: to }).where(inArray(cards.id, ids));
        }

        // 4. Rotationstopf und nächster Termin
        await replacePool(tx, board.id, result.pool);
        await tx.insert(meetings).values({
          boardId: board.id,
          number: result.next.number,
          moderatorId: result.next.moderatorId,
          protocolId: result.next.protocolId,
        });

        const refs = await userRefs(tx, [result.next.moderatorId, result.next.protocolId]);
        const nextRoles = {
          moderator: ref(refs, result.next.moderatorId),
          protocol: refOrNull(refs, result.next.protocolId),
        };
        await recordAudit(tx, {
          boardId: board.id,
          actorId: userId,
          action: "meeting.ended",
          targetType: "meeting",
          targetId: row.id,
          data: {
            number: row.number,
            moved: result.moves,
            archivedCardIds: result.archivedCardIds,
            next: nextRoles,
          },
        });
        return nextRoles;
      });
      notifier.boardChanged(board.id, "meeting.ended");
      return next;
    },

    async history(board: BoardRow): Promise<MeetingHistoryEntry[]> {
      const rows = await db
        .select()
        .from(meetings)
        .where(and(eq(meetings.boardId, board.id), eq(meetings.status, "ended")))
        .orderBy(desc(meetings.endedAt), desc(meetings.id));
      if (rows.length === 0) return [];

      const snapshots = await db
        .select()
        .from(meetingCards)
        .where(
          inArray(
            meetingCards.meetingId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(asc(meetingCards.columnAtMeeting), asc(meetingCards.cardId));
      const refs = await userRefs(
        db,
        rows.flatMap((r) => [r.moderatorId, r.protocolId]),
      );

      return rows.map((r) => ({
        id: r.id,
        number: r.number,
        startedAt: r.startedAt!.toISOString(),
        endedAt: r.endedAt!.toISOString(),
        moderator: ref(refs, r.moderatorId),
        protocol: refOrNull(refs, r.protocolId),
        cards: snapshots
          .filter((s) => s.meetingId === r.id)
          .map((s) => ({
            cardId: s.cardId,
            title: s.title,
            description: s.description,
            column: s.columnAtMeeting as 1 | 2 | 3,
            people: s.people,
          })),
      }));
    },
  };
}
