import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auditEvents, cards } from "../src/db/schema";
import { AppError } from "../src/errors";
import { poolOf } from "../src/services/boards";
import { createTestDb, type TestDb } from "./db";
import { auditActions, createUser, services } from "./fixtures";

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.drop();
});

async function expectAppError(promise: Promise<unknown>, code: AppError["code"]) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(AppError);
  expect((err as AppError).code).toBe(code);
}

describe("Boards", () => {
  it("legt Board, Mitgliedschaft und ersten Termin an", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    const summary = await s.boards.create(anna, "Team-Austausch");
    expect(summary.slug).toMatch(/^[A-Za-z0-9_-]{22}$/);

    const board = await s.boards.open(summary.slug, anna);
    const view = await s.boards.view(board);
    expect(view.meeting).toMatchObject({ number: 1, status: "planned", moderator: { id: anna }, protocol: null });
    expect(view.participants.map((p) => p.name)).toEqual(["Anna"]);
    expect(view.tooFewParticipants).toBe(true);
    expect(await auditActions(t.db, board.id)).toEqual(["board.created"]);
  });

  it("tritt beim ersten Öffnen bei, kommt in den Topf und protokolliert genau einmal", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    const ben = await createUser(t.db, "Ben");
    const { slug } = await s.boards.create(anna, "Board");

    const board = await s.boards.open(slug, ben);
    await s.boards.open(slug, ben);
    expect(await poolOf(t.db, board.id)).toEqual([ben]);
    expect(await auditActions(t.db, board.id)).toEqual(["board.created", "member.joined"]);
    expect(s.notifier.events).toEqual([{ boardId: board.id, reason: "member.joined" }]);
    expect((await s.boards.view(board)).tooFewParticipants).toBe(false);
  });

  it("unbekannter Link ergibt nicht gefunden", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    await expectAppError(s.boards.open("gibt-es-nicht", anna), "not_found");
  });

  it("listet nur eigene Boards", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    const ben = await createUser(t.db, "Ben");
    const a = await s.boards.create(anna, "Annas Board");
    await s.boards.create(ben, "Bens Board");
    expect((await s.boards.listMine(anna)).map((b) => b.slug)).toEqual([a.slug]);
  });
});

describe("Karten", () => {
  it("anlegen, fremd bearbeiten, Namen ergänzen, löschen – alles im Audit-Log", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    const ben = await createUser(t.db, "Ben");
    const { slug } = await s.boards.create(anna, "Board");
    const board = await s.boards.open(slug, anna);
    await s.boards.open(slug, ben);

    const { id } = await s.cards.create(board, anna, { title: "Release", description: "" });
    await s.cards.update(board, ben, id, { title: "Release-Planung" });
    await s.cards.addPerson(board, ben, id, { name: "Carla" });
    await s.cards.addPerson(board, ben, id, { name: "carla" }); // doppelt, keine Änderung
    await s.cards.addPerson(board, ben, id, { name: "Ben", userId: ben });

    let view = await s.boards.view(board);
    expect(view.cards).toHaveLength(1);
    expect(view.cards[0]).toMatchObject({
      title: "Release-Planung",
      column: 1,
      createdBy: { id: anna, name: "Anna" },
      people: [
        { name: "Carla", userId: null },
        { name: "Ben", userId: ben },
      ],
    });

    const carla = view.cards[0]!.people[0]!;
    await s.cards.removePerson(board, anna, id, carla.id);
    await s.cards.remove(board, ben, id);
    view = await s.boards.view(board);
    expect(view.cards).toEqual([]);
    await expectAppError(s.cards.update(board, anna, id, { title: "X" }), "not_found");

    const history = await s.audit.card(board.id, id);
    expect(history.map((e) => [e.action, e.actor.name])).toEqual([
      ["card.created", "Anna"],
      ["card.updated", "Ben"],
      ["card.person_added", "Ben"],
      ["card.person_added", "Ben"],
      ["card.person_removed", "Anna"],
      ["card.deleted", "Ben"],
    ]);
    expect(history[1]!.data).toMatchObject({ before: { title: "Release" }, after: { title: "Release-Planung" } });
    expect(history[5]!.data).toMatchObject({ before: { title: "Release-Planung", people: ["Ben"] } });
  });

  it("Namen nur mit Teilnehmer-ID des Boards", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    const fremd = await createUser(t.db, "Fremd");
    const { slug } = await s.boards.create(anna, "Board");
    const board = await s.boards.open(slug, anna);
    const { id } = await s.cards.create(board, anna, { title: "A", description: "" });
    await expectAppError(s.cards.addPerson(board, anna, id, { name: "Fremd", userId: fremd }), "bad_request");
  });

  it("Karten eines anderen Boards sind nicht erreichbar", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    const a = await s.boards.open((await s.boards.create(anna, "A")).slug, anna);
    const b = await s.boards.open((await s.boards.create(anna, "B")).slug, anna);
    const { id } = await s.cards.create(a, anna, { title: "Nur auf A", description: "" });
    await expectAppError(s.cards.update(b, anna, id, { title: "X" }), "not_found");
    await expectAppError(s.cards.remove(b, anna, id), "not_found");
    expect((await s.boards.view(b)).cards).toEqual([]);
  });
});

describe("Termine", () => {
  async function boardWith(names: string[], rng?: () => number) {
    const s = services(t.db, rng);
    const ids = [];
    for (const n of names) ids.push(await createUser(t.db, n));
    const { slug } = await s.boards.create(ids[0]!, "Board");
    for (const id of ids) await s.boards.open(slug, id);
    const board = await s.boards.open(slug, ids[0]!);
    return { s, ids, board };
  }

  it("starten, beenden: Karten wandern, Rollen wechseln, Historie entsteht", async () => {
    const { s, ids, board } = await boardWith(["Anna", "Ben", "Carla"]);
    const [anna] = ids;
    const a = await s.cards.create(board, anna!, { title: "A", description: "" });
    const b = await s.cards.create(board, anna!, { title: "B", description: "" });
    const c = await s.cards.create(board, anna!, { title: "C", description: "" });
    await t.db.update(cards).set({ column: 2 }).where(eq(cards.id, b.id));
    await t.db.update(cards).set({ column: 3 }).where(eq(cards.id, c.id));

    await s.meetings.start(board, anna!, 0);
    let view = await s.boards.view(board);
    expect(view.meeting).toMatchObject({ status: "running", version: 1 });
    expect(view.cards.map((x) => [x.title, x.column])).toEqual([
      ["A", 1],
      ["B", 2],
      ["C", 3],
    ]);

    const d = await s.cards.create(board, anna!, { title: "D", description: "" });
    const next = await s.meetings.end(board, anna!, 1);
    expect(next.protocol).toEqual({ id: anna, name: "Anna" });
    expect(next.moderator.id).not.toBe(anna);

    view = await s.boards.view(board);
    expect(view.meeting).toMatchObject({ number: 2, status: "planned", protocol: { id: anna }, version: 0 });
    expect(view.cards.map((x) => [x.id, x.column])).toEqual([
      [a.id, 2],
      [b.id, 3],
      [d.id, 2],
    ]);

    const history = await s.meetings.history(board);
    expect(history).toHaveLength(1);
    expect(history[0]!.moderator.id).toBe(anna);
    expect(history[0]!.cards.map((x) => [x.title, x.column])).toEqual([
      ["A", 1],
      ["D", 1],
      ["B", 2],
      ["C", 3],
    ]);

    // Archivierung erscheint im Verlauf der Karte
    const cHistory = await s.audit.card(board.id, c.id);
    expect(cHistory.map((e) => e.action)).toEqual(["card.created", "meeting.ended"]);
  });

  it("doppelter Start und doppeltes Beenden werden abgelehnt, ohne Audit-Eintrag", async () => {
    const { s, ids, board } = await boardWith(["Anna", "Ben"]);
    const [anna, ben] = ids;
    await expectAppError(s.meetings.end(board, anna!, 0), "conflict");
    await Promise.allSettled([s.meetings.start(board, anna!, 0), s.meetings.start(board, ben!, 0)]);
    const results = await Promise.allSettled([s.meetings.end(board, anna!, 1), s.meetings.end(board, ben!, 1)]);
    expect(results.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);

    const actions = await auditActions(t.db, board.id);
    expect(actions.filter((a) => a === "meeting.started")).toHaveLength(1);
    expect(actions.filter((a) => a === "meeting.ended")).toHaveLength(1);
  });

  it("Rollen manuell ändern passt den Topf an", async () => {
    const { s, ids, board } = await boardWith(["Anna", "Ben", "Carla"]);
    const [anna, ben, carla] = ids;
    expect(await poolOf(t.db, board.id)).toEqual([ben, carla]);

    await s.meetings.setRoles(board, ben!, { moderatorId: carla!, protocolId: ben!, version: 0 });
    const view = await s.boards.view(board);
    expect(view.meeting).toMatchObject({ moderator: { id: carla }, protocol: { id: ben }, version: 1 });
    expect(await poolOf(t.db, board.id)).toEqual([anna, ben]);

    await expectAppError(s.meetings.setRoles(board, ben!, { moderatorId: ben!, protocolId: ben!, version: 1 }), "bad_request");
    await expectAppError(s.meetings.setRoles(board, ben!, { moderatorId: anna!, protocolId: null, version: 0 }), "conflict");

    const [entry] = (await s.audit.list(board.id, { limit: 1, action: "meeting.roles_changed" })).entries;
    expect(entry!.data).toMatchObject({
      before: { moderator: { name: "Anna" }, protocol: null },
      after: { moderator: { name: "Carla" }, protocol: { name: "Ben" } },
    });
  });

  it("mit einem Teilnehmer bleibt der Moderator, Protokoll leer", async () => {
    const { s, ids, board } = await boardWith(["Anna"]);
    await s.meetings.start(board, ids[0]!, 0);
    const next = await s.meetings.end(board, ids[0]!, 1);
    expect(next).toEqual({ moderator: { id: ids[0], name: "Anna" }, protocol: null });
  });

  it("inaktive Teilnehmer verlassen den Topf und werden nicht gezogen", async () => {
    const { s, ids, board } = await boardWith(["Anna", "Ben", "Carla"]);
    const [anna, ben, carla] = ids;
    await s.participants.setActive(board, anna!, ben!, false);
    expect(await poolOf(t.db, board.id)).toEqual([carla]);
    await s.meetings.start(board, anna!, 0);
    expect((await s.meetings.end(board, anna!, 1)).moderator.id).toBe(carla);
    await s.participants.setActive(board, anna!, ben!, true);
    expect(await poolOf(t.db, board.id)).toEqual([ben]);
    expect((await auditActions(t.db, board.id)).filter((a) => a.startsWith("member.") && a !== "member.joined")).toEqual([
      "member.deactivated",
      "member.activated",
    ]);
  });

  it("Termine eines Boards lassen andere Boards unberührt", async () => {
    const one = await boardWith(["Anna", "Ben"]);
    const s = one.s;
    const anna = one.ids[0]!;
    const other = await s.boards.open((await s.boards.create(anna, "Anderes")).slug, anna);
    await s.cards.create(other, anna, { title: "Bleibt", description: "" });

    await s.meetings.start(one.board, anna, 0);
    await s.meetings.end(one.board, anna, 1);
    const view = await s.boards.view(other);
    expect(view.meeting).toMatchObject({ number: 1, status: "planned" });
    expect(view.cards[0]!.column).toBe(1);
  });
});

describe("Audit-Log", () => {
  it("ist unveränderlich", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    await s.boards.create(anna, "Board");
    // Drizzle verpackt den Datenbankfehler; die Meldung des Triggers steht in `cause`.
    const dbError = (p: Promise<unknown>) => p.then(() => "kein Fehler", (e: Error) => String((e.cause as Error)?.message ?? e.message));
    expect(await dbError(t.db.update(auditEvents).set({ action: "board.renamed" }))).toMatch(/unveränderlich/);
    expect(await dbError(t.db.delete(auditEvents))).toMatch(/unveränderlich/);
    expect(await dbError(t.db.execute(sql`TRUNCATE audit_events`))).toMatch(/unveränderlich/);
  });

  it("paginiert und filtert nach Akteur und Aktion", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    const ben = await createUser(t.db, "Ben");
    const { slug } = await s.boards.create(anna, "Board");
    const board = await s.boards.open(slug, anna);
    await s.boards.open(slug, ben);
    for (let i = 0; i < 5; i++) await s.cards.create(board, i % 2 ? ben : anna, { title: `K${i}`, description: "" });

    const first = await s.audit.list(board.id, { limit: 4 });
    expect(first.entries).toHaveLength(4);
    expect(first.nextCursor).not.toBeNull();
    const second = await s.audit.list(board.id, { limit: 3, before: first.nextCursor! });
    expect(second.entries.map((e) => e.action)).toEqual(["card.created", "member.joined", "board.created"]);
    expect(second.nextCursor).toBeNull();

    const byBen = await s.audit.list(board.id, { limit: 50, actor: ben, action: "card.created" });
    expect(byBen.entries).toHaveLength(2);
    expect(byBen.entries.every((e) => e.actor.name === "Ben")).toBe(true);
  });

  it("Änderung ohne Effekt erzeugt keinen Eintrag", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    const { slug } = await s.boards.create(anna, "Board");
    const board = await s.boards.open(slug, anna);
    const { id } = await s.cards.create(board, anna, { title: "Gleich", description: "" });
    await s.cards.update(board, anna, id, { title: "Gleich" });
    await s.boards.rename(board, anna, "Board");
    expect(await auditActions(t.db, board.id)).toEqual(["board.created", "card.created"]);
  });
});
