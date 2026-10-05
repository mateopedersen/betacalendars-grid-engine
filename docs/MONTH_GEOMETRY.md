# Month-grid geometry

For weekday convention Sunday=0 through Saturday=6, the leading offset is `(weekdayOfFirst - weekStartsOn + 7) mod 7`. Natural rows are `ceil((leading offset + days in month) / 7)`. This yields four, five, or six rows. `fixedRows` adds presentation rows and must be at least the natural count.

Cells retain their civil date and ISO date string when adjacent dates are requested. `outsideDays: 'none'` produces explicit empty cells with null date fields; month edges at the supported year boundary also use empty cells if a preceding/following civil date would fall outside years 1–9999.
