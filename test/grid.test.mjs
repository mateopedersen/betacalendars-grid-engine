import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMonthGrid,
  buildYearMatrix,
  validateMonthGrid,
  validateYearMatrix,
} from "../dist/index.js";

test("named 2027 row-count regressions", () => {
  assert.equal(
    buildMonthGrid({ year: 2027, month: 2, weekStartsOn: 1 }).naturalRows,
    4,
  );
  assert.equal(
    buildMonthGrid({ year: 2027, month: 8, weekStartsOn: 1 }).naturalRows,
    6,
  );
  assert.equal(
    buildMonthGrid({ year: 2027, month: 8, weekStartsOn: 0 }).naturalRows,
    5,
  );
  assert.equal(
    buildMonthGrid({ year: 2027, month: 10, weekStartsOn: 0 }).naturalRows,
    6,
  );
  for (const start of [0, 1])
    assert.equal(
      buildMonthGrid({ year: 2027, month: 5, weekStartsOn: start }).naturalRows,
      6,
    );
});

test("2027 month starts and row counts match independent UTC oracle", () => {
  const mondayRows = [5, 4, 5, 5, 6, 5, 5, 6, 5, 5, 5, 5];
  const sundayRows = [6, 5, 5, 5, 6, 5, 5, 5, 5, 6, 5, 5];
  for (let month = 1; month <= 12; month++) {
    const oracle = new Date(Date.UTC(2027, month - 1, 1)).getUTCDay();
    const monday = buildMonthGrid({ year: 2027, month, weekStartsOn: 1 });
    const sunday = buildMonthGrid({ year: 2027, month, weekStartsOn: 0 });
    assert.equal(monday.firstWeekday, oracle);
    assert.equal(monday.naturalRows, mondayRows[month - 1]);
    assert.equal(sunday.naturalRows, sundayRows[month - 1]);
    assert.equal(validateMonthGrid(monday).valid, true);
    assert.equal(validateMonthGrid(sunday).valid, true);
  }
  assert.equal(validateYearMatrix(buildYearMatrix(2027)).valid, true);
});

test("outside-day modes, fixed rows, and custom weekend data", () => {
  const grid = buildMonthGrid({
    year: 2027,
    month: 2,
    weekStartsOn: 1,
    fixedRows: 5,
    outsideDays: "none",
    weekend: [5, 6],
  });
  assert.equal(grid.renderedRows, 5);
  assert.ok(grid.weeks.flat().some((cell) => cell.relation === "empty"));
  assert.equal(
    grid.weeks.flat().find((cell) => cell.iso === "2027-02-05").isWeekend,
    true,
  );
  assert.throws(
    () =>
      buildMonthGrid({ year: 2027, month: 5, weekStartsOn: 1, fixedRows: 5 }),
    RangeError,
  );
  assert.throws(
    () => buildMonthGrid({ year: 2027, month: 1, weekStartsOn: 7 }),
    RangeError,
  );
});

test("every month from 1800 through 2200 stays complete for Monday and Sunday starts", () => {
  for (let year = 1800; year <= 2200; year++)
    for (let month = 1; month <= 12; month++)
      for (const weekStartsOn of [0, 1]) {
        const grid = buildMonthGrid({ year, month, weekStartsOn });
        assert.equal(
          grid.invariants.valid,
          true,
          `${year}-${month} start=${weekStartsOn}: ${grid.invariants.errors.join(",")}`,
        );
        assert.equal(
          grid.weeks.flat().filter((cell) => cell.inCurrentMonth).length,
          grid.daysInMonth,
        );
      }
});

test("year edges keep the promised 0001 through 9999 range", () => {
  assert.equal(
    buildMonthGrid({ year: 1, month: 1, weekStartsOn: 1 }).invariants.valid,
    true,
  );
  assert.equal(
    buildMonthGrid({ year: 9999, month: 12, weekStartsOn: 1 }).invariants.valid,
    true,
  );
});
