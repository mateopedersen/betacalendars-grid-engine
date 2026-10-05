import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);
const commands = [
  "typecheck",
  "lint",
  "format:check",
  "build",
  "test",
  "pack:smoke",
];
for (const name of commands) {
  const command = manifest.scripts[name];
  const match = /^node(?: (.*))?$/.exec(command);
  if (!match) throw new Error(`Unsupported check command: ${command}`);
  const args = (match[1] ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => (part.endsWith(".mjs") ? resolve(root, part) : part));
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
