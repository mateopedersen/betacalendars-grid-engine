import test from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import {
  addDays,
  createDate,
  dayOfWeek,
  formatDate,
  parseDate,
} from "../dist/civil.js";
import { buildMonthGrid } from "../dist/grid.js";

test("deterministic generated civil-date properties across the supported range", () => {
  let state = 0x51f15e;
  const random = (max) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % max;
  };
  for (let i = 0; i < 1200; i++) {
    const year = 1 + random(9999),
      month = 1 + random(12);
    const first = createDate(year, month, 1);
    const date = addDays(
      first,
      random(
        new Date(
          Date.UTC(year < 100 ? year + 1900 : year, month, 0),
        ).getUTCDate(),
      ),
    );
    const next = addDays(date, 1);
    assert.equal(dayOfWeek(next), (dayOfWeek(date) + 1) % 7);
    assert.equal(formatDate(parseDate(formatDate(date))), formatDate(date));
    const start = random(7);
    assert.equal(
      buildMonthGrid({ year, month, weekStartsOn: start }).invariants.valid,
      true,
    );
  }
});

test("fast-check properties hold for generated valid civil dates", () => {
  const yearMonthArb = fc.tuple(
    fc.integer({ min: 1, max: 9999 }),
    fc.integer({ min: 1, max: 12 }),
  );
  const dateArb = yearMonthArb.chain(([year, month]) =>
    fc
      .integer({
        min: 1,
        max: new Date(
          Date.UTC(year < 100 ? year + 1900 : year, month, 0),
        ).getUTCDate(),
      })
      .map((day) => createDate(year, month, day)),
  );
  fc.assert(
    fc.property(dateArb, (date) => {
      const next = addDays(date, 1);
      assert.equal(dayOfWeek(next), (dayOfWeek(date) + 1) % 7);
      assert.deepEqual(parseDate(formatDate(date)), date);
    }),
    { numRuns: 1200, seed: 20271005 },
  );
});
