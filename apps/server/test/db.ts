import { randomBytes } from "node:crypto";
import pg from "pg";
import { createDb, type Db } from "../src/db/client";

export const TEMPLATE_DB = "looptalk_test_template";

export function adminUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL fehlt (z. B. postgres://looptalk:looptalk@localhost:5432/postgres).");
  return url;
}

export function databaseUrl(name: string): string {
  const url = new URL(adminUrl());
  url.pathname = `/${name}`;
  return url.toString();
}

export interface TestDb {
  db: Db;
  pool: pg.Pool;
  drop(): Promise<void>;
}

/** Eigene Datenbank pro Testdatei, kopiert aus der migrierten Vorlage. */
export async function createTestDb(): Promise<TestDb> {
  const name = `looptalk_test_${randomBytes(6).toString("hex")}`;
  const admin = new pg.Client({ connectionString: adminUrl() });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${name} TEMPLATE ${TEMPLATE_DB}`);
  await admin.end();

  const { db, pool } = createDb(databaseUrl(name));
  return {
    db,
    pool,
    async drop() {
      await pool.end();
      const c = new pg.Client({ connectionString: adminUrl() });
      await c.connect();
      await c.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await c.end();
    },
  };
}
