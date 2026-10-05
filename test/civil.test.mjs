import test from "node:test";
import assert from "node:assert/strict";
import * as c from "../dist/civil.js";

test("Gregorian leap-year century cases", () => {
  for (const [year, expected] of [
    [1900, false],
    [2000, true],
    [2027, false],
    [2028, true],
    [2100, false],
    [2400, true],
  ])
    assert.equal(c.isLeapYear(year), expected);
});

test("civil parsing and date arithmetic round trip", () => {
  const date = c.parseDate("2027-08-01");
  assert.equal(c.formatDate(date), "2027-08-01");
  assert.equal(c.formatDate(c.addDays(date, -1)), "2027-07-31");
  assert.equal(c.differenceInDays(c.addDays(date, 33), date), 33);
  assert.equal(c.dayOfWeek(date), 0);
  assert.equal(c.dayOfYear(c.createDate(2028, 3, 1)), 61);
  assert.equal(c.quarterOfYear(c.createDate(2028, 3, 1)), 1);
});

test("month and year additions have explicit overflow behavior", () => {
  assert.equal(
    c.formatDate(c.addMonths(c.createDate(2027, 1, 31), 1)),
    "2027-02-28",
  );
  assert.throws(
    () => c.addMonths(c.createDate(2027, 1, 31), 1, { overflow: "reject" }),
    RangeError,
  );
  assert.throws(
    () => c.addMonths(c.createDate(2027, 1, 1), 1, { overflow: "invalid" }),
    RangeError,
  );
  assert.equal(
    c.formatDate(c.addYears(c.createDate(2028, 2, 29), 1)),
    "2029-02-28",
  );
  assert.throws(() => c.parseDate("2027-02-29"), RangeError);
  assert.throws(() => c.parseDate("2027-13-01"), RangeError);
});

test("supported date range is inclusive and immutable", () => {
  assert.equal(c.formatDate(c.createDate(1, 1, 1)), "0001-01-01");
  assert.equal(c.formatDate(c.createDate(9999, 12, 31)), "9999-12-31");
  assert.throws(() => c.addDays(c.createDate(1, 1, 1), -1), RangeError);
  const input = { year: 2027, month: 4, day: 5 };
  c.addDays(input, 1);
  assert.deepEqual(input, { year: 2027, month: 4, day: 5 });
});
