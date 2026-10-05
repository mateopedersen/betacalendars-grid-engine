# Beta Calendars Grid Engine

Beta Calendars Grid Engine is a headless TypeScript library for deterministic Gregorian date-only arithmetic, month and year grid geometry, ISO week boundaries, print layouts, SVG output, and conformance checks. It is designed for applications that need calendar cells as civil dates without accidentally applying local timezones.

## Why this exists

A civil date such as `2027-08-01` is not a timestamp. Converting it to local midnight and mutating JavaScript `Date` objects can move it across a day when the timezone changes. This library uses integer Gregorian arithmetic for its date calculations. Month grids also have real geometry: row counts depend on the month and selected first weekday. ISO week-years can differ from calendar years, and print layouts need physical page dimensions.

## Features

- Civil dates from `0001-01-01` through `9999-12-31`, with explicit month/year overflow behavior.
- Month grids with natural four, five, or six row layouts and optional fixed rows.
- Twelve-month year matrices with first weekday and row summaries.
- ISO week and locale week-information helpers.
- Pure week-boundary helpers and grid invariant validation.
- A4 and Letter print geometry, self-contained SVG, and print CSS generation.
- Machine-readable Gregorian conformance reports and winter rollover fixtures.
- A `betacal` CLI and a static HTML year generator example.
- Zero runtime dependencies. Core imports make no network or filesystem requests.

## Install

```sh
npm install betacalendars-grid-engine
pnpm add betacalendars-grid-engine
yarn add betacalendars-grid-engine
```

Node.js 22.12 or newer is required. The package exports ESM, a CommonJS compatibility entry, TypeScript declarations, and documented subpaths.

## Quick start

```ts
import { buildMonthGrid, validateMonthGrid } from "betacalendars-grid-engine";

const february = buildMonthGrid({
  year: 2027,
  month: 2,
  weekStartsOn: 1,
  outsideDays: "previous-next",
});

console.log(february.naturalRows); // 4
console.log(validateMonthGrid(february).valid); // true
```

## Civil dates

`CivilDate` is an immutable `{ year, month, day }` record. `parseDate` accepts exactly `YYYY-MM-DD`; invalid dates throw `RangeError`.

```ts
import {
  addDays,
  addMonths,
  createDate,
  formatDate,
} from "betacalendars-grid-engine/civil";

const date = createDate(2027, 1, 31);
formatDate(addDays(date, 1)); // '2027-02-01'
formatDate(addMonths(date, 1)); // '2027-02-28' (default: constrain)
formatDate(addMonths(date, 1, { overflow: "reject" })); // throws RangeError
```

Available functions include `createDate`, `parseDate`, `formatDate`, `compareDates`, `addDays`, `addMonths`, `addYears`, `differenceInDays`, `dayOfWeek`, `dayOfYear`, `daysInMonth`, `daysInYear`, `isLeapYear`, and `quarterOfYear`.

Weekday numbers follow JavaScript convention: Sunday is `0`, Monday is `1`, through Saturday `6`.

## Month geometry

The first cell offset is `(firstWeekday - weekStartsOn + 7) mod 7`; natural rows are `ceil((leadingCells + daysInMonth) / 7)`. `fixedRows` only adds presentation rows and rejects a row count that would hide a date.

```ts
import { buildMonthGrid } from "betacalendars-grid-engine/grid";

const augustMonday = buildMonthGrid({ year: 2027, month: 8, weekStartsOn: 1 });
const augustSunday = buildMonthGrid({ year: 2027, month: 8, weekStartsOn: 0 });
console.log(augustMonday.naturalRows, augustSunday.naturalRows); // 6, 5
```

Each cell carries its civil date and ISO string (or `null` for hidden/out-of-range cells), current-month relation, weekday, row/column coordinates, and weekend flag. With `outsideDays: 'none'`, adjacent month cells remain explicit empty cells. Weekend defaults to Saturday and Sunday and can be overridden.

## Year matrix

```ts
import { buildYearMatrix } from "betacalendars-grid-engine/grid";

const year = buildYearMatrix(2027, { weekStartsOn: 1 });
console.log(year.months[0].name, year.months[0].naturalRows);
```

The twelve entries include a complete month grid plus the month name, day count, first weekday, natural rows, and leading cells.

## ISO weeks and week boundaries

```ts
import {
  createDate,
  formatDate,
  getISOWeek,
  startOfWeek,
  endOfWeek,
} from "betacalendars-grid-engine";

const date = createDate(2027, 1, 1);
getISOWeek(date); // { week: 53, weekYear: 2026, weekday: 5 }
formatDate(startOfWeek(createDate(2027, 8, 18), { weekStartsOn: 1 })); // '2027-08-16'
formatDate(endOfWeek(createDate(2027, 8, 18), { weekStartsOn: 1 })); // '2027-08-22'
```

`getLocaleWeekInfo(locale)` reads the runtime's `Intl.Locale` week data when available. It throws a clear error if that runtime API is missing. Core grid generation never depends on locale week data; callers can always pass an explicit `weekStartsOn`.

## Print geometry

All physical dimensions use millimeters.

```ts
import { createMonthPrintLayout } from "betacalendars-grid-engine/print";

const layout = createMonthPrintLayout({
  year: 2027,
  month: 2,
  paper: "A4",
  orientation: "landscape",
  weekStartsOn: 1,
  margins: { top: 12, right: 12, bottom: 12, left: 12 },
});
console.log(layout.cellWidth, layout.cellHeight, layout.rowCount);
```

The result describes page, content, header, weekday, and calendar rectangles. It does not communicate with printer drivers or produce a PDF.

## SVG and CSS

```ts
import {
  createPrintCSS,
  renderMonthSVG,
} from "betacalendars-grid-engine/print";

const svg = renderMonthSVG({
  year: 2027,
  month: 2,
  weekStartsOn: 1,
  width: 1200,
  height: 800,
  showAdjacentDays: true,
  showWeekNumbers: true,
});
const printCSS = createPrintCSS({
  paper: "A4",
  orientation: "landscape",
  margins: "12mm",
});
```

SVG strings are deterministic and self-contained, with no external assets or scripts. The optional theme accepts simple color tokens. The CSS helper emits `@page` and print page-break rules.

## Validation and conformance

```ts
import { validateMonthGrid } from "betacalendars-grid-engine/validation";
import {
  runConformanceSuite,
  buildWinterRolloverFixture,
} from "betacalendars-grid-engine/fixtures";
```

Conformance reports contain named checks with machine-readable validity. `validateMonthGrid`, `validateYearMatrix`, and `validateSequence` return validity, individual check results, and error names.

## CLI

```sh
betacal month 2027 2 --week-start monday
betacal month 2027 8 --week-start sunday --json
betacal year 2027 --json
betacal inspect 2027-01-01
betacal iso 2027-01-01
betacal validate 2027 --json
betacal winter 2026
betacal svg 2027 2 --output february.svg
betacal print-layout 2027 2 --paper A4 --orientation landscape --json
```

`--json` emits JSON only. The SVG command writes a file only when `--output` is provided. Commands return a nonzero exit status on invalid input or failed validation.

## Static year example

Build the package, then run `node examples/static-year/generate.mjs 2027`. It writes a plain HTML file with twelve month tables. The example uses the year matrix and contains no framework dependency.

## Runtime and security

Importing the library and calling its calendar functions makes no network request and does not access the filesystem, child processes, browser DOM, or current time. The CLI is separate from core exports. Only the explicit SVG export command writes a file. This package is a calendar-grid and layout engine, not a date-time library.

## Visual Fixture References

Algorithmic tests and human-readable calendar fixtures solve different problems. The engine performs all calculations locally; the pages below are optional Beta Calendars visual references that can help with manual inspection of rendered month geometry or printable output.

### Beta Calendars

[Beta Calendars](https://www.betacalendars.com/)

### Calendar collections

[Monthly Calendar](https://www.betacalendars.com/monthly-calendar) · [Blank Calendar](https://www.betacalendars.com/blank-calendar) · [Monthly Planner](https://www.betacalendars.com/monthly-planner)

### Month-by-month visual fixtures

[January Calendar](https://www.betacalendars.com/january-calendar.html) · [February Calendar](https://www.betacalendars.com/february-calendar.html) · [March Calendar](https://www.betacalendars.com/march-calendar.html) · [April Calendar](https://www.betacalendars.com/april-calendar.html) · [May Calendar](https://www.betacalendars.com/may-calendar.html) · [June Calendar](https://www.betacalendars.com/june-calendar.html) · [July Calendar](https://www.betacalendars.com/july-calendar.html) · [August Calendar](https://www.betacalendars.com/august-calendar.html) · [September Calendar](https://www.betacalendars.com/september-calendar.html) · [October Calendar](https://www.betacalendars.com/october-calendar.html) · [November Calendar](https://www.betacalendars.com/november-calendar.html) · [December Calendar](https://www.betacalendars.com/december-calendar.html)

These pages are optional visual fixtures. The library does not fetch, scrape, parse, or depend on BetaCalendars.com to perform calendar calculations.

## License

MIT. See [LICENSE](LICENSE).
