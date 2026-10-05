import test from "node:test";
import assert from "node:assert/strict";
import {
  createMonthPrintLayout,
  createPrintCSS,
  renderMonthSVG,
  renderYearSVG,
} from "../dist/print.js";

test("A4 landscape print geometry fits the available page", () => {
  const layout = createMonthPrintLayout({
    year: 2027,
    month: 2,
    paper: "A4",
    orientation: "landscape",
    weekStartsOn: 1,
  });
  assert.equal(layout.page.width, 297);
  assert.ok(layout.cellWidth > 0 && layout.cellHeight > 0);
  assert.ok(
    layout.calendar.x + layout.calendar.width <= layout.page.width - 11.99,
  );
  assert.equal(layout.rowCount, 4);
  assert.match(
    createPrintCSS({ paper: "A4", orientation: "landscape" }),
    /@page/,
  );
});

test("SVG output is deterministic and self contained", () => {
  const options = {
    year: 2027,
    month: 2,
    weekStartsOn: 1,
    showAdjacentDays: true,
    showWeekNumbers: true,
  };
  const svg = renderMonthSVG(options);
  assert.equal(svg, renderMonthSVG(options));
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.equal((svg.match(/data-date=/g) ?? []).length, 28);
  assert.doesNotMatch(svg, /<script|(?:href|xlink:href)="https?:/i);
  assert.match(renderYearSVG(2027), /2027 calendar year matrix/);
});

test("print configuration rejects invalid dimensions and margins", () => {
  assert.throws(
    () => createMonthPrintLayout({ year: 2027, month: 1, margins: 200 }),
    RangeError,
  );
  assert.throws(
    () => renderMonthSVG({ year: 2027, month: 1, width: 0 }),
    RangeError,
  );
  assert.throws(() => createPrintCSS({ margins: "auto" }), RangeError);
});
