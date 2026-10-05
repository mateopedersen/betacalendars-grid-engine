# Civil date model

`CivilDate` is an immutable plain `{ year, month, day }` value, in the proleptic Gregorian calendar, with an inclusive range of years 1–9999. It has no timezone, clock time, or daylight-saving behavior.

`dayOfWeek` returns Sunday=0 through Saturday=6. ISO week helpers instead report ISO weekday Monday=1 through Sunday=7.

Month/year arithmetic defaults to constraining the day to the last day of the destination month; `{ overflow: 'reject' }` throws when a date such as January 31 cannot be represented in the target month.
