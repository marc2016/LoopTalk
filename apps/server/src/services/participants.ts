import type { Participant } from "@looptalk/shared";
import { and, eq } from "drizzle-orm";
import { recordAudit } from "../audit/record";
import { boardMembers } from "../db/schema";
import { addToPool, removeFromPool } from "../domain/meeting";
import { notFound } from "../errors";
import { loadParticipants } from "./boards";
import { type BoardRow, loadPool, lockCurrentMeeting, replacePool, type ServiceDeps, userRefs } from "./common";

export function participantService({ db, notifier }: ServiceDeps) {
  return {
    list: (board: BoardRow): Promise<Participant[]> => loadParticipants(db, board.id),

    /** Inaktive Teilnehmer verlassen den Rotationstopf, wieder aktive kommen zurück. */
    async setActive(board: BoardRow, actorId: number, userId: number, active: boolean): Promise<void> {
      const changed = await db.transaction(async (tx) => {
        const meeting = await lockCurrentMeeting(tx, board.id);
        const [member] = await tx
          .select()
          .from(boardMembers)
          .where(and(eq(boardMembers.boardId, board.id), eq(boardMembers.userId, userId)))
          .for("update");
        if (!member) throw notFound("Teilnehmer nicht gefunden.");
        if (member.active === active) return false;

        await tx
          .update(boardMembers)
          .set({ active })
          .where(and(eq(boardMembers.boardId, board.id), eq(boardMembers.userId, userId)));
        const pool = await loadPool(tx, board.id);
        await replacePool(
          tx,
          board.id,
          active ? addToPool(pool, userId, meeting.moderatorId) : removeFromPool(pool, userId),
        );
        const refs = await userRefs(tx, [userId]);
        await recordAudit(tx, {
          boardId: board.id,
          actorId,
          action: active ? "member.activated" : "member.deactivated",
          targetType: "member",
          targetId: userId,
          data: { user: refs.get(userId) },
        });
        return true;
      });
      if (changed) notifier.boardChanged(board.id, active ? "member.activated" : "member.deactivated");
    },
  };
}
