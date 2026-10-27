import { createDexClient } from "./auth/oidc";
import { loadConfig } from "./config";
import { createDb } from "./db/client";
import { createApp } from "./http/app";
import { RealtimeHub } from "./realtime/hub";
import { createServices } from "./services";

const config = loadConfig();
const { db, pool } = createDb(config.DATABASE_URL);
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
