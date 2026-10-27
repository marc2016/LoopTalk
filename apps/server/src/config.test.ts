import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

const env = {
  BASE_URL: "https://looptalk.example.com",
  DATABASE_URL: "postgres://u:p@db/looptalk",
  SESSION_SECRET: "x".repeat(32),
  DEX_ISSUER: "https://dex.example.com/dex",
  OIDC_CLIENT_ID: "looptalk",
  OIDC_CLIENT_SECRET: "geheim",
};

describe("loadConfig", () => {
  it("behandelt leere optionale Variablen als nicht gesetzt", () => {
    const config = loadConfig({ ...env, DEX_INTERNAL_URL: "", STATIC_DIR: "" });
    expect(config.DEX_INTERNAL_URL).toBeUndefined();
    expect(config.STATIC_DIR).toBeUndefined();
    expect(config.PORT).toBe(3000);
  });

  it("nennt fehlende und ungültige Werte", () => {
    const load = () => loadConfig({ ...env, SESSION_SECRET: "kurz", BASE_URL: "" });
    expect(load).toThrow(/SESSION_SECRET: SESSION_SECRET muss mindestens 32 Zeichen lang sein/);
    expect(load).toThrow(/BASE_URL:/);
  });
});
