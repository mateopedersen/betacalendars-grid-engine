import {
  addDays,
  createDate,
  daysInMonth,
  isLeapYear,
  type CivilDate,
  type Weekday,
} from "./civil.js";
import { buildMonthGrid, buildYearMatrix } from "./grid.js";
import { getISOWeek } from "./week.js";
import { validateYearMatrix } from "./validation.js";

export interface ConformanceCase {
  readonly name: string;
  readonly valid: boolean;
  readonly detail?: string;
}
export interface ConformanceReport {
  readonly valid: boolean;
  readonly cases: readonly ConformanceCase[];
  readonly checkedYears: readonly number[];
}

export function runGregorianConformanceSuite(): ConformanceReport {
  const years = [1900, 2000, 2027, 2028, 2100, 2400];
  const cases = years.map((year) => ({
    name: `leap-year rule ${year}`,
    valid:
      isLeapYear(year) ===
      (year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)),
  }));
  return freezeReport(cases, years);
}

export function runConformanceSuite(): ConformanceReport {
  const cases: ConformanceCase[] = [...runGregorianConformanceSuite().cases];
  const year = buildYearMatrix(2027, { weekStartsOn: 1 });
  cases.push({
    name: "2027 year matrix has twelve valid months",
    valid: validateYearMatrix(year).valid,
  });
  cases.push({
    name: "February 2027 can naturally fit into four Monday-first rows",
    valid: year.months[1]?.naturalRows === 4,
  });
  cases.push({
    name: "May 2027 requires six rows for both layouts",
    valid:
      buildMonthGrid({ year: 2027, month: 5, weekStartsOn: 1 }).naturalRows ===
        6 &&
      buildMonthGrid({ year: 2027, month: 5, weekStartsOn: 0 }).naturalRows ===
        6,
  });
  cases.push({
    name: "August 2027 changes row count when first weekday changes",
    valid:
      buildMonthGrid({ year: 2027, month: 8, weekStartsOn: 1 }).naturalRows ===
        6 &&
      buildMonthGrid({ year: 2027, month: 8, weekStartsOn: 0 }).naturalRows ===
        5,
  });
  cases.push({
    name: "October 2027 requires six rows Sunday-first",
    valid:
      buildMonthGrid({ year: 2027, month: 10, weekStartsOn: 0 }).naturalRows ===
      6,
  });
  const rolloverDates = [
    createDate(2026, 12, 28),
    createDate(2026, 12, 31),
    createDate(2027, 1, 1),
    createDate(2027, 1, 4),
  ];
  cases.push({
    name: "ISO week-year rollover boundaries",
    valid:
      getISOWeek(rolloverDates[1]!).weekYear === 2026 &&
      getISOWeek(rolloverDates[2]!).weekYear === 2026 &&
      getISOWeek(rolloverDates[3]!).weekYear === 2027,
  });
  for (const y of [1900, 2000, 2027, 2028, 2100, 2400]) {
    for (let month = 1; month <= 12; month++) {
      for (const weekStartsOn of [0, 1] as const) {
        const grid = buildMonthGrid({ year: y, month, weekStartsOn });
        cases.push({
          name: `${y}-${String(month).padStart(2, "0")} ${weekStartsOn === 0 ? "Sunday" : "Monday"}-first grid invariants`,
          valid: grid.invariants.valid,
        });
      }
    }
  }
  return freezeReport(cases, [1900, 2000, 2027, 2028, 2100, 2400]);
}

export function buildWinterRolloverFixture(year: number): Readonly<{
  year: number;
  months: readonly ReturnType<typeof buildMonthGrid>[];
  transitions: readonly {
    from: CivilDate;
    to: CivilDate;
    consecutive: boolean;
  }[];
  weekStarts: readonly Weekday[];
}> {
  if (!Number.isInteger(year) || year < 1 || year > 9998)
    throw new RangeError("Winter fixture year must be from 1 through 9998");
  const months = [11, 12, 1, 2].map((month) =>
    buildMonthGrid({
      year: month < 3 ? year + 1 : year,
      month,
      weekStartsOn: 1,
      outsideDays: "previous-next",
    }),
  );
  const transitions = [
    { from: createDate(year, 11, 30), to: createDate(year, 12, 1) },
    { from: createDate(year, 12, 31), to: createDate(year + 1, 1, 1) },
    {
      from: createDate(year + 1, 1, daysInMonth(year + 1, 1)),
      to: createDate(year + 1, 2, 1),
    },
  ].map((pair) =>
    Object.freeze({
      ...pair,
      consecutive:
        addDays(pair.from, 1).year === pair.to.year &&
        addDays(pair.from, 1).month === pair.to.month &&
        addDays(pair.from, 1).day === pair.to.day,
    }),
  );
  return Object.freeze({
    year,
    months: Object.freeze(months),
    transitions: Object.freeze(transitions),
    weekStarts: Object.freeze([0, 1] as const),
  });
}

function freezeReport(
  cases: ConformanceCase[],
  checkedYears: number[],
): ConformanceReport {
  const frozen = cases.map((item) => Object.freeze(item));
  return Object.freeze({
    valid: frozen.every((item) => item.valid),
    cases: Object.freeze(frozen),
    checkedYears: Object.freeze(checkedYears),
  });
}
