import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const eslint = resolve(root, "node_modules/eslint/bin/eslint.js");
const result = spawnSync(
  process.execPath,
  [eslint, "src", "test", "scripts", "benchmarks", "examples"],
  { cwd: root, stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
