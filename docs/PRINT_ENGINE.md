# Print engine

`createMonthPrintLayout` returns A4 or US Letter rectangles in millimeters, including margins, header, weekday header, calendar body, and cell dimensions. It is a geometry calculation only: it does not load printer settings or render PDF files.

`renderMonthSVG` produces a self-contained static SVG, and `createPrintCSS` returns basic `@page` and print page-break rules for applications that render their own HTML.
