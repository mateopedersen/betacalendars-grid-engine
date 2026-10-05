import { addDays, createDate, formatDate, type CivilDate } from "./civil.js";
import type { MonthGrid, YearMatrix } from "./grid.js";

export interface ValidationResult {
  readonly valid: boolean;
  readonly checks: Readonly<Record<string, boolean>>;
  readonly errors: readonly string[];
}

export function validateSequence(
  dates: readonly CivilDate[],
): ValidationResult {
  const validDates = dates.every((date) => {
    try {
      createDate(date.year, date.month, date.day);
      return true;
    } catch {
      return false;
    }
  });
  const sequential =
    validDates &&
    dates.every(
      (date, index) =>
        index === 0 ||
        formatDate(date) === formatDate(addDays(dates[index - 1]!, 1)),
    );
  const checks = Object.freeze({ validDates, sequential });
  return result(
    checks,
    Object.entries(checks)
      .filter(([, ok]) => !ok)
      .map(([name]) => name),
  );
}

export function validateMonthGrid(
  grid: Omit<MonthGrid, "invariants"> & {
    readonly invariants?: ValidationResult;
  },
): ValidationResult {
  const cells = grid.weeks.flat();
  const current = cells.filter((cell) => cell.inCurrentMonth);
  const ids = current.map((cell) => cell.iso);
  const expected = Array.from({ length: grid.daysInMonth }, (_, i) =>
    formatDate(createDate(grid.year, grid.month, i + 1)),
  );
  const completeDateSet =
    current.length === grid.daysInMonth &&
    expected.every((id, i) => ids[i] === id);
  const uniqueDates = new Set(ids).size === ids.length;
  const sevenCellsPerWeek = grid.weeks.every((week) => week.length === 7);
  const validRows =
    grid.naturalRows >= 4 &&
    grid.naturalRows <= 6 &&
    grid.renderedRows >= grid.naturalRows &&
    grid.renderedRows <= 6 &&
    grid.weeks.length === grid.renderedRows;
  const firstDatePosition =
    grid.weeks[0]?.[grid.leadingCells]?.iso ===
    formatDate(createDate(grid.year, grid.month, 1));
  const weekdayContinuity = cells.every(
    (cell, index) =>
      cell.weekday === (grid.weekStartsOn + (index % 7)) % 7 &&
      cell.column === index % 7 &&
      cell.row === Math.floor(index / 7),
  );
  const outsideCellsValid = cells.every((cell) =>
    cell.inCurrentMonth
      ? cell.relation === "current" &&
        cell.date?.month === grid.month &&
        cell.date.year === grid.year
      : cell.relation === "empty"
        ? cell.date === null && cell.iso === null
        : cell.date !== null &&
          cell.iso === formatDate(cell.date) &&
          cell.relation ===
            (cell.date.year < grid.year ||
            (cell.date.year === grid.year && cell.date.month < grid.month)
              ? "previous"
              : "next"),
  );
  const checks = Object.freeze({
    completeDateSet,
    uniqueDates,
    sevenCellsPerWeek,
    validRows,
    firstDatePosition,
    weekdayContinuity,
    outsideCellsValid,
  });
  return result(
    checks,
    Object.entries(checks)
      .filter(([, ok]) => !ok)
      .map(([name]) => name),
  );
}

export function validateYearMatrix(year: YearMatrix): ValidationResult {
  const twelveMonths =
    year.months.length === 12 &&
    year.months.every(
      (month, index) =>
        month.month === index + 1 &&
        month.grid.year === year.year &&
        month.grid.invariants.valid,
    );
  const checks = Object.freeze({ twelveMonths });
  return result(
    checks,
    Object.entries(checks)
      .filter(([, ok]) => !ok)
      .map(([name]) => name),
  );
}

function result(
  checks: Record<string, boolean>,
  errors: string[],
): ValidationResult {
  return Object.freeze({
    valid: Object.values(checks).every(Boolean),
    checks: Object.freeze(checks),
    errors: Object.freeze(errors),
  });
}
