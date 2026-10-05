import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWinterRolloverFixture,
  runConformanceSuite,
  runGregorianConformanceSuite,
} from "../dist/fixtures.js";

test("conformance suites cover requested century and month geometry cases", () => {
  assert.equal(runGregorianConformanceSuite().valid, true);
  const report = runConformanceSuite();
  assert.equal(
    report.valid,
    true,
    report.cases
      .filter((item) => !item.valid)
      .map((item) => item.name)
      .join("\n"),
  );
  assert.ok(report.cases.length > 140);
});

test("winter fixture includes consecutive year and month transitions", () => {
  const fixture = buildWinterRolloverFixture(2026);
  assert.deepEqual(
    fixture.months.map((month) => [month.year, month.month]),
    [
      [2026, 11],
      [2026, 12],
      [2027, 1],
      [2027, 2],
    ],
  );
  assert.ok(fixture.transitions.every((item) => item.consecutive));
  assert.deepEqual(fixture.weekStarts, [0, 1]);
});
