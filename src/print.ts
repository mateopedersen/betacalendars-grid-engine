import { buildMonthGrid, type MonthGridOptions } from "./grid.js";
import { getISOWeek } from "./week.js";

export type PaperSize = "A4" | "Letter";
export interface MonthPrintLayoutOptions extends MonthGridOptions {
  readonly year: number;
  readonly month: number;
  readonly paper?: PaperSize;
  readonly orientation?: "portrait" | "landscape";
  readonly margins?:
    | number
    | {
        readonly top: number;
        readonly right: number;
        readonly bottom: number;
        readonly left: number;
      };
  readonly headerHeight?: number;
  readonly weekdayHeight?: number;
}
export interface Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export interface MonthPrintLayout {
  readonly unit: "mm";
  readonly page: Rectangle;
  readonly content: Rectangle;
  readonly header: Rectangle;
  readonly weekdays: Rectangle;
  readonly calendar: Rectangle;
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly rowCount: number;
}

export function createMonthPrintLayout(
  options: MonthPrintLayoutOptions,
): MonthPrintLayout {
  const paper = options.paper ?? "A4";
  if (paper !== "A4" && paper !== "Letter")
    throw new RangeError(`Unsupported paper size: ${paper}`);
  const baseW = paper === "A4" ? 210 : 215.9;
  const baseH = paper === "A4" ? 297 : 279.4;
  if (
    options.orientation !== undefined &&
    options.orientation !== "portrait" &&
    options.orientation !== "landscape"
  )
    throw new RangeError(`Unsupported orientation: ${options.orientation}`);
  const pageW = options.orientation === "landscape" ? baseH : baseW;
  const pageH = options.orientation === "landscape" ? baseW : baseH;
  const margins =
    typeof options.margins === "number"
      ? {
          top: options.margins,
          right: options.margins,
          bottom: options.margins,
          left: options.margins,
        }
      : (options.margins ?? { top: 12, right: 12, bottom: 12, left: 12 });
  if (
    Object.values(margins).some((value) => !Number.isFinite(value) || value < 0)
  )
    throw new RangeError("Margins must be finite non-negative millimeters");
  const contentW = pageW - margins.left - margins.right;
  const contentH = pageH - margins.top - margins.bottom;
  const headerH = options.headerHeight ?? 18;
  const weekdayH = options.weekdayHeight ?? 10;
  if (
    contentW <= 0 ||
    contentH <= headerH + weekdayH ||
    headerH < 0 ||
    weekdayH < 0
  )
    throw new RangeError(
      "Margins and header sizes leave no printable calendar area",
    );
  const grid = buildMonthGrid(options);
  const calendarH = contentH - headerH - weekdayH;
  const rect = (
    x: number,
    y: number,
    width: number,
    height: number,
  ): Rectangle => Object.freeze({ x, y, width, height });
  return Object.freeze({
    unit: "mm",
    page: rect(0, 0, pageW, pageH),
    content: rect(margins.left, margins.top, contentW, contentH),
    header: rect(margins.left, margins.top, contentW, headerH),
    weekdays: rect(margins.left, margins.top + headerH, contentW, weekdayH),
    calendar: rect(
      margins.left,
      margins.top + headerH + weekdayH,
      contentW,
      calendarH,
    ),
    cellWidth: contentW / 7,
    cellHeight: calendarH / grid.renderedRows,
    rowCount: grid.renderedRows,
  });
}

export interface MonthSVGOptions extends MonthGridOptions {
  readonly year: number;
  readonly month: number;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly showWeekdays?: boolean;
  readonly showAdjacentDays?: boolean;
  readonly showWeekNumbers?: boolean;
  readonly theme?: Partial<{
    foreground: string;
    background: string;
    muted: string;
    grid: string;
    accent: string;
  }>;
}

export function renderMonthSVG(options: MonthSVGOptions): string {
  const width = options.width ?? 1200,
    height = options.height ?? 800;
  if (![width, height].every((value) => Number.isFinite(value) && value > 0))
    throw new RangeError(
      "SVG width and height must be positive finite numbers",
    );
  const grid = buildMonthGrid({
    ...options,
    outsideDays: options.showAdjacentDays ? "previous-next" : "none",
  });
  const colors = {
    foreground: "#202124",
    background: "#ffffff",
    muted: "#80868b",
    grid: "#dadce0",
    accent: "#1a73e8",
    ...options.theme,
  };
  for (const value of Object.values(colors))
    if (/url\s*\(|[<>]/i.test(value))
      throw new RangeError("Theme values must be plain color tokens");
  const margin = Math.min(width, height) * 0.04;
  const titleH = height * 0.12,
    weekdayH = options.showWeekdays === false ? 0 : height * 0.08;
  const weekNoW = options.showWeekNumbers ? width * 0.06 : 0;
  const gridX = margin + weekNoW,
    gridW = width - margin * 2 - weekNoW;
  const gridY = margin + titleH + weekdayH,
    gridH = height - gridY - margin;
  const cellW = gridW / 7,
    cellH = gridH / grid.renderedRows;
  const escape = (text: string): string =>
    text.replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[character]!,
    );
  const title = escape(options.title ?? `${grid.name} ${options.year}`);
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    `<rect width="100%" height="100%" fill="${escape(colors.background)}"/>`,
    `<text x="${margin}" y="${margin + titleH * 0.68}" font-family="sans-serif" font-size="${titleH * 0.48}" font-weight="700" fill="${escape(colors.foreground)}">${title}</text>`,
  ];
  if (options.showWeekdays !== false) {
    const labels = Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(options.locale, {
        weekday: "short",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2020, 5, 7 + ((grid.weekStartsOn + i) % 7)))),
    );
    labels.forEach((label, col) =>
      parts.push(
        `<text x="${gridX + col * cellW + cellW / 2}" y="${margin + titleH + weekdayH * 0.65}" text-anchor="middle" font-family="sans-serif" font-size="${weekdayH * 0.45}" fill="${escape(colors.muted)}">${escape(label)}</text>`,
      ),
    );
  }
  for (let row = 0; row < grid.renderedRows; row++) {
    for (let col = 0; col < 7; col++) {
      const cell = grid.weeks[row]![col]!;
      const x = gridX + col * cellW,
        y = gridY + row * cellH;
      parts.push(
        `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="none" stroke="${escape(colors.grid)}"/>`,
      );
      if (
        cell.day !== null &&
        (cell.inCurrentMonth || options.showAdjacentDays)
      ) {
        const color = cell.inCurrentMonth ? colors.foreground : colors.muted;
        parts.push(
          `<text data-date="${cell.iso}" x="${x + cellW * 0.08}" y="${y + cellH * 0.22}" font-family="sans-serif" font-size="${Math.min(cellW, cellH) * 0.16}" fill="${escape(color)}">${cell.day}</text>`,
        );
      }
    }
    if (options.showWeekNumbers) {
      const cell = grid.weeks[row]![0]!;
      const sample = cell.date ?? grid.weeks[row]![1]!.date;
      const week = sample ? getISOWeek(sample).week : "";
      parts.push(
        `<text x="${margin + weekNoW / 2}" y="${gridY + row * cellH + cellH * 0.22}" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(cellW, cellH) * 0.14}" fill="${escape(colors.muted)}">${week}</text>`,
      );
    }
  }
  parts.push("</svg>");
  return parts.join("");
}

export function renderYearSVG(
  year: number,
  options: {
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    locale?: string;
    width?: number;
    height?: number;
  } = {},
): string {
  const width = options.width ?? 1400,
    height = options.height ?? 1000;
  if (![width, height].every((value) => Number.isFinite(value) && value > 0))
    throw new RangeError("SVG dimensions must be positive");
  const cards = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1,
      x = ((i % 3) * width) / 3,
      y = (Math.floor(i / 3) * height) / 4;
    const gridOptions = {
      ...(options.weekStartsOn === undefined
        ? {}
        : { weekStartsOn: options.weekStartsOn }),
      ...(options.locale === undefined ? {} : { locale: options.locale }),
    };
    return `<g transform="translate(${x} ${y})">${renderMonthSVG({ year, month, ...gridOptions, width: width / 3, height: height / 4, showWeekdays: true })}</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${year} calendar year matrix" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${cards.join("")}</svg>`;
}

export function createPrintCSS(
  options: {
    paper?: PaperSize;
    orientation?: "portrait" | "landscape";
    margins?: string;
  } = {},
): string {
  const paper = options.paper ?? "A4";
  if (paper !== "A4" && paper !== "Letter")
    throw new RangeError(`Unsupported paper size: ${paper}`);
  const orientation = options.orientation ?? "portrait";
  if (orientation !== "portrait" && orientation !== "landscape")
    throw new RangeError(`Unsupported orientation: ${orientation}`);
  const margins = options.margins ?? "12mm";
  if (!/^(\d+(?:\.\d+)?)(mm|cm|in|pt)$/.test(margins))
    throw new RangeError(
      "Margins must be a non-negative CSS length in mm, cm, in, or pt",
    );
  return `@page { size: ${paper} ${orientation}; margin: ${margins}; }\n@media print { .calendar-page { break-inside: avoid; page-break-inside: avoid; } .calendar-week { break-inside: avoid; } }`;
}
