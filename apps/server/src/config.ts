import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  /** Öffentliche URL der App, z. B. https://looptalk.example.com */
  BASE_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET muss mindestens 32 Zeichen lang sein."),
  DEX_ISSUER: z.url(),
  /**
   * Optional: interne Adresse von Dex, falls der Server Dex nicht unter der
   * öffentlichen Issuer-URL erreicht (z. B. im Docker-Netz `http://dex:5556`).
   */
  DEX_INTERNAL_URL: z.url().optional(),
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(1),
  /** Verzeichnis mit dem gebauten Frontend; leer in der Entwicklung (Vite liefert aus). */
  STATIC_DIR: z.string().optional(),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Leere Variablen (z. B. aus Compose `${VAR:-}`) gelten als nicht gesetzt.
  const defined = Object.fromEntries(Object.entries(env).filter(([, value]) => value !== ""));
  const parsed = envSchema.safeParse(defined);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Ungültige Konfiguration:\n${issues}`);
  }
  return parsed.data;
}
