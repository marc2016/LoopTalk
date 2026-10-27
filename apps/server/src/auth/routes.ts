import { Router, type Request } from "express";
import type { Executor } from "../db/client";
import { users } from "../db/schema";
import type { OidcClient } from "./oidc";

/** Nur relative Pfade derselben Anwendung, sonst Startseite (Schutz vor Open Redirect). */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  if (value.startsWith("/auth/")) return "/";
  return value;
}

function regenerate(req: Request): Promise<void> {
  return new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));
}

function save(req: Request): Promise<void> {
  return new Promise((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
}

const page = (title: string, body: string) => `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} – LoopTalk</title>
<style>body{font-family:system-ui,sans-serif;background:#f8fafc;color:#1e293b;display:grid;place-items:center;min-height:100vh;margin:0}
main{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:2rem 2.5rem;max-width:26rem;box-shadow:0 1px 3px rgb(0 0 0/.06)}
h1{font-size:1.25rem;margin:0 0 .75rem}a{display:inline-block;margin-top:1rem;background:#2f5fc4;color:#fff;padding:.5rem 1rem;border-radius:8px;text-decoration:none}</style>
</head><body><main><h1>${title}</h1>${body}</main></body></html>`;

export function authRoutes(opts: { oidc: OidcClient; db: Executor; baseUrl: string }): Router {
  const router = Router();
  const redirectUri = new URL("/auth/callback", opts.baseUrl).toString();

  router.get("/login", async (req, res, next) => {
    try {
      const { url, checks } = await opts.oidc.start(redirectUri);
      req.session.login = { ...checks, returnTo: safeReturnTo(req.query.returnTo) };
      await save(req);
      res.redirect(url.toString());
    } catch (err) {
      next(err);
    }
  });

  router.get("/callback", async (req, res) => {
    const login = req.session.login;
    try {
      if (!login) throw new Error("Kein Login gestartet.");
      const currentUrl = new URL(req.originalUrl, opts.baseUrl);
      const claims = await opts.oidc.finish(currentUrl, login);

      const [user] = await opts.db
        .insert(users)
        .values({ oidcSub: claims.sub, name: claims.name, email: claims.email })
        .onConflictDoUpdate({ target: users.oidcSub, set: { name: claims.name, email: claims.email } })
        .returning({ id: users.id, name: users.name });

      // Neue Session-ID nach dem Login gegen Session Fixation.
      await regenerate(req);
      req.session.user = user!;
      await save(req);
      res.redirect(login.returnTo);
    } catch (err) {
      req.session.login = undefined;
      console.warn("Login fehlgeschlagen:", err instanceof Error ? err.message : err);
      res
        .status(400)
        .send(page("Anmeldung fehlgeschlagen", "<p>Die Anmeldung konnte nicht abgeschlossen werden.</p><a href=\"/auth/login\">Erneut anmelden</a>"));
    }
  });

  router.get("/logout", (req, res, next) => {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("looptalk.sid");
      res.redirect("/auth/logged-out");
    });
  });

  router.get("/logged-out", (_req, res) => {
    res.send(page("Abgemeldet", "<p>Du bist von LoopTalk abgemeldet.</p><a href=\"/auth/login\">Erneut anmelden</a>"));
  });

  return router;
}
