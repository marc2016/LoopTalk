import { readFileSync } from "node:fs";

/**
 * Version der laufenden App aus `apps/server/package.json`. Der Pfad ist relativ zu
 * diesem Modul: `src/version.ts` in der Entwicklung, das gebündelte `dist/*.js` im
 * Image (dort liegt `package.json` neben `dist/`).
 */
export const appVersion: string = (
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string }
).version;
