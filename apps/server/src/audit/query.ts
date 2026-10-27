import type { AuditEntry, AuditPage, AuditQuery } from "@looptalk/shared";
import { and, asc, desc, eq, lt, or, sql, type SQL } from "drizzle-orm";
import type { Executor } from "../db/client";
import { auditEvents, users } from "../db/schema";

const columns = {
  id: auditEvents.id,
  at: auditEvents.at,
  action: auditEvents.action,
  targetType: auditEvents.targetType,
  targetId: auditEvents.targetId,
  data: auditEvents.data,
  actor: { id: users.id, name: users.name },
};

type Row = {
  id: number;
  at: Date;
  action: AuditEntry["action"];
  targetType: AuditEntry["targetType"];
  targetId: number;
  data: Record<string, unknown>;
  actor: { id: number; name: string };
};

const toEntry = (r: Row): AuditEntry => ({ ...r, at: r.at.toISOString() });

/** Audit-Log eines Boards, neueste zuerst, seitenweise über den Cursor `before`. */
export async function listAudit(
  exec: Executor,
  boardId: number,
  query: AuditQuery,
): Promise<AuditPage> {
  const conditions: SQL[] = [eq(auditEvents.boardId, boardId)];
  if (query.before) conditions.push(lt(auditEvents.id, query.before));
  if (query.actor) conditions.push(eq(auditEvents.actorId, query.actor));
  if (query.action) conditions.push(eq(auditEvents.action, query.action));

  const rows = (await exec
    .select(columns)
    .from(auditEvents)
    .innerJoin(users, eq(users.id, auditEvents.actorId))
    .where(and(...conditions))
    .orderBy(desc(auditEvents.id))
    .limit(query.limit + 1)) as Row[];

  const page = rows.slice(0, query.limit);
  return {
    entries: page.map(toEntry),
    nextCursor: rows.length > query.limit ? page[page.length - 1]!.id : null,
  };
}

/** Verlauf einer Karte von der Anlage bis zu Löschen oder Archivierung, älteste zuerst. */
export async function listCardAudit(exec: Executor, boardId: number, cardId: number): Promise<AuditEntry[]> {
  const rows = (await exec
    .select(columns)
    .from(auditEvents)
    .innerJoin(users, eq(users.id, auditEvents.actorId))
    .where(
      and(
        eq(auditEvents.boardId, boardId),
        or(
          and(eq(auditEvents.targetType, "card"), eq(auditEvents.targetId, cardId)),
          and(
            eq(auditEvents.action, "meeting.ended"),
            sql`(${auditEvents.data}->'archivedCardIds' @> ${JSON.stringify([cardId])}::jsonb
              OR ${auditEvents.data}->'moved' @> ${JSON.stringify([{ cardId }])}::jsonb)`,
          ),
        ),
      ),
    )
    .orderBy(asc(auditEvents.id))) as Row[];
  return rows.map(toEntry);
}
