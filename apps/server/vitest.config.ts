import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: { name: "unit", include: ["src/**/*.test.ts"] },
      },
      {
        // Läuft gegen eine echte PostgreSQL (TEST_DATABASE_URL), siehe compose.test.yaml.
        test: {
          name: "integration",
          include: ["test/**/*.test.ts"],
          globalSetup: ["test/global-setup.ts"],
          testTimeout: 20_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
