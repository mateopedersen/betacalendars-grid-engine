import { buildYearMatrix } from "../../dist/index.js";
import { writeFile } from "node:fs/promises";

const year = Number(process.argv[2] ?? 2027);
const matrix = buildYearMatrix(year, { weekStartsOn: 1 });
const months = matrix.months
  .map(
    ({ name, grid }) =>
      `<section><h2>${name} ${year}</h2><table><thead><tr>${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => `<th>${day}</th>`).join("")}</tr></thead><tbody>${grid.weeks.map((week) => `<tr>${week.map((cell) => `<td>${cell.inCurrentMonth ? cell.day : ""}</td>`).join("")}</tr>`).join("")}</tbody></table></section>`,
  )
  .join("");
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>${year} calendar</title><style>body{font:14px system-ui;margin:2rem}main{display:grid;grid-template-columns:repeat(3,minmax(12rem,1fr));gap:1rem}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;text-align:center;padding:.35rem}td:empty{background:#fafafa}@media print{main{grid-template-columns:repeat(3,1fr)}section{break-inside:avoid}}</style><h1>${year}</h1><main>${months}</main></html>`;
await writeFile(`calendar-${year}.html`, html);
console.log(`Wrote calendar-${year}.html`);
