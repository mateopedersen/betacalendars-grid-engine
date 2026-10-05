import {
  addDays,
  assertDate,
  dayOfWeek,
  mod,
  type CivilDate,
  type Weekday,
} from "./civil.js";
import { assertWeekday } from "./grid.js";

export interface ISOWeek {
  readonly week: number;
  readonly weekYear: number;
  readonly weekday: number;
}

export function startOfWeek(
  date: CivilDate,
  options: { weekStartsOn?: Weekday } = {},
): CivilDate {
  assertDate(date);
  const start = options.weekStartsOn ?? 1;
  assertWeekday(start);
  return addDays(date, -mod(dayOfWeek(date) - start, 7));
}

export function endOfWeek(
  date: CivilDate,
  options: { weekStartsOn?: Weekday } = {},
): CivilDate {
  return addDays(startOfWeek(date, options), 6);
}

export function getISOWeek(date: CivilDate): ISOWeek {
  assertDate(date);
  const weekday = mod(dayOfWeek(date) + 6, 7) + 1;
  const ordinal = toOrdinal(date);
  let weekYear = date.year;
  if (ordinal < week1MondayOrdinal(weekYear)) weekYear--;
  else if (ordinal >= week1MondayOrdinal(weekYear + 1)) weekYear++;
  const week = Math.floor((ordinal - week1MondayOrdinal(weekYear)) / 7) + 1;
  return Object.freeze({ week, weekYear, weekday });
}

export function getLocaleWeekInfo(locale: string): {
  firstDay: Weekday;
  weekend: readonly Weekday[];
  minimalDays: number;
} {
  const instance = new Intl.Locale(locale) as Intl.Locale & {
    getWeekInfo?: () => {
      firstDay: number;
      weekend: number[];
      minimalDays: number;
    };
    weekInfo?: { firstDay: number; weekend: number[]; minimalDays: number };
  };
  const info = instance.getWeekInfo?.() ?? instance.weekInfo;
  if (!info)
    throw new Error(
      "This runtime does not provide Intl.Locale week information; supply weekStartsOn explicitly",
    );
  const firstDay = (info.firstDay % 7) as Weekday;
  const weekend = info.weekend.map((day) => (day % 7) as Weekday);
  for (const day of weekend) assertWeekday(day);
  return Object.freeze({
    firstDay,
    weekend: Object.freeze(weekend),
    minimalDays: info.minimalDays,
  });
}

function toOrdinal(date: CivilDate): number {
  // Gregorian ordinal independent of Date and timezone; same epoch convention as civil.ts.
  const y = date.year - (date.month <= 2 ? 1 : 0);
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = date.month + (date.month > 2 ? -3 : 9);
  const doy = Math.floor((153 * mp + 2) / 5) + date.day - 1;
  return (
    era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  );
}

function week1MondayOrdinal(year: number): number {
  const jan4 = ordinalFields(year, 1, 4);
  const weekdaySundayZero = mod(jan4 - 719468 + 4, 7);
  const weekdayMondayOne = mod(weekdaySundayZero + 6, 7) + 1;
  return jan4 - (weekdayMondayOne - 1);
}

function ordinalFields(year: number, month: number, day: number): number {
  const y = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = month + (month > 2 ? -3 : 9);
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  return (
    era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  );
}
