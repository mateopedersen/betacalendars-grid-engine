import test from "node:test";
import assert from "node:assert/strict";
import { createDate, formatDate } from "../dist/civil.js";
import { endOfWeek, getISOWeek, startOfWeek } from "../dist/week.js";

test("ISO week-year boundary examples", () => {
  const expected = new Map([
    ["2018-12-31", "2019-W01"],
    ["2021-01-01", "2020-W53"],
    ["2021-01-04", "2021-W01"],
    ["2027-01-01", "2026-W53"],
    ["2027-01-04", "2027-W01"],
  ]);
  for (const [iso, label] of expected) {
    const result = getISOWeek(createDate(...iso.split("-").map(Number)));
    assert.equal(
      `${result.weekYear}-W${String(result.week).padStart(2, "0")}`,
      label,
    );
  }
});

test("week boundaries are civil-date arithmetic", () => {
  const date = createDate(2027, 8, 18);
  assert.equal(
    formatDate(startOfWeek(date, { weekStartsOn: 1 })),
    "2027-08-16",
  );
  assert.equal(formatDate(endOfWeek(date, { weekStartsOn: 1 })), "2027-08-22");
  assert.equal(
    formatDate(startOfWeek(date, { weekStartsOn: 0 })),
    "2027-08-15",
  );
  assert.equal(formatDate(endOfWeek(date, { weekStartsOn: 0 })), "2027-08-21");
});
