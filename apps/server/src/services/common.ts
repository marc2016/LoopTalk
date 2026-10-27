import type { AuditAction, UserRef } from "@looptalk/shared";
import { and, eq, inArray, ne } from "drizzle-orm";
import type { Db, Executor, Tx } from "../db/client";
import { boardMembers, boards, meetings, rotationPool, users } from "../db/schema";
import type { Meeting, Rng } from "../domain/meeting";
import { notFound } from "../errors";

/** Wird nach jedem Commit aufgerufen, damit Live-Clients neu laden. */
export interface BoardNotifier {
  boardChanged(boardId: number, reason: AuditAction): void;
}

export interface ServiceDeps {
  db: Db;
  notifier: BoardNotifier;
  rng: Rng;
  now: () => Date;
}

export type BoardRow = typeof boards.$inferSelect;
export type MeetingRow = typeof meetings.$inferSelect;

export async function findBoard(exec: Executor, slug: string): Promise<BoardRow> {
  const [board] = await exec.select().from(boards).where(eq(boards.slug, slug));
  if (!board) throw notFound("Board nicht gefunden.");
  return board;
}

/**
 * Sperrt den aktuellen Termin eines Boards. Alle Änderungen an Rollen,
 * Rotationstopf oder Teilnehmern laufen über diese Sperre und damit pro Board
 * nacheinander.
 */
export async function lockCurrentMeeting(tx: Tx, boardId: number): Promise<MeetingRow> {
  const [meeting] = await tx
    .select()
    .from(meetings)
    .where(and(eq(meetings.boardId, boardId), ne(meetings.status, "ended")))
    .for("update");
  if (!meeting) throw new Error(`Board ${boardId} hat keinen aktuellen Termin.`);
  return meeting;
}

export async function currentMeeting(exec: Executor, boardId: number): Promise<MeetingRow> {
  const [meeting] = await exec
    .select()
    .from(meetings)
    .where(and(eq(meetings.boardId, boardId), ne(meetings.status, "ended")));
  if (!meeting) throw new Error(`Board ${boardId} hat keinen aktuellen Termin.`);
  return meeting;
}

export function toDomainMeeting(row: MeetingRow): Meeting {
  return {
    number: row.number,
    status: row.status,
    moderatorId: row.moderatorId,
    protocolId: row.protocolId,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    version: row.version,
  };
}

export async function loadPool(tx: Tx, boardId: number): Promise<number[]> {
  const rows = await tx.select({ userId: rotationPool.userId }).from(rotationPool).where(eq(rotationPool.boardId, boardId));
  return rows.map((r) => r.userId);
}

export async function replacePool(tx: Tx, boardId: number, userIds: number[]): Promise<void> {
  await tx.delete(rotationPool).where(eq(rotationPool.boardId, boardId));
  if (userIds.length > 0) {
    await tx.insert(rotationPool).values(userIds.map((userId) => ({ boardId, userId })));
  }
}

export async function activeMemberIds(exec: Executor, boardId: number): Promise<number[]> {
  const rows = await exec
    .select({ userId: boardMembers.userId })
    .from(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.active, true)));
  return rows.map((r) => r.userId);
}

export async function userRefs(exec: Executor, ids: (number | null)[]): Promise<Map<number, UserRef>> {
  const wanted = [...new Set(ids.filter((id): id is number => id !== null))];
  if (wanted.length === 0) return new Map();
  const rows = await exec.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, wanted));
  return new Map(rows.map((r) => [r.id, r]));
}

export function refOrNull(refs: Map<number, UserRef>, id: number | null): UserRef | null {
  return id === null ? null : (refs.get(id) ?? null);
}

export function ref(refs: Map<number, UserRef>, id: number): UserRef {
  return refs.get(id) ?? { id, name: "Unbekannt" };
}
