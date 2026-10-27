import fs from "node:fs";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import type { BoardSummary, BoardView } from "@looptalk/shared";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { LoginChecks, OidcClient } from "../src/auth/oidc";
import { createApp } from "../src/http/app";
import { RealtimeHub } from "../src/realtime/hub";
import { createServices } from "../src/services";
import { createTestDb, type TestDb } from "./db";

/** Attrappe für Dex: Der `code` ist der Benutzername, `state` wird wie bei Dex geprüft. */
const fakeIdp: OidcClient = {
  async start() {
    const checks: LoginChecks = { state: `s-${Math.random()}`, nonce: "n", codeVerifier: "v" };
    return { url: new URL(`http://idp.test/auth?state=${checks.state}`), checks };
  },
  async finish(currentUrl, checks) {
    if (currentUrl.searchParams.get("state") !== checks.state) throw new Error("state stimmt nicht");
    const name = currentUrl.searchParams.get("code")!;
    return { sub: `sub-${name}`, name, email: `${name.toLowerCase()}@example.com` };
  },
};

let t: TestDb;
let app: Express;
let hub: RealtimeHub;
let staticDir: string;

beforeAll(async () => {
  t = await createTestDb();
  staticDir = fs.mkdtempSync(path.join(os.tmpdir(), "looptalk-web-"));
  fs.writeFileSync(path.join(staticDir, "index.html"), "<!doctype html><title>LoopTalk</title>");
  fs.writeFileSync(path.join(staticDir, "app.js"), "console.log('app')");
  hub = new RealtimeHub();
  const services = createServices({ db: t.db, notifier: hub, rng: () => 0, now: () => new Date() });
  app = createApp({
    db: t.db,
    pool: t.pool,
    services,
    hub,
    oidc: fakeIdp,
    baseUrl: "http://looptalk.test",
    sessionSecret: "test-secret-test-secret-test-secret",
    staticDir,
  });
});

afterAll(async () => {
  hub.close();
  // Beim Schließen offener Live-Verbindungen speichert express-session noch; das abwarten.
  await new Promise((resolve) => setTimeout(resolve, 200));
  await t.drop();
  fs.rmSync(staticDir, { recursive: true, force: true });
});

/** Kompletter Login über /auth/login und /auth/callback; liefert das Session-Cookie. */
async function login(name: string, returnTo = "/"): Promise<{ cookie: string; location: string }> {
  const start = await request(app).get(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`).expect(302);
  const state = new URL(start.headers.location!).searchParams.get("state")!;
  const startCookie = start.headers["set-cookie"]![0]!.split(";")[0]!;
  const callback = await request(app)
    .get(`/auth/callback?code=${name}&state=${state}`)
    .set("Cookie", startCookie)
    .expect(302);
  return { cookie: callback.headers["set-cookie"]![0]!.split(";")[0]!, location: callback.headers.location! };
}

const as = (cookie: string) => ({
  get: (url: string) => request(app).get(url).set("Cookie", cookie),
  post: (url: string, body?: object) => request(app).post(url).set("Cookie", cookie).send(body),
  patch: (url: string, body?: object) => request(app).patch(url).set("Cookie", cookie).send(body),
  delete: (url: string) => request(app).delete(url).set("Cookie", cookie),
});

describe("Zugriff nur mit Login", () => {
  it("Health-Check ist öffentlich und ohne Daten", async () => {
    const res = await request(app).get("/healthz").expect(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it.each(["/api/me", "/api/boards", "/api/boards/abc", "/api/boards/abc/events", "/api/unbekannt"])(
    "%s antwortet ohne Session mit 401",
    async (url) => {
      const res = await request(app).get(url).expect(401);
      expect(res.body.error.code).toBe("unauthorized");
    },
  );

  it.each(["/", "/b/abc", "/app.js", "/index.html"])("%s leitet ohne Session zum Login um", async (url) => {
    const res = await request(app).get(url).expect(302);
    expect(res.headers.location).toBe(`/auth/login?returnTo=${encodeURIComponent(url)}`);
  });

  it("nach dem Login geht es zurück auf die angeforderte Seite", async () => {
    const { location, cookie } = await login("Anna", "/b/xyz?tab=1");
    expect(location).toBe("/b/xyz?tab=1");
    await as(cookie).get("/b/xyz").expect(200).expect(/LoopTalk/);
    await as(cookie).get("/app.js").expect(200);
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example"])("returnTo %s wird ignoriert", async (returnTo) => {
    const { location } = await login("Anna", returnTo);
    expect(location).toBe("/");
  });

  it("manipulierter state führt zu keinem Login", async () => {
    const start = await request(app).get("/auth/login").expect(302);
    const startCookie = start.headers["set-cookie"]![0]!.split(";")[0]!;
    const res = await request(app).get("/auth/callback?code=Mallory&state=falsch").set("Cookie", startCookie).expect(400);
    expect(res.text).toContain("Anmeldung fehlgeschlagen");
    await as(startCookie).get("/api/me").expect(401);
  });

  it("Logout beendet die Session", async () => {
    const { cookie } = await login("Anna");
    await as(cookie).get("/api/me").expect(200);
    await as(cookie).get("/auth/logout").expect(302).expect("Location", "/auth/logged-out");
    await as(cookie).get("/api/me").expect(401);
  });

  it("legt den Benutzer beim Login an und aktualisiert ihn", async () => {
    const { cookie } = await login("Dora");
    const me = await as(cookie).get("/api/me").expect(200);
    expect(me.body).toMatchObject({ name: "Dora", email: "dora@example.com" });
    const again = await login("Dora");
    expect((await as(again.cookie).get("/api/me")).body.id).toBe(me.body.id);
  });
});

describe("Boards und Karten", () => {
  let anna: ReturnType<typeof as>;
  let ben: ReturnType<typeof as>;
  let slug: string;

  beforeAll(async () => {
    anna = as((await login("Anna")).cookie);
    ben = as((await login("Ben")).cookie);
    const res = await anna.post("/api/boards", { name: "Team-Austausch" }).expect(201);
    slug = (res.body as BoardSummary).slug;
  });

  it("Board ohne Namen wird abgelehnt", async () => {
    const res = await anna.post("/api/boards", { name: "  " }).expect(400);
    expect(res.body.error.message).toBe("Bitte einen Namen angeben.");
  });

  it("unbekannte Kennung ergibt 404", async () => {
    await anna.get("/api/boards/AAAAAAAAAAAAAAAAAAAAAA").expect(404);
    await anna.get("/api/boards/..%2F..").expect(404);
  });

  it("Link teilen: Ben tritt bei und sieht das Board; es steht in seiner Liste", async () => {
    const view = (await ben.get(`/api/boards/${slug}`).expect(200)).body as BoardView;
    expect(view.participants.map((p) => p.name)).toEqual(["Anna", "Ben"]);
    expect(view.tooFewParticipants).toBe(false);
    const mine = (await ben.get("/api/boards").expect(200)).body as BoardSummary[];
    expect(mine.map((b) => b.slug)).toContain(slug);
  });

  it("Karten: anlegen, bearbeiten, Namen, löschen; Spalte ist nicht änderbar", async () => {
    await anna.post(`/api/boards/${slug}/cards`, { title: "" }).expect(400);
    const { id } = (await anna.post(`/api/boards/${slug}/cards`, { title: "Release" }).expect(201)).body;

    await ben.patch(`/api/boards/${slug}/cards/${id}`, { column: 3 }).expect(400);
    await ben.patch(`/api/boards/${slug}/cards/${id}`, { title: "Release", column: 3 }).expect(400);
    await ben.patch(`/api/boards/${slug}/cards/${id}`, { description: "Was steht an?" }).expect(204);
    await ben.post(`/api/boards/${slug}/cards/${id}/people`, { name: "Carla" }).expect(204);

    let view = (await anna.get(`/api/boards/${slug}`)).body as BoardView;
    const card = view.cards.find((c) => c.id === id)!;
    expect(card).toMatchObject({ column: 1, description: "Was steht an?", people: [{ name: "Carla" }] });

    await anna.delete(`/api/boards/${slug}/cards/${id}/people/${card.people[0]!.id}`).expect(204);
    await anna.delete(`/api/boards/${slug}/cards/${id}`).expect(204);
    await anna.patch(`/api/boards/${slug}/cards/${id}`, { title: "X" }).expect(404);
    view = (await anna.get(`/api/boards/${slug}`)).body as BoardView;
    expect(view.cards.find((c) => c.id === id)).toBeUndefined();

    const history = (await anna.get(`/api/boards/${slug}/cards/${id}/audit`).expect(200)).body;
    expect(history.map((e: { action: string }) => e.action)).toEqual([
      "card.created",
      "card.updated",
      "card.person_added",
      "card.person_removed",
      "card.deleted",
    ]);
  });

  it("Karte eines fremden Boards ergibt 404", async () => {
    const other = (await anna.post("/api/boards", { name: "Anderes" }).expect(201)).body.slug;
    const { id } = (await anna.post(`/api/boards/${other}/cards`, { title: "Fremd" }).expect(201)).body;
    await anna.patch(`/api/boards/${slug}/cards/${id}`, { title: "X" }).expect(404);
    await anna.delete(`/api/boards/${slug}/cards/${id}`).expect(404);
    await anna.get(`/api/boards/${slug}/cards/${id}/audit`).expect(404);
    await anna.get(`/api/boards/${slug}/cards/abc`).expect(404);
  });

  it("Termin starten, Rollen ändern, beenden; Konflikte mit 409", async () => {
    let view = (await anna.get(`/api/boards/${slug}`)).body as BoardView;
    const annaId = view.participants.find((p) => p.name === "Anna")!.id;
    const benId = view.participants.find((p) => p.name === "Ben")!.id;

    await anna.post(`/api/boards/${slug}/meetings/current/end`, { version: view.meeting.version }).expect(409);
    await anna.post(`/api/boards/${slug}/meetings/current/start`, { version: view.meeting.version }).expect(204);
    await ben.post(`/api/boards/${slug}/meetings/current/start`, { version: view.meeting.version }).expect(409);

    view = (await anna.get(`/api/boards/${slug}`)).body as BoardView;
    expect(view.meeting.status).toBe("running");
    await ben
      .patch(`/api/boards/${slug}/meetings/current/roles`, { moderatorId: annaId, protocolId: annaId, version: view.meeting.version })
      .expect(400);
    await ben
      .patch(`/api/boards/${slug}/meetings/current/roles`, { moderatorId: benId, protocolId: annaId, version: view.meeting.version })
      .expect(204);

    view = (await anna.get(`/api/boards/${slug}`)).body as BoardView;
    expect(view.meeting).toMatchObject({ moderator: { name: "Ben" }, protocol: { name: "Anna" } });

    const ended = await anna.post(`/api/boards/${slug}/meetings/current/end`, { version: view.meeting.version }).expect(200);
    expect(ended.body).toEqual({ moderator: { id: annaId, name: "Anna" }, protocol: { id: benId, name: "Ben" } });

    const history = (await anna.get(`/api/boards/${slug}/meetings`).expect(200)).body;
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ number: 1, moderator: { name: "Ben" }, protocol: { name: "Anna" } });
  });

  it("Teilnehmer aktiv/inaktiv und Audit-Log mit Filtern", async () => {
    const participants = (await anna.get(`/api/boards/${slug}/participants`).expect(200)).body;
    const benId = participants.find((p: { name: string }) => p.name === "Ben").id;
    await anna.patch(`/api/boards/${slug}/participants/${benId}`, { active: false }).expect(204);
    const view = (await anna.get(`/api/boards/${slug}`)).body as BoardView;
    expect(view.tooFewParticipants).toBe(true);
    await anna.patch(`/api/boards/${slug}/participants/${benId}`, { active: true }).expect(204);

    const page = (await anna.get(`/api/boards/${slug}/audit?action=member.deactivated`).expect(200)).body;
    expect(page.entries).toHaveLength(1);
    expect(page.entries[0]).toMatchObject({ actor: { name: "Anna" }, data: { user: { name: "Ben" } } });
    await anna.get(`/api/boards/${slug}/audit?action=gibt.es.nicht`).expect(400);
  });

  it("Board umbenennen", async () => {
    const res = await ben.patch(`/api/boards/${slug}`, { name: "Neuer Name" }).expect(200);
    expect(res.body.name).toBe("Neuer Name");
  });

  it("Live-Stream liefert Anwesenheit und Board-Events", async () => {
    const server = app.listen(0);
    const { port } = server.address() as AddressInfo;
    const controller = new AbortController();
    try {
      const { cookie } = await login("Carla");
      const res = await fetch(`http://127.0.0.1:${port}/api/boards/${slug}/events`, {
        headers: { cookie },
        signal: controller.signal,
      });
      expect(res.headers.get("content-type")).toMatch(/text\/event-stream/);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";
      const readUntil = async (needle: string) => {
        while (!text.includes(needle)) text += decoder.decode((await reader.read()).value);
      };
      await readUntil("event: presence");
      expect(text).toContain('"name":"Carla"');

      await anna.post(`/api/boards/${slug}/cards`, { title: "Live" }).expect(201);
      await readUntil("event: board");
      expect(text).toContain('{"reason":"card.created"}');
    } finally {
      controller.abort();
      server.closeAllConnections();
      server.close();
    }
  });
});
