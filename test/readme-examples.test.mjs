import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMonthGrid,
  buildYearMatrix,
  createDate,
  createMonthPrintLayout,
  endOfWeek,
  formatDate,
  getISOWeek,
  startOfWeek,
  validateMonthGrid,
} from "../dist/index.js";

test("README code examples match the package API", () => {
  const february = buildMonthGrid({
    year: 2027,
    month: 2,
    weekStartsOn: 1,
    outsideDays: "previous-next",
  });
  assert.equal(february.naturalRows, 4);
  assert.equal(validateMonthGrid(february).valid, true);
  const year = buildYearMatrix(2027, { weekStartsOn: 1 });
  assert.equal(year.months[0].name, "January");
  const date = createDate(2027, 1, 1);
  assert.deepEqual(getISOWeek(date), { week: 53, weekYear: 2026, weekday: 5 });
  assert.equal(
    formatDate(startOfWeek(createDate(2027, 8, 18), { weekStartsOn: 1 })),
    "2027-08-16",
  );
  assert.equal(
    formatDate(endOfWeek(createDate(2027, 8, 18), { weekStartsOn: 1 })),
    "2027-08-22",
  );
  assert.equal(
    createMonthPrintLayout({
      year: 2027,
      month: 2,
      paper: "A4",
      orientation: "landscape",
      weekStartsOn: 1,
    }).rowCount,
    4,
  );
});
