import type { AuditAction } from "@looptalk/shared";
import { asc, eq } from "drizzle-orm";
import type { Db } from "../src/db/client";
import { auditEvents, users } from "../src/db/schema";
import { createServices, type BoardNotifier } from "../src/services";

export class RecordingNotifier implements BoardNotifier {
  events: { boardId: number; reason: AuditAction }[] = [];
  boardChanged(boardId: number, reason: AuditAction) {
    this.events.push({ boardId, reason });
  }
}

export function services(db: Db, rng: () => number = () => 0) {
  const notifier = new RecordingNotifier();
  return { notifier, ...createServices({ db, notifier, rng, now: () => new Date() }) };
}

export async function createUser(db: Db, name: string): Promise<number> {
  const [user] = await db
    .insert(users)
    .values({ oidcSub: `sub-${name}-${Math.random()}`, name, email: `${name.toLowerCase()}@example.com` })
    .returning({ id: users.id });
  return user!.id;
}

export async function auditActions(db: Db, boardId: number): Promise<AuditAction[]> {
  const rows = await db
    .select({ action: auditEvents.action })
    .from(auditEvents)
    .where(eq(auditEvents.boardId, boardId))
    .orderBy(asc(auditEvents.id));
  return rows.map((r) => r.action);
}
