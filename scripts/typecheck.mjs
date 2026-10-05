import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const tsc = resolve(root, "node_modules/typescript/bin/tsc");
const result = spawnSync(
  process.execPath,
  [tsc, "--project", resolve(root, "tsconfig.check.json")],
  { cwd: root, stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Strict TypeScript typecheck passed.");
