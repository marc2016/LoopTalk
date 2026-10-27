import type { AuditAction, BoardChangedEvent, PresenceEvent, UserRef } from "@looptalk/shared";
import type { Response } from "express";
import type { BoardNotifier } from "../services";

interface Client {
  res: Response;
  user: UserRef;
  /** Prüft, ob die Session noch gültig ist; sonst wird die Verbindung beendet. */
  isSessionValid: () => Promise<boolean>;
}

interface Presence {
  user: UserRef;
  connections: number;
  leaveTimer?: NodeJS.Timeout;
}

export interface HubOptions {
  heartbeatMs?: number;
  /** Karenzzeit, bevor ein Benutzer ohne offene Verbindung als gegangen gilt (gegen Flackern bei Reloads). */
  leaveGraceMs?: number;
}

/**
 * Server-Sent Events pro Board. Nach jeder Änderung bekommen nur die Clients des
 * betroffenen Boards ein `board`-Event und laden neu. Die Anwesenheit leitet sich
 * aus den offenen Verbindungen ab und wird als `presence`-Event verteilt.
 */
export class RealtimeHub implements BoardNotifier {
  private readonly clients = new Map<number, Set<Client>>();
  private readonly presence = new Map<number, Map<number, Presence>>();
  private readonly heartbeat: NodeJS.Timeout;
  private readonly leaveGraceMs: number;

  constructor({ heartbeatMs = 15_000, leaveGraceMs = 10_000 }: HubOptions = {}) {
    this.leaveGraceMs = leaveGraceMs;
    this.heartbeat = setInterval(() => void this.beat(), heartbeatMs);
    this.heartbeat.unref();
  }

  connect(boardId: number, client: Client): void {
    const { res } = client;
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write("retry: 3000\n\n");

    let set = this.clients.get(boardId);
    if (!set) this.clients.set(boardId, (set = new Set()));
    set.add(client);
    this.join(boardId, client.user);
    // Der neue Client braucht den aktuellen Stand, auch wenn sich nichts geändert hat.
    this.send(client, "presence", this.presenceEvent(boardId));

    res.on("close", () => {
      set.delete(client);
      if (set.size === 0) this.clients.delete(boardId);
      this.leave(boardId, client.user.id);
    });
  }

  boardChanged(boardId: number, reason: AuditAction): void {
    const event: BoardChangedEvent = { reason };
    this.broadcast(boardId, "board", event);
  }

  presenceOf(boardId: number): UserRef[] {
    return this.presenceEvent(boardId).users;
  }

  close(): void {
    clearInterval(this.heartbeat);
    for (const set of this.clients.values()) for (const client of set) client.res.end();
    for (const board of this.presence.values()) for (const p of board.values()) clearTimeout(p.leaveTimer);
    this.clients.clear();
    this.presence.clear();
  }

  private join(boardId: number, user: UserRef): void {
    let board = this.presence.get(boardId);
    if (!board) this.presence.set(boardId, (board = new Map()));
    const existing = board.get(user.id);
    if (existing) {
      clearTimeout(existing.leaveTimer);
      existing.leaveTimer = undefined;
      existing.connections += 1;
      existing.user = user;
      return;
    }
    board.set(user.id, { user, connections: 1 });
    this.broadcast(boardId, "presence", this.presenceEvent(boardId));
  }

  private leave(boardId: number, userId: number): void {
    const board = this.presence.get(boardId);
    const entry = board?.get(userId);
    if (!board || !entry) return;
    entry.connections -= 1;
    if (entry.connections > 0) return;
    entry.leaveTimer = setTimeout(() => {
      if (entry.connections > 0) return;
      board.delete(userId);
      if (board.size === 0) this.presence.delete(boardId);
      this.broadcast(boardId, "presence", this.presenceEvent(boardId));
    }, this.leaveGraceMs);
    entry.leaveTimer.unref();
  }

  private presenceEvent(boardId: number): PresenceEvent {
    const board = this.presence.get(boardId);
    const users = board ? [...board.values()].map((p) => p.user) : [];
    users.sort((a, b) => a.name.localeCompare(b.name, "de") || a.id - b.id);
    return { users };
  }

  private broadcast(boardId: number, event: string, data: unknown): void {
    for (const client of this.clients.get(boardId) ?? []) this.send(client, event, data);
  }

  private send(client: Client, event: string, data: unknown): void {
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  /** Heartbeat hält Proxies offen, erkennt tote Verbindungen und abgelaufene Sessions. */
  private async beat(): Promise<void> {
    const all = [...this.clients.values()].flatMap((set) => [...set]);
    await Promise.all(
      all.map(async (client) => {
        if (!(await client.isSessionValid().catch(() => false))) {
          this.send(client, "unauthorized", {});
          client.res.end();
          return;
        }
        client.res.write(": ping\n\n");
      }),
    );
  }
}
