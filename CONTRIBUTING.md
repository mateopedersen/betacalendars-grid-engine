# Contributing

Use Node.js 22.14 or newer. The library has no runtime dependencies. TypeScript, esbuild, fast-check, ESLint, and Prettier are development dependencies.

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm run benchmark
```

The checks run strict type checking, lint, formatting, unit and property tests, build the distributable, and smoke-test the packed files.

Keep civil-date calculations independent of local timezone behavior. Public API changes follow SemVer: fixes are patches, backward-compatible additions are minors, and breaking changes are majors. Update `CHANGELOG.md` with each release. Benchmarks are for observation; no machine-specific speed threshold is enforced.
