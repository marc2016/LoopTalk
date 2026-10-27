import type { UserRef } from "@looptalk/shared";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import type pg from "pg";
import type { LoginChecks } from "./oidc";

declare module "express-session" {
  interface SessionData {
    user?: UserRef;
    login?: LoginChecks & { returnTo: string };
  }
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function sessionMiddleware(opts: { pool: pg.Pool; secret: string; secure: boolean }) {
  const PgStore = connectPgSimple(session);
  return session({
    name: "looptalk.sid",
    store: new PgStore({
      pool: opts.pool,
      tableName: "session",
      createTableIfMissing: false,
      // Abgelaufene Sessions alle 15 Minuten löschen; in Tests nicht (Pool wird pro Datei geschlossen).
      pruneSessionInterval: process.env.NODE_ENV === "test" ? false : 15 * 60,
    }),
    secret: opts.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { httpOnly: true, secure: opts.secure, sameSite: "lax", maxAge: SEVEN_DAYS },
  });
}
