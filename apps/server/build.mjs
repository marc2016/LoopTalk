import { readFileSync } from "node:fs";
import { build } from "esbuild";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
// Workspace-Pakete werden eingebunden, alle anderen Abhängigkeiten bleiben extern.
const external = Object.keys(pkg.dependencies ?? {}).filter((name) => !name.startsWith("@looptalk/"));

await build({
  entryPoints: ["src/main.ts", "src/migrate.ts"],
  outdir: "dist",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: true,
  external,
});
