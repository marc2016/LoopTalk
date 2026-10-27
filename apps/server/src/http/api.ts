import {
  addPersonSchema,
  auditQuerySchema,
  createBoardSchema,
  createCardSchema,
  meetingVersionSchema,
  renameBoardSchema,
  setParticipantSchema,
  setRolesSchema,
  updateCardSchema,
  type UserRef,
} from "@looptalk/shared";
import { and, eq } from "drizzle-orm";
import { Router, type Request, type Response } from "express";
import type { Db } from "../db/client";
import { cards, users } from "../db/schema";
import { notFound } from "../errors";
import type { RealtimeHub } from "../realtime/hub";
import type { BoardRow, Services } from "../services";
import { parseBody, parseId } from "./validate";

/** Von der Auth-Middleware garantiert: Jede `/api`-Anfrage hat einen Benutzer. */
function currentUser(req: Request): UserRef {
  return req.session.user!;
}

function currentBoard(res: Response): BoardRow {
  return res.locals.board as BoardRow;
}

function sessionStillValid(req: Request): () => Promise<boolean> {
  return () =>
    new Promise((resolve) => {
      req.session.reload((err) => resolve(!err && Boolean(req.session.user)));
    });
}

export function apiRoutes({ db, services, hub }: { db: Db; services: Services; hub: RealtimeHub }): Router {
  const api = Router();

  api.get("/me", async (req, res) => {
    const [me] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, currentUser(req).id));
    if (!me) throw notFound();
    res.json(me);
  });

  api.get("/boards", async (req, res) => {
    res.json(await services.boards.listMine(currentUser(req).id));
  });

  api.post("/boards", async (req, res) => {
    const { name } = parseBody(createBoardSchema, req.body);
    res.status(201).json(await services.boards.create(currentUser(req).id, name));
  });

  // Alles unterhalb eines Boards: Board über den Link auflösen, beim ersten Zugriff beitreten.
  const board = Router({ mergeParams: true });
  api.use("/boards/:slug", async (req, res, next) => {
    const slug = req.params.slug;
    if (typeof slug !== "string" || !/^[A-Za-z0-9_-]{1,32}$/.test(slug)) throw notFound("Board nicht gefunden.");
    res.locals.board = await services.boards.open(slug, currentUser(req).id);
    next();
  }, board);

  board.get("/", async (_req, res) => {
    res.json(await services.boards.view(currentBoard(res)));
  });

  board.patch("/", async (req, res) => {
    const { name } = parseBody(renameBoardSchema, req.body);
    res.json(await services.boards.rename(currentBoard(res), currentUser(req).id, name));
  });

  board.post("/cards", async (req, res) => {
    const input = parseBody(createCardSchema, req.body);
    res.status(201).json(await services.cards.create(currentBoard(res), currentUser(req).id, input));
  });

  board.patch("/cards/:cardId", async (req, res) => {
    const input = parseBody(updateCardSchema, req.body);
    await services.cards.update(currentBoard(res), currentUser(req).id, parseId(req.params.cardId), input);
    res.status(204).end();
  });

  board.delete("/cards/:cardId", async (req, res) => {
    await services.cards.remove(currentBoard(res), currentUser(req).id, parseId(req.params.cardId));
    res.status(204).end();
  });

  board.post("/cards/:cardId/people", async (req, res) => {
    const input = parseBody(addPersonSchema, req.body);
    await services.cards.addPerson(currentBoard(res), currentUser(req).id, parseId(req.params.cardId), input);
    res.status(204).end();
  });

  board.delete("/cards/:cardId/people/:personId", async (req, res) => {
    await services.cards.removePerson(
      currentBoard(res),
      currentUser(req).id,
      parseId(req.params.cardId),
      parseId(req.params.personId),
    );
    res.status(204).end();
  });

  board.get("/cards/:cardId/audit", async (req, res) => {
    const cardId = parseId(req.params.cardId);
    const boardId = currentBoard(res).id;
    const [card] = await db
      .select({ id: cards.id })
      .from(cards)
      .where(and(eq(cards.id, cardId), eq(cards.boardId, boardId)));
    if (!card) throw notFound("Thema nicht gefunden.");
    res.json(await services.audit.card(boardId, cardId));
  });

  board.post("/meetings/current/start", async (req, res) => {
    const { version } = parseBody(meetingVersionSchema, req.body);
    await services.meetings.start(currentBoard(res), currentUser(req).id, version);
    res.status(204).end();
  });

  board.post("/meetings/current/end", async (req, res) => {
    const { version } = parseBody(meetingVersionSchema, req.body);
    res.json(await services.meetings.end(currentBoard(res), currentUser(req).id, version));
  });

  board.patch("/meetings/current/roles", async (req, res) => {
    const input = parseBody(setRolesSchema, req.body);
    await services.meetings.setRoles(currentBoard(res), currentUser(req).id, input);
    res.status(204).end();
  });

  board.get("/meetings", async (_req, res) => {
    res.json(await services.meetings.history(currentBoard(res)));
  });

  board.get("/participants", async (_req, res) => {
    res.json(await services.participants.list(currentBoard(res)));
  });

  board.patch("/participants/:userId", async (req, res) => {
    const { active } = parseBody(setParticipantSchema, req.body);
    await services.participants.setActive(currentBoard(res), currentUser(req).id, parseId(req.params.userId), active);
    res.status(204).end();
  });

  board.get("/audit", async (req, res) => {
    const query = parseBody(auditQuerySchema, req.query);
    res.json(await services.audit.list(currentBoard(res).id, query));
  });

  board.get("/events", (req, res) => {
    hub.connect(currentBoard(res).id, {
      res,
      user: currentUser(req),
      isSessionValid: sessionStillValid(req),
    });
  });

  api.use((_req, _res) => {
    throw notFound();
  });

  return api;
}
