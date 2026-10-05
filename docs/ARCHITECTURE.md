# Architecture

The package is divided into six explicit public surfaces: civil-date values and Gregorian math, month/year grids, week helpers, print geometry/SVG, validators, and conformance fixtures. The root entry re-exports these APIs. The CLI lives in a separate module so importing the library does not read process arguments or access the filesystem.

Core date arithmetic converts Gregorian fields to an integer day count and back using era/year-of-era arithmetic. It never mutates local-time `Date` values. `Intl.DateTimeFormat` is used only for display month and weekday labels.

The supported civil-date range is 0001 through 9999. Month/year addition defaults to `constrain` and can use `reject`. Month-grid row count is derived from the leading offset and month length; fixed presentation rows cannot drop an in-month date.

Print geometry reports millimeters and does not handle PDF creation or printer drivers. SVG output is a pure string with inline geometry and no remote assets.
