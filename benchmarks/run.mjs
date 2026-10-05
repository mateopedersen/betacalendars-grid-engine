import { performance } from "node:perf_hooks";
import {
  buildMonthGrid,
  buildYearMatrix,
  renderMonthSVG,
  validateYearMatrix,
} from "../dist/index.js";

const tasks = [
  ["one month", () => buildMonthGrid({ year: 2027, month: 8 })],
  ["one year", () => buildYearMatrix(2027)],
  ["validate one year", () => validateYearMatrix(buildYearMatrix(2027))],
  [
    "100 years",
    () => {
      for (let year = 1950; year < 2050; year++) buildYearMatrix(year);
    },
  ],
  ["month SVG", () => renderMonthSVG({ year: 2027, month: 8 })],
];
for (const [label, run] of tasks) {
  const iterations = label === "100 years" ? 10 : 500;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) run();
  const elapsed = performance.now() - start;
  console.log(
    `${label}: ${((iterations * 1000) / elapsed).toFixed(1)} ops/s (${iterations} iterations, Node ${process.version})`,
  );
}
