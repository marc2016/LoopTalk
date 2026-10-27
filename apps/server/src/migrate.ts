import { createDb } from "./db/client";
import { runMigrations } from "./db/migrations";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL fehlt.");
  process.exit(1);
}

const { db, pool } = createDb(url);
try {
  await runMigrations(db);
  console.log("Migrationen ausgeführt.");
} finally {
  await pool.end();
}
