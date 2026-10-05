import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const prettier = resolve(root, "node_modules/prettier/bin/prettier.cjs");
const result = spawnSync(process.execPath, [prettier, "--check", "."], {
  cwd: root,
  stdio: "inherit",
});
if (result.status !== 0) process.exit(result.status ?? 1);
