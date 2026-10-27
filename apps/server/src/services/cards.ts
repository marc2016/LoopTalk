import type { AddPersonInput, CreateCardInput, UpdateCardInput } from "@looptalk/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { recordAudit } from "../audit/record";
import type { Tx } from "../db/client";
import { boardMembers, cardPeople, cards } from "../db/schema";
import { AppError, notFound } from "../errors";
import type { BoardRow, ServiceDeps } from "./common";

type CardRow = typeof cards.$inferSelect;

/** Nur Karten, die auf dem Board liegen: nicht gelöscht, nicht archiviert, zum Board gehörig. */
async function lockOpenCard(tx: Tx, boardId: number, cardId: number): Promise<CardRow> {
  const [card] = await tx
    .select()
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.boardId, boardId), isNull(cards.deletedAt), isNull(cards.archivedAt)))
    .for("update");
  if (!card) throw notFound("Thema nicht gefunden.");
  return card;
}

export function cardService({ db, notifier, now }: ServiceDeps) {
  return {
    async create(board: BoardRow, userId: number, input: Required<CreateCardInput>): Promise<{ id: number }> {
      const card = await db.transaction(async (tx) => {
        const [card] = await tx
          .insert(cards)
          .values({ boardId: board.id, title: input.title, description: input.description, createdBy: userId })
          .returning();
        await recordAudit(tx, {
          boardId: board.id,
          actorId: userId,
          action: "card.created",
          targetType: "card",
          targetId: card!.id,
          data: { after: { title: card!.title, description: card!.description } },
        });
        return card!;
      });
      notifier.boardChanged(board.id, "card.created");
      return { id: card.id };
    },

    async update(board: BoardRow, userId: number, cardId: number, input: UpdateCardInput): Promise<void> {
      const changed = await db.transaction(async (tx) => {
        const card = await lockOpenCard(tx, board.id, cardId);
        const before: Record<string, string> = {};
        const after: Record<string, string> = {};
        if (input.title !== undefined && input.title !== card.title) {
          before.title = card.title;
          after.title = input.title;
        }
        if (input.description !== undefined && input.description !== card.description) {
          before.description = card.description;
          after.description = input.description;
        }
        if (Object.keys(after).length === 0) return false;
        await tx.update(cards).set(after).where(eq(cards.id, card.id));
        await recordAudit(tx, {
          boardId: board.id,
          actorId: userId,
          action: "card.updated",
          targetType: "card",
          targetId: card.id,
          data: { title: card.title, before, after },
        });
        return true;
      });
      if (changed) notifier.boardChanged(board.id, "card.updated");
    },

    /** Soft Delete: Die Karte verschwindet überall, ihr letzter Inhalt bleibt im Audit-Log. */
    async remove(board: BoardRow, userId: number, cardId: number): Promise<void> {
      await db.transaction(async (tx) => {
        const card = await lockOpenCard(tx, board.id, cardId);
        const people = await tx
          .select({ name: cardPeople.name })
          .from(cardPeople)
          .where(eq(cardPeople.cardId, card.id))
          .orderBy(asc(cardPeople.id));
        await tx.update(cards).set({ deletedAt: now() }).where(eq(cards.id, card.id));
        await recordAudit(tx, {
          boardId: board.id,
          actorId: userId,
          action: "card.deleted",
          targetType: "card",
          targetId: card.id,
          data: {
            before: {
              title: card.title,
              description: card.description,
              column: card.column,
              people: people.map((p) => p.name),
            },
          },
        });
      });
      notifier.boardChanged(board.id, "card.deleted");
    },

    async addPerson(board: BoardRow, userId: number, cardId: number, input: AddPersonInput): Promise<void> {
      const added = await db.transaction(async (tx) => {
        const card = await lockOpenCard(tx, board.id, cardId);
        if (input.userId !== undefined) {
          const [member] = await tx
            .select({ userId: boardMembers.userId })
            .from(boardMembers)
            .where(and(eq(boardMembers.boardId, board.id), eq(boardMembers.userId, input.userId)));
          if (!member) throw new AppError("bad_request", "Diese Person ist kein Teilnehmer des Boards.");
        }
        const inserted = await tx
          .insert(cardPeople)
          .values({ cardId: card.id, name: input.name, userId: input.userId ?? null, addedBy: userId })
          // Gleicher Name (ohne Groß-/Kleinschreibung) an derselben Karte: nichts tun.
          .onConflictDoNothing()
          .returning();
        if (inserted.length === 0) return false;
        await recordAudit(tx, {
          boardId: board.id,
          actorId: userId,
          action: "card.person_added",
          targetType: "card",
          targetId: card.id,
          data: { title: card.title, after: { name: input.name } },
        });
        return true;
      });
      if (added) notifier.boardChanged(board.id, "card.person_added");
    },

    async removePerson(board: BoardRow, userId: number, cardId: number, personId: number): Promise<void> {
      await db.transaction(async (tx) => {
        const card = await lockOpenCard(tx, board.id, cardId);
        const [person] = await tx
          .delete(cardPeople)
          .where(and(eq(cardPeople.id, personId), eq(cardPeople.cardId, card.id)))
          .returning();
        if (!person) throw notFound("Name nicht gefunden.");
        await recordAudit(tx, {
          boardId: board.id,
          actorId: userId,
          action: "card.person_removed",
          targetType: "card",
          targetId: card.id,
          data: { title: card.title, before: { name: person.name } },
        });
      });
      notifier.boardChanged(board.id, "card.person_removed");
    },
  };
}
