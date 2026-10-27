import pg from "pg";
import { createDb } from "../src/db/client";
import { runMigrations } from "../src/db/migrations";
import { adminUrl, databaseUrl, TEMPLATE_DB } from "./db";

/** Legt einmal pro Testlauf eine migrierte Vorlage an, aus der jede Testdatei ihre eigene Datenbank kopiert. */
export default async function setup() {
  const admin = new pg.Client({ connectionString: adminUrl() });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEMPLATE_DB}`);
  await admin.end();

  const { db, pool } = createDb(databaseUrl(TEMPLATE_DB));
  await runMigrations(db);
  await pool.end();
}
