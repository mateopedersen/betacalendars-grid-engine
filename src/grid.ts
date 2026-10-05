import {
  addDays,
  assertYear,
  createDate,
  dayOfWeek,
  daysInMonth,
  formatDate,
  mod,
  type CivilDate,
  type Weekday,
} from "./civil.js";
import { validateMonthGrid } from "./validation.js";

export type CellRelation = "previous" | "current" | "next" | "empty";
export interface CalendarCell {
  readonly date: CivilDate | null;
  readonly iso: string | null;
  readonly day: number | null;
  readonly inCurrentMonth: boolean;
  readonly relation: CellRelation;
  readonly weekday: Weekday;
  readonly row: number;
  readonly column: number;
  readonly isWeekend: boolean;
}
export type FixedRows = 4 | 5 | 6 | "natural";
export interface MonthGridOptions {
  readonly weekStartsOn?: Weekday;
  readonly outsideDays?: "none" | "previous-next";
  readonly fixedRows?: FixedRows;
  readonly weekend?: readonly Weekday[];
  readonly locale?: string;
}
export interface MonthGrid {
  readonly year: number;
  readonly month: number;
  readonly name: string;
  readonly daysInMonth: number;
  readonly firstWeekday: Weekday;
  readonly weekStartsOn: Weekday;
  readonly leadingCells: number;
  readonly trailingCells: number;
  readonly naturalRows: number;
  readonly renderedRows: number;
  readonly weeks: readonly (readonly CalendarCell[])[];
  readonly invariants: ReturnType<typeof validateMonthGrid>;
}
export interface YearMonthSummary {
  readonly month: number;
  readonly name: string;
  readonly daysInMonth: number;
  readonly firstWeekday: Weekday;
  readonly naturalRows: number;
  readonly leadingCells: number;
  readonly grid: MonthGrid;
}
export interface YearMatrix {
  readonly year: number;
  readonly weekStartsOn: Weekday;
  readonly months: readonly YearMonthSummary[];
}

export function buildMonthGrid(
  input: { year: number; month: number } & MonthGridOptions,
): MonthGrid {
  const { year, month } = input;
  assertYear(year);
  const count = daysInMonth(year, month);
  const start = input.weekStartsOn ?? 1;
  assertWeekday(start);
  const firstWeekday = dayOfWeek(createDate(year, month, 1));
  const leadingCells = mod(firstWeekday - start, 7);
  const naturalRows = Math.ceil((leadingCells + count) / 7);
  const fixedRows = input.fixedRows ?? "natural";
  const renderedRows = fixedRows === "natural" ? naturalRows : fixedRows;
  if (![4, 5, 6].includes(renderedRows) || renderedRows < naturalRows) {
    throw new RangeError(
      `fixedRows=${fixedRows} cannot display all ${count} dates in ${year}-${String(month).padStart(2, "0")}`,
    );
  }
  const outsideDays = input.outsideDays ?? "previous-next";
  if (outsideDays !== "none" && outsideDays !== "previous-next")
    throw new RangeError(`Unsupported outsideDays value: ${outsideDays}`);
  const weekend = new Set<Weekday>(input.weekend ?? [0, 6]);
  for (const day of weekend) assertWeekday(day);
  const label = new Intl.DateTimeFormat(input.locale, {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2020, month - 1, 1)));
  const weeks: CalendarCell[][] = [];
  for (let row = 0; row < renderedRows; row++) {
    const week: CalendarCell[] = [];
    for (let column = 0; column < 7; column++) {
      const offset = row * 7 + column - leadingCells;
      let date: CivilDate | null;
      try {
        date = addDays(createDate(year, month, 1), offset);
      } catch {
        date = null;
      }
      if (date === null) {
        week.push(
          Object.freeze({
            date: null,
            iso: null,
            day: null,
            inCurrentMonth: false,
            relation: "empty",
            weekday: mod(start + column, 7) as Weekday,
            row,
            column,
            isWeekend: weekend.has(mod(start + column, 7) as Weekday),
          }),
        );
        continue;
      }
      const current = date.month === month;
      const hidden = !current && outsideDays === "none";
      week.push(
        Object.freeze({
          date: hidden ? null : date,
          iso: hidden ? null : formatDate(date),
          day: hidden ? null : date.day,
          inCurrentMonth: current,
          relation: hidden
            ? "empty"
            : current
              ? "current"
              : date.year < year || (date.year === year && date.month < month)
                ? "previous"
                : "next",
          weekday: mod(start + column, 7) as Weekday,
          row,
          column,
          isWeekend: weekend.has(mod(start + column, 7) as Weekday),
        }),
      );
    }
    weeks.push(Object.freeze(week) as CalendarCell[]);
  }
  const trailingCells = renderedRows * 7 - leadingCells - count;
  const result: Omit<MonthGrid, "invariants"> = {
    year,
    month,
    name: label,
    daysInMonth: count,
    firstWeekday,
    weekStartsOn: start,
    leadingCells,
    trailingCells,
    naturalRows,
    renderedRows,
    weeks: Object.freeze(weeks),
  };
  return Object.freeze({ ...result, invariants: validateMonthGrid(result) });
}

export function buildYearMatrix(
  year: number,
  options: MonthGridOptions = {},
): YearMatrix {
  assertYear(year);
  const weekStartsOn = options.weekStartsOn ?? 1;
  assertWeekday(weekStartsOn);
  const months: YearMonthSummary[] = [];
  for (let month = 1; month <= 12; month++) {
    const grid = buildMonthGrid({ year, month, ...options, weekStartsOn });
    months.push(
      Object.freeze({
        month,
        name: grid.name,
        daysInMonth: grid.daysInMonth,
        firstWeekday: grid.firstWeekday,
        naturalRows: grid.naturalRows,
        leadingCells: grid.leadingCells,
        grid,
      }),
    );
  }
  return Object.freeze({ year, weekStartsOn, months: Object.freeze(months) });
}

export function assertWeekday(value: number): asserts value is Weekday {
  if (!Number.isInteger(value) || value < 0 || value > 6)
    throw new RangeError(
      `Weekday must be an integer from 0 through 6; received ${value}`,
    );
}
