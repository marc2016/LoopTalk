import type { BoardView } from "@looptalk/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "../src/errors";
import { createTestDb, type TestDb } from "./db";
import { auditActions, createUser, services } from "./fixtures";

let t: TestDb;
beforeEach(async () => {
  t = await createTestDb();
});
afterEach(async () => {
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

async function setup() {
  const s = services(t.db);
  const anna = await createUser(t.db, "Anna");
  const ben = await createUser(t.db, "Ben");
  const { slug } = await s.boards.create(anna, "Board");
  const board = await s.boards.open(slug, anna);
  await s.boards.open(slug, ben);
  const a = await s.cards.create(board, anna, { title: "Release", description: "" });
  const b = await s.cards.create(board, anna, { title: "Budget", description: "" });
  const view = () => s.boards.view(board);
  const card = (v: BoardView, id: number) => v.cards.find((c) => c.id === id)!;
  return { s, anna, ben, board, a, b, view, card };
}

describe("Gemeinsamer Fokus", () => {
  it("nur im laufenden Termin", async () => {
    const { s, anna, board, a } = await setup();
    await expectAppError(s.meetings.focus(board, anna, a.id), "conflict");
    await expectAppError(s.meetings.setDiscussed(board, anna, a.id, true), "conflict");
  });

  it("zeigen setzt den Fokus, markiert als besprochen und ändert die Version nicht", async () => {
    const { s, anna, ben, board, a, view, card } = await setup();
    await s.meetings.start(board, anna, 0);
    const before = await view();

    await s.meetings.focus(board, anna, a.id);
    let v = await view();
    expect(v.meeting.focus).toMatchObject({ cardId: a.id, by: { id: anna, name: "Anna" } });
    expect(v.meeting.version).toBe(before.meeting.version);
    expect(card(v, a.id).discussed).toBe(true);
    expect(s.notifier.events.at(-1)?.reason).toBe("meeting.focus_changed");

    // Anderes Thema ersetzt den Fokus
    await s.meetings.focus(board, ben, a.id);
    v = await view();
    expect(v.meeting.focus).toMatchObject({ cardId: a.id, by: { name: "Ben" } });

    await s.meetings.unfocus(board);
    v = await view();
    expect(v.meeting.focus).toBeNull();
    expect(card(v, a.id).discussed).toBe(true);
  });

  it("Audit: besprochen durch Zeigen genau einmal, Zeigen selbst nicht", async () => {
    const { s, anna, ben, board, a } = await setup();
    await s.meetings.start(board, anna, 0);
    await s.meetings.focus(board, anna, a.id);
    await s.meetings.focus(board, ben, a.id);
    await s.meetings.unfocus(board);
    const actions = (await auditActions(t.db, board.id)).filter((x) => x.startsWith("card.discussed"));
    expect(actions).toEqual(["card.discussed"]);
    const [entry] = (await s.audit.list(board.id, { limit: 1, action: "card.discussed" })).entries;
    expect(entry).toMatchObject({ actor: { name: "Anna" }, data: { title: "Release", number: 1, via: "focus" } });
  });

  it("Karte eines fremden Boards oder gelöschte Karte ergibt nicht gefunden", async () => {
    const { s, anna, board, a } = await setup();
    const other = await s.boards.open((await s.boards.create(anna, "Anderes")).slug, anna);
    const fremd = await s.cards.create(other, anna, { title: "Fremd", description: "" });
    await s.meetings.start(board, anna, 0);
    await expectAppError(s.meetings.focus(board, anna, fremd.id), "not_found");
    await s.cards.remove(board, anna, a.id);
    await expectAppError(s.meetings.focus(board, anna, a.id), "not_found");
  });

  it("Löschen der Fokuskarte beendet den Fokus", async () => {
    const { s, anna, board, a, view } = await setup();
    await s.meetings.start(board, anna, 0);
    await s.meetings.focus(board, anna, a.id);
    await s.cards.remove(board, anna, a.id);
    expect((await view()).meeting.focus).toBeNull();
  });

  it("Beenden: Fokus endet, besprochen landet in der Historie, neuer Termin beginnt unbesprochen", async () => {
    const { s, anna, board, a, b, view, card } = await setup();
    await s.meetings.start(board, anna, 0);
    await s.meetings.focus(board, anna, a.id);
    await s.meetings.end(board, anna, 1);

    let v = await view();
    expect(v.meeting.focus).toBeNull();
    expect(card(v, a.id).discussed).toBe(false);

    const [history] = await s.meetings.history(board);
    expect(history!.cards.map((c) => [c.title, c.discussed])).toEqual([
      ["Release", true],
      ["Budget", false],
    ]);

    await s.meetings.start(board, anna, 0);
    v = await view();
    expect(card(v, a.id).discussed).toBe(false);
    expect(card(v, b.id).discussed).toBe(false);
  });
});

describe("Besprochen manuell", () => {
  it("markieren und entfernen, idempotent mit Audit nur bei Änderung", async () => {
    const { s, anna, ben, board, b, view, card } = await setup();
    await s.meetings.start(board, anna, 0);
    await s.meetings.setDiscussed(board, ben, b.id, true);
    await s.meetings.setDiscussed(board, ben, b.id, true);
    expect(card(await view(), b.id).discussed).toBe(true);

    await s.meetings.setDiscussed(board, anna, b.id, false);
    await s.meetings.setDiscussed(board, anna, b.id, false);
    expect(card(await view(), b.id).discussed).toBe(false);

    const actions = (await auditActions(t.db, board.id)).filter((x) => x.includes("discussed"));
    expect(actions).toEqual(["card.discussed", "card.undiscussed"]);
  });
});
