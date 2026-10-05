#!/usr/bin/env node
import { dayOfWeek, dayOfYear, formatDate, parseDate } from "./civil.js";
import { buildMonthGrid, buildYearMatrix } from "./grid.js";
import { createMonthPrintLayout, renderMonthSVG } from "./print.js";
import { getISOWeek } from "./week.js";
import { buildWinterRolloverFixture, runConformanceSuite } from "./fixtures.js";
import { validateYearMatrix } from "./validation.js";

const args = process.argv.slice(2);
const command = args.shift();
const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
const json = args.includes("--json");
const opts = new Map<string, string>();
for (let i = 0; i < args.length; i++)
  if (
    args[i]?.startsWith("--") &&
    args[i + 1] &&
    !args[i + 1]!.startsWith("--")
  )
    opts.set(args[i]!, args[++i]!);
const positional = args.filter(
  (arg, index) =>
    !arg.startsWith("--") && args[index - 1]?.startsWith("--") !== true,
);
const weekStartsOn =
  opts.get("--week-start") === "sunday"
    ? 0
    : opts.get("--week-start") === "monday" || !opts.has("--week-start")
      ? 1
      : Number(opts.get("--week-start"));

try {
  let output: unknown;
  switch (command) {
    case "month": {
      const year = Number(positional[0]),
        month = Number(positional[1]);
      const grid = buildMonthGrid({
        year,
        month,
        weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      });
      output = json ? grid : formatMonth(grid);
      break;
    }
    case "year": {
      const matrix = buildYearMatrix(Number(positional[0]), {
        weekStartsOn: weekStartsOn as 0 | 1,
      });
      output = json
        ? matrix
        : matrix.months
            .map(
              (m) =>
                `${m.name.padEnd(12)} ${m.daysInMonth.toString().padStart(2)} days  ${m.naturalRows} rows`,
            )
            .join("\n");
      break;
    }
    case "inspect": {
      const date = parseDate(positional[0] ?? "");
      output = json
        ? {
            date,
            weekday: dayOfWeek(date),
            iso: getISOWeek(date),
            dayOfYear: dayOfYear(date),
          }
        : `${formatDate(date)} · ${weekdayNames[dayOfWeek(date)]} · ISO ${getISOWeek(date).weekYear}-W${String(getISOWeek(date).week).padStart(2, "0")}`;
      break;
    }
    case "iso": {
      const date = parseDate(positional[0] ?? "");
      const iso = getISOWeek(date);
      output = json
        ? iso
        : `${iso.weekYear}-W${String(iso.week).padStart(2, "0")}-${iso.weekday}`;
      break;
    }
    case "validate": {
      const matrix = buildYearMatrix(Number(positional[0]), {
        weekStartsOn: 1,
      });
      const report = {
        ...runConformanceSuite(),
        year: validateYearMatrix(matrix),
      };
      output = json
        ? report
        : `${report.valid && report.year.valid ? "Valid" : "Invalid"} · ${report.cases.length} conformance checks`;
      if (!report.valid || !report.year.valid) process.exitCode = 1;
      break;
    }
    case "winter": {
      output = buildWinterRolloverFixture(Number(positional[0]));
      if (!json)
        output = (
          output as ReturnType<typeof buildWinterRolloverFixture>
        ).transitions
          .map(
            (t) =>
              `${formatDate(t.from)} → ${formatDate(t.to)} ${t.consecutive ? "✓" : "✗"}`,
          )
          .join("\n");
      break;
    }
    case "svg": {
      const svg = renderMonthSVG({
        year: Number(positional[0]),
        month: Number(positional[1]),
        weekStartsOn: weekStartsOn as 0 | 1,
      });
      const outputPath = opts.get("--output");
      if (outputPath)
        await import("node:fs/promises").then((fs) =>
          fs.writeFile(outputPath, svg, "utf8"),
        );
      else output = svg;
      break;
    }
    case "print-layout":
      output = createMonthPrintLayout({
        year: Number(positional[0]),
        month: Number(positional[1]),
        paper: (opts.get("--paper") ?? "A4") as "A4" | "Letter",
        orientation: (opts.get("--orientation") ?? "portrait") as
          "portrait" | "landscape",
        weekStartsOn: weekStartsOn as 0 | 1,
      });
      break;
    default:
      throw new Error(
        "Usage: betacal <month|year|inspect|iso|validate|winter|svg|print-layout> ... [--json]",
      );
  }
  if (output !== undefined)
    console.log(json ? JSON.stringify(output, null, 2) : output);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function formatMonth(grid: ReturnType<typeof buildMonthGrid>): string {
  const labels = Array.from({ length: 7 }, (_, i) =>
    weekdayNames[(grid.weekStartsOn + i) % 7]!.slice(0, 3).padStart(3),
  );
  const lines = grid.weeks.map((week) =>
    week
      .map((cell) =>
        cell.day === null || !cell.inCurrentMonth
          ? "  "
          : String(cell.day).padStart(2),
      )
      .join(" "),
  );
  return `${grid.name} ${grid.year}\n\n${labels.join(" ")}\n${lines.join("\n")}\n\nDays:          ${grid.daysInMonth}\nFirst weekday: ${weekdayNames[grid.firstWeekday]}\nNatural rows:  ${grid.naturalRows}\nWeek start:    ${weekdayNames[grid.weekStartsOn]}`;
}
