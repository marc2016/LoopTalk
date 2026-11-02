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
