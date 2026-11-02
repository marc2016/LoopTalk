import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { poolOf } from "../src/services/boards";
import { createTestDb, type TestDb } from "./db";
import { createUser, services } from "./fixtures";

let t: TestDb;
beforeEach(async () => {
  t = await createTestDb();
});
afterEach(async () => {
  await t.drop();
});

const migration = (name: string) => fs.readFileSync(path.join(import.meta.dirname, "../drizzle", name), "utf8");

describe("0003: alle Benutzer auf allen Boards", () => {
  it("füllt fehlende Teilnehmer auf und lässt bestehende unverändert", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    const ben = await createUser(t.db, "Ben");
    const board = await s.boards.open((await s.boards.create(anna, "Board")).slug, anna);
    await s.participants.setActive(board, anna, ben, false);
    // Stand vor der Migration: Carla kennt LoopTalk, ist aber nicht auf diesem Board.
    const carla = await createUser(t.db, "Carla");

    await t.pool.query(migration("0003_all_users_on_all_boards.sql"));
    await t.pool.query(migration("0003_all_users_on_all_boards.sql"));

    const view = await s.boards.view(board);
    expect(view.participants.map((p) => [p.name, p.active])).toEqual([
      ["Anna", true],
      ["Ben", false],
      ["Carla", true],
    ]);
    expect(await poolOf(t.db, board.id)).toEqual([carla]);
  });
});

describe("0004: Zettelfarbe", () => {
  it("macht bestehende Karten und Stände gelb und erlaubt nur die festen Farben", async () => {
    const s = services(t.db);
    const anna = await createUser(t.db, "Anna");
    const board = await s.boards.open((await s.boards.create(anna, "Board")).slug, anna);
    const { id } = await s.cards.create(board, anna, { title: "Alt", description: "" });
    await s.meetings.start(board, anna, 0);
    await s.meetings.end(board, anna, 1);
    // Stand vor der Migration: keine Farbspalten.
    await t.pool.query(`ALTER TABLE "cards" DROP COLUMN "color"; ALTER TABLE "meeting_cards" DROP COLUMN "color";`);

    await t.pool.query(migration("0004_card_color.sql"));

    expect((await s.boards.view(board)).cards.map((c) => c.color)).toEqual(["yellow"]);
    expect((await s.meetings.history(board))[0]!.cards.map((c) => c.color)).toEqual(["yellow"]);
    await expect(t.pool.query(`UPDATE "cards" SET "color" = 'red' WHERE "id" = $1`, [id])).rejects.toThrow(
      /cards_color_check/,
    );
  });
});
