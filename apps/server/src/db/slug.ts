import { randomBytes } from "node:crypto";

/** Öffentliche Board-Kennung: 128 Bit Zufall, Base64url (22 Zeichen), nicht erratbar. */
export function createBoardSlug(): string {
  return randomBytes(16).toString("base64url");
}
