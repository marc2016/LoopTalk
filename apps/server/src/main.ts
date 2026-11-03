import { createDexClient } from "./auth/oidc";
import { loadConfig } from "./config";
import { createDb } from "./db/client";
import { runMigrations } from "./db/migrations";
import { waitForDatabase } from "./db/wait";
import { createApp } from "./http/app";
import { RealtimeHub } from "./realtime/hub";
import { createServices } from "./services";

const config = loadConfig();
const { db, pool } = createDb(config.DATABASE_URL);

// Erst die Datenbank, dann Dex: Ohne aktuelles Schema nimmt der Server keine Anfragen an.
try {
  await waitForDatabase(pool);
  if (config.MIGRATE_ON_START) {
    await runMigrations(db);
    console.log("Migrationen ausgeführt.");
  }
} catch (err) {
  console.error(err);
  await pool.end().catch(() => {});
  process.exit(1);
}

const hub = new RealtimeHub();
const services = createServices({ db, notifier: hub, rng: Math.random, now: () => new Date() });

async function connectDex(attempts = 30) {
  for (let i = 1; ; i++) {
    try {
      return await createDexClient(config);
    } catch (err) {
      if (i >= attempts) throw err;
      console.warn(`Dex noch nicht erreichbar (${i}/${attempts}), neuer Versuch in 2 s …`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}
const oidc = await connectDex();

const app = createApp({
  db,
  pool,
  services,
  hub,
  oidc,
  baseUrl: config.BASE_URL,
  sessionSecret: config.SESSION_SECRET,
  staticDir: config.STATIC_DIR,
});

const server = app.listen(config.PORT, () => {
  console.log(`LoopTalk läuft auf Port ${config.PORT} (${config.BASE_URL})`);
});

function shutdown() {
  hub.close();
  server.close(() => void pool.end().then(() => process.exit(0)));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
