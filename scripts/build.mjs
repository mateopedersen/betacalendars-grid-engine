import { spawnSync } from "node:child_process";
import { chmod, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const tsc = resolve(root, "node_modules/typescript/bin/tsc");
const typeBuild = spawnSync(
  process.execPath,
  [tsc, "--project", resolve(root, "tsconfig.json")],
  { cwd: root, stdio: "inherit" },
);
if (typeBuild.status !== 0) process.exit(typeBuild.status ?? 1);
const dist = resolve(root, "dist");
await mkdir(dist, { recursive: true });
const entries = [
  "index",
  "civil",
  "grid",
  "week",
  "print",
  "validation",
  "fixtures",
  "cli",
];
await build({
  absWorkingDir: root,
  entryPoints: Object.fromEntries(
    entries.map((name) => [name, `src/${name}.ts`]),
  ),
  outdir: dist,
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  sourcemap: true,
  packages: "external",
  entryNames: "[name]",
  treeShaking: true,
  logLevel: "warning",
});
await build({
  absWorkingDir: root,
  entryPoints: ["src/index.ts"],
  outfile: resolve(dist, "index.cjs"),
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node22.14",
  sourcemap: true,
  packages: "external",
  logLevel: "warning",
});
await chmod(resolve(dist, "cli.js"), 0o755);
console.log("Built ESM entries, CommonJS entry, and TypeScript declarations.");
