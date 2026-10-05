export type CivilDate = Readonly<{ year: number; month: number; day: number }>;
export type OverflowMode = "constrain" | "reject";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function isLeapYear(year: number): boolean {
  assertYear(year);
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export function daysInMonth(year: number, month: number): number {
  assertYear(year);
  assertMonth(month);
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

export function createDate(
  year: number,
  month: number,
  day: number,
): CivilDate {
  assertYear(year);
  assertMonth(month);
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(
      `Invalid day ${day} for ${year}-${String(month).padStart(2, "0")}`,
    );
  }
  return Object.freeze({ year, month, day });
}

export function validateCivilDate(value: unknown): value is CivilDate {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<CivilDate>;
  try {
    createDate(
      candidate.year as number,
      candidate.month as number,
      candidate.day as number,
    );
    return true;
  } catch {
    return false;
  }
}

export function parseDate(iso: string): CivilDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match)
    throw new RangeError(
      `Expected a date in YYYY-MM-DD form; received ${JSON.stringify(iso)}`,
    );
  return createDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function formatDate(date: CivilDate): string {
  assertDate(date);
  return `${String(date.year).padStart(4, "0")}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

export function compareDates(a: CivilDate, b: CivilDate): -1 | 0 | 1 {
  assertDate(a);
  assertDate(b);
  const ka = a.year * 10000 + a.month * 100 + a.day;
  const kb = b.year * 10000 + b.month * 100 + b.day;
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}

export function dayOfWeek(date: CivilDate): Weekday {
  return mod(
    daysFromCivil(assertDate(date).year, date.month, date.day) + 4,
    7,
  ) as Weekday;
}

export function dayOfYear(date: CivilDate): number {
  assertDate(date);
  return (
    differenceInDays(
      createDate(date.year, date.month, date.day),
      createDate(date.year, 1, 1),
    ) + 1
  );
}

export function quarterOfYear(date: CivilDate): 1 | 2 | 3 | 4 {
  assertDate(date);
  return Math.ceil(date.month / 3) as 1 | 2 | 3 | 4;
}

export function addDays(date: CivilDate, amount: number): CivilDate {
  assertDate(date);
  if (!Number.isSafeInteger(amount))
    throw new RangeError("Day amount must be a safe integer");
  const epoch = daysFromCivil(date.year, date.month, date.day) + amount;
  const result = civilFromDays(epoch);
  return createDate(result.year, result.month, result.day);
}

export function addMonths(
  date: CivilDate,
  amount: number,
  options: { overflow?: OverflowMode } = {},
): CivilDate {
  assertDate(date);
  assertOverflow(options.overflow);
  if (!Number.isSafeInteger(amount))
    throw new RangeError("Month amount must be a safe integer");
  const index = date.year * 12 + (date.month - 1) + amount;
  const year = Math.floor(index / 12);
  const month = mod(index, 12) + 1;
  assertYear(year);
  const maximum = daysInMonth(year, month);
  if (date.day > maximum && (options.overflow ?? "constrain") === "reject") {
    throw new RangeError(
      `Adding ${amount} month(s) would make day ${date.day} invalid`,
    );
  }
  return createDate(year, month, Math.min(date.day, maximum));
}

export function addYears(
  date: CivilDate,
  amount: number,
  options: { overflow?: OverflowMode } = {},
): CivilDate {
  assertDate(date);
  assertOverflow(options.overflow);
  if (!Number.isSafeInteger(amount))
    throw new RangeError("Year amount must be a safe integer");
  const year = date.year + amount;
  assertYear(year);
  const maximum = daysInMonth(year, date.month);
  if (date.day > maximum && (options.overflow ?? "constrain") === "reject") {
    throw new RangeError(
      `Adding ${amount} year(s) would make day ${date.day} invalid`,
    );
  }
  return createDate(year, date.month, Math.min(date.day, maximum));
}

export function differenceInDays(later: CivilDate, earlier: CivilDate): number {
  assertDate(later);
  assertDate(earlier);
  return (
    daysFromCivil(later.year, later.month, later.day) -
    daysFromCivil(earlier.year, earlier.month, earlier.day)
  );
}

export function assertDate(date: CivilDate): CivilDate {
  if (!validateCivilDate(date))
    throw new RangeError("Expected a valid civil date in years 1 through 9999");
  return date;
}

export function assertYear(year: number): void {
  if (!Number.isInteger(year) || year < 1 || year > 9999)
    throw new RangeError(
      `Year must be an integer from 1 through 9999; received ${year}`,
    );
}

export function assertMonth(month: number): void {
  if (!Number.isInteger(month) || month < 1 || month > 12)
    throw new RangeError(
      `Month must be an integer from 1 through 12; received ${month}`,
    );
}

function assertOverflow(value: OverflowMode | undefined): void {
  if (value !== undefined && value !== "constrain" && value !== "reject")
    throw new RangeError(`Unsupported overflow mode: ${value}`);
}

export function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function daysFromCivil(year: number, month: number, day: number): number {
  const y = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const shiftedMonth = month + (month > 2 ? -3 : 9);
  const dayOfYearInMarch = Math.floor((153 * shiftedMonth + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 +
    Math.floor(yearOfEra / 4) -
    Math.floor(yearOfEra / 100) +
    dayOfYearInMarch;
  return era * 146097 + dayOfEra - 719468;
}

function civilFromDays(epoch: number): {
  year: number;
  month: number;
  day: number;
} {
  const z = epoch + 719468;
  const era = Math.floor(z / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  let year = yearOfEra + era * 400;
  const dayOfYearInMarch =
    dayOfEra -
    (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const monthPrime = Math.floor((5 * dayOfYearInMarch + 2) / 153);
  const day = dayOfYearInMarch - Math.floor((153 * monthPrime + 2) / 5) + 1;
  const month = monthPrime + (monthPrime < 10 ? 3 : -9);
  year += month <= 2 ? 1 : 0;
  return { year, month, day };
}
