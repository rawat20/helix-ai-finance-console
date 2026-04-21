/**
 * Always run `next dev` with cwd = frontend/, even when npm is invoked from the repo root
 * (fixes Tailwind / PostCSS resolving from the wrong `node_modules`).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const result = spawnSync("npx", ["next", "dev", "--webpack"], {
  stdio: "inherit",
  cwd: frontendDir,
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 0);
