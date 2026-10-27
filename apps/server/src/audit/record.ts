import type { AuditAction, AuditEntry } from "@looptalk/shared";
import type { Tx } from "../db/client";
import { auditEvents } from "../db/schema";

export interface AuditInput {
  boardId: number;
  actorId: number;
  action: AuditAction;
  targetType: AuditEntry["targetType"];
  targetId: number;
  data?: Record<string, unknown>;
}

/**
 * Schreibt einen Audit-Eintrag. Nimmt bewusst nur eine Transaktion entgegen:
 * Der Eintrag entsteht immer zusammen mit der Änderung oder gar nicht.
 */
export async function recordAudit(tx: Tx, entry: AuditInput): Promise<void> {
  await tx.insert(auditEvents).values({ ...entry, data: entry.data ?? {} });
}
