import { spawnSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const temp = await mkdtemp(join(tmpdir(), "betacal-pack-"));
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const packageRoot = join(temp, "package");
try {
  await mkdir(packageRoot, { recursive: true });
  for (const item of pkg.files)
    await cp(join(root, item), join(packageRoot, item), { recursive: true });
  await cp(join(root, "package.json"), join(packageRoot, "package.json"));
  const tarball = join(
    temp,
    `${pkg.name.replaceAll("/", "-")}-${pkg.version}.tgz`,
  );
  const packed = spawnSync("tar", ["-czf", tarball, "-C", temp, "package"], {
    encoding: "utf8",
  });
  if (packed.status !== 0) throw new Error(packed.stderr);
  await rm(packageRoot, { recursive: true, force: true });
  const unpacked = spawnSync("tar", ["-xzf", tarball, "-C", temp], {
    encoding: "utf8",
  });
  if (unpacked.status !== 0) throw new Error(unpacked.stderr);
  const installPath = join(temp, "node_modules", pkg.name);
  await mkdir(dirname(installPath), { recursive: true });
  await rename(packageRoot, installPath);

  const esmSmoke = `import assert from 'node:assert/strict';\nimport { buildMonthGrid, validateMonthGrid } from '${pkg.name}';\nimport { formatDate } from '${pkg.name}/civil';\nconst grid=buildMonthGrid({year:2027,month:2,weekStartsOn:1});\nassert.equal(grid.naturalRows,4);\nassert.equal(validateMonthGrid(grid).valid,true);\nassert.equal(formatDate(grid.weeks[0][0].date),'2027-02-01');\n`;
  const esmPath = join(temp, "smoke.mjs");
  await writeFile(esmPath, esmSmoke);
  let result = spawnSync(process.execPath, [esmPath], {
    cwd: temp,
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(result.stderr || "Packed ESM import failed");

  const cjsPath = join(temp, "smoke.cjs");
  await writeFile(
    cjsPath,
    `const assert=require('node:assert/strict'); const pkg=require('${pkg.name}'); const grid=pkg.buildMonthGrid({year:2027,month:2,weekStartsOn:1}); assert.equal(grid.naturalRows,4); assert.equal(pkg.validateMonthGrid(grid).valid,true);`,
  );
  result = spawnSync(process.execPath, [cjsPath], {
    cwd: temp,
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(result.stderr || "Packed CommonJS import failed");

  const cliPath = join(installPath, pkg.bin.betacal);
  result = spawnSync(
    process.execPath,
    [cliPath, "month", "2027", "2", "--json"],
    { cwd: temp, encoding: "utf8" },
  );
  if (result.status !== 0 || JSON.parse(result.stdout).naturalRows !== 4)
    throw new Error(result.stderr || "Packed CLI failed");

  const typecheck = join(temp, "consumer.ts");
  const config = join(temp, "tsconfig.json");
  await writeFile(
    typecheck,
    `import { buildMonthGrid, validateMonthGrid } from '${pkg.name}'; const grid=buildMonthGrid({year:2027,month:2,weekStartsOn:1}); const valid: boolean=validateMonthGrid(grid).valid; void valid;`,
  );
  await writeFile(
    config,
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        noEmit: true,
      },
      files: ["consumer.ts"],
    }),
  );
  const tsc = resolve(root, "node_modules/typescript/bin/tsc");
  result = spawnSync(process.execPath, [tsc, "--project", config], {
    cwd: temp,
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(
      result.stdout + result.stderr || "Packed TypeScript declarations failed",
    );

  const details = await stat(tarball);
  console.log(
    `Packed tarball smoke passed (${pkg.name}@${pkg.version}, ESM/CJS, CLI, subpath exports, declarations; ${(details.size / 1024).toFixed(1)} KiB).`,
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
