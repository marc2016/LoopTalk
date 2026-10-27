import fs from "node:fs";
import path from "node:path";
import type { ApiErrorBody } from "@looptalk/shared";
import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import type pg from "pg";
import type { OidcClient } from "../auth/oidc";
import { authRoutes } from "../auth/routes";
import { sessionMiddleware } from "../auth/session";
import type { Db } from "../db/client";
import { AppError } from "../errors";
import type { RealtimeHub } from "../realtime/hub";
import type { Services } from "../services";
import { apiRoutes } from "./api";

export interface AppDeps {
  db: Db;
  pool: pg.Pool;
  services: Services;
  hub: RealtimeHub;
  oidc: OidcClient;
  baseUrl: string;
  sessionSecret: string;
  staticDir?: string;
}

/**
 * Ohne Session ist nur `/auth/*` und `/healthz` erreichbar. API-Aufrufe erhalten
 * 401, alle anderen Pfade (auch statische Dateien) werden zum Login umgeleitet.
 */
const requireLogin: RequestHandler = (req, res, next) => {
  if (req.session.user) return next();
  if (req.path === "/api" || req.path.startsWith("/api/")) {
    const body: ApiErrorBody = { error: { code: "unauthorized", message: "Bitte anmelden." } };
    res.status(401).json(body);
    return;
  }
  res.redirect(`/auth/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
};

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let body: ApiErrorBody = { error: { code: "internal", message: "Interner Fehler." } };
  if (err instanceof AppError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message } };
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    body = { error: { code: "bad_request", message: "Ungültiges JSON." } };
  } else {
    console.error(err);
  }
  if (res.headersSent) return;
  res.status(status).json(body);
};

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.get("/healthz", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(
    sessionMiddleware({
      pool: deps.pool,
      secret: deps.sessionSecret,
      secure: deps.baseUrl.startsWith("https://"),
    }),
  );
  app.use("/auth", authRoutes({ oidc: deps.oidc, db: deps.db, baseUrl: deps.baseUrl }));

  app.use(requireLogin);
  app.use("/api", express.json({ limit: "100kb" }), apiRoutes(deps));

  if (deps.staticDir) {
    const staticDir = path.resolve(deps.staticDir);
    const indexHtml = path.join(staticDir, "index.html");
    app.use(express.static(staticDir, { index: false, maxAge: "1h" }));
    // Single-Page-App: unbekannte Pfade liefern index.html, React Router übernimmt.
    app.get("/{*path}", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.send(fs.readFileSync(indexHtml, "utf8"));
    });
  }

  app.use(errorHandler);
  return app;
}
