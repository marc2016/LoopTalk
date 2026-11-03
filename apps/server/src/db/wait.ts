import type pg from "pg";

export interface WaitOptions {
  attempts?: number;
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  log?: (message: string) => void;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Wartet, bis PostgreSQL Verbindungen annimmt (Standard: 30 Versuche im Abstand von
 * 2 s, also etwa 60 s). Danach wird mit „Datenbank nicht erreichbar“ abgebrochen.
 */
export async function waitForDatabase(pool: Pick<pg.Pool, "query">, options: WaitOptions = {}): Promise<void> {
  const { attempts = 30, delayMs = 2000, sleep = defaultSleep, log = console.warn } = options;
  for (let i = 1; ; i++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      if (i >= attempts) {
        throw new Error(`Datenbank nicht erreichbar nach ${attempts} Versuchen.`, { cause: err });
      }
      log(`Datenbank noch nicht erreichbar (${i}/${attempts}), neuer Versuch in ${delayMs / 1000} s …`);
      await sleep(delayMs);
    }
  }
}
