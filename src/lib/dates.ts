export function monthRange(year: number, monthIndex0: number) {
  const start = new Date(Date.UTC(year, monthIndex0, 1));
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 1));
  return { start, end };
}

export function yearRange(year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  return { start, end };
}

export function todayParts() {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth(), day: d.getDate() };
}

/**
 * How many months of the given year have already started (and therefore
 * "happened"). Past years → 12, future years → 0, current year → number of
 * months up to and including the current one (1..12).
 */
export function elapsedMonthsInYear(year: number) {
  const now = new Date();
  const y = now.getFullYear();
  if (year < y) return 12;
  if (year > y) return 0;
  return now.getMonth() + 1;
}

/** True if the given month (0-based) of the given year has already started. */
export function monthHasStarted(year: number, monthIndex0: number) {
  const now = new Date();
  const cur = new Date(now.getFullYear(), now.getMonth(), 1);
  const target = new Date(year, monthIndex0, 1);
  return target <= cur;
}

export function monthLabel(year: number, monthIndex0: number, locale = "sr-Latn-RS") {
  return new Date(year, monthIndex0, 1).toLocaleString(locale, {
    month: "long",
    year: "numeric",
  });
}

export function shiftMonth(year: number, monthIndex0: number, delta: number) {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { year: d.getFullYear(), monthIndex0: d.getMonth() };
}
