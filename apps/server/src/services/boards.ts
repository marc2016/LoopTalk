import {
  type BoardSummary,
  type BoardView,
  type CardView,
  MIN_ACTIVE_PARTICIPANTS,
  type Participant,
} from "@looptalk/shared";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { recordAudit } from "../audit/record";
import type { Executor } from "../db/client";
import { boardMembers, boards, cardPeople, cards, meetings, rotationPool, users } from "../db/schema";
import { createBoardSlug } from "../db/slug";
import { addToPool, firstMeeting } from "../domain/meeting";
import {
  type BoardRow,
  currentMeeting,
  findBoard,
  loadPool,
  lockCurrentMeeting,
  ref,
  refOrNull,
  replacePool,
  type ServiceDeps,
  userRefs,
} from "./common";

export function boardService({ db, notifier }: ServiceDeps) {
  return {
    async create(userId: number, name: string): Promise<BoardSummary> {
      const board = await db.transaction(async (tx) => {
        const [board] = await tx.insert(boards).values({ slug: createBoardSlug(), name, createdBy: userId }).returning();
        await tx.insert(boardMembers).values({ boardId: board!.id, userId });
        await tx.insert(meetings).values({ boardId: board!.id, ...firstMeeting(userId) });
        await recordAudit(tx, {
          boardId: board!.id,
          actorId: userId,
          action: "board.created",
          targetType: "board",
          targetId: board!.id,
          data: { after: { name } },
        });
        return board!;
      });
      return summary(board);
    },

    async listMine(userId: number): Promise<BoardSummary[]> {
      const rows = await db
        .select({ board: boards })
        .from(boardMembers)
        .innerJoin(boards, eq(boards.id, boardMembers.boardId))
        .where(eq(boardMembers.userId, userId))
        .orderBy(asc(boards.name), asc(boards.id));
      return rows.map((r) => summary(r.board));
    },

    /**
     * Löst ein Board über seinen Link auf. Wer es zum ersten Mal öffnet, wird
     * aktiver Teilnehmer und kommt in den Rotationstopf.
     */
    async open(slug: string, userId: number): Promise<BoardRow> {
      const board = await findBoard(db, slug);
      const [existing] = await db
        .select({ userId: boardMembers.userId })
        .from(boardMembers)
        .where(and(eq(boardMembers.boardId, board.id), eq(boardMembers.userId, userId)));
      if (existing) return board;

      const joined = await db.transaction(async (tx) => {
        const meeting = await lockCurrentMeeting(tx, board.id);
        const inserted = await tx.insert(boardMembers).values({ boardId: board.id, userId }).onConflictDoNothing().returning();
        if (inserted.length === 0) return false;
        const pool = await loadPool(tx, board.id);
        await replacePool(tx, board.id, addToPool(pool, userId, meeting.moderatorId));
        await recordAudit(tx, {
          boardId: board.id,
          actorId: userId,
          action: "member.joined",
          targetType: "member",
          targetId: userId,
        });
        return true;
      });
      if (joined) notifier.boardChanged(board.id, "member.joined");
      return board;
    },

    async rename(board: BoardRow, userId: number, name: string): Promise<BoardSummary> {
      if (board.name === name) return summary(board);
      const updated = await db.transaction(async (tx) => {
        const [updated] = await tx.update(boards).set({ name }).where(eq(boards.id, board.id)).returning();
        await recordAudit(tx, {
          boardId: board.id,
          actorId: userId,
          action: "board.renamed",
          targetType: "board",
          targetId: board.id,
          data: { before: { name: board.name }, after: { name } },
        });
        return updated!;
      });
      notifier.boardChanged(board.id, "board.renamed");
      return summary(updated);
    },

    view: (board: BoardRow) => loadBoardView(db, board),
  };
}

function summary(board: BoardRow): BoardSummary {
  return { slug: board.slug, name: board.name, createdAt: board.createdAt.toISOString() };
}

export async function loadParticipants(exec: Executor, boardId: number): Promise<Participant[]> {
  const rows = await exec
    .select({ id: users.id, name: users.name, active: boardMembers.active, joinedAt: boardMembers.joinedAt })
    .from(boardMembers)
    .innerJoin(users, eq(users.id, boardMembers.userId))
    .where(eq(boardMembers.boardId, boardId))
    .orderBy(asc(users.name), asc(users.id));
  return rows.map((r) => ({ ...r, joinedAt: r.joinedAt.toISOString() }));
}

export async function loadBoardView(exec: Executor, board: BoardRow): Promise<BoardView> {
  const meeting = await currentMeeting(exec, board.id);
  const cardRows = await exec
    .select({ card: cards, creator: { id: users.id, name: users.name } })
    .from(cards)
    .innerJoin(users, eq(users.id, cards.createdBy))
    .where(and(eq(cards.boardId, board.id), isNull(cards.deletedAt), isNull(cards.archivedAt)))
    .orderBy(asc(cards.createdAt), asc(cards.id));

  const cardIds = cardRows.map((r) => r.card.id);
  const peopleRows =
    cardIds.length === 0
      ? []
      : await exec
          .select()
          .from(cardPeople)
          .where(inArray(cardPeople.cardId, cardIds))
          .orderBy(asc(cardPeople.addedAt), asc(cardPeople.id));

  const views: CardView[] = cardRows.map(({ card, creator }) => ({
    id: card.id,
    title: card.title,
    description: card.description,
    column: card.column as CardView["column"],
    createdBy: creator,
    createdAt: card.createdAt.toISOString(),
    people: peopleRows
      .filter((p) => p.cardId === card.id)
      .map((p) => ({ id: p.id, name: p.name, userId: p.userId })),
  }));

  const participants = await loadParticipants(exec, board.id);
  const refs = await userRefs(exec, [meeting.moderatorId, meeting.protocolId]);

  return {
    slug: board.slug,
    name: board.name,
    meeting: {
      number: meeting.number,
      status: meeting.status === "running" ? "running" : "planned",
      startedAt: meeting.startedAt?.toISOString() ?? null,
      moderator: ref(refs, meeting.moderatorId),
      protocol: refOrNull(refs, meeting.protocolId),
      version: meeting.version,
    },
    cards: views,
    participants,
    tooFewParticipants: participants.filter((p) => p.active).length < MIN_ACTIVE_PARTICIPANTS,
  };
}

/** Für Tests und Diagnose: der aktuelle Rotationstopf eines Boards. */
export async function poolOf(exec: Executor, boardId: number): Promise<number[]> {
  const rows = await exec
    .select({ userId: rotationPool.userId })
    .from(rotationPool)
    .where(eq(rotationPool.boardId, boardId))
    .orderBy(asc(rotationPool.userId));
  return rows.map((r) => r.userId);
}
