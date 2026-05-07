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

export function monthLabel(year: number, monthIndex0: number, locale = "de-DE") {
  return new Date(year, monthIndex0, 1).toLocaleString(locale, {
    month: "long",
    year: "numeric",
  });
}

export function shiftMonth(year: number, monthIndex0: number, delta: number) {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { year: d.getFullYear(), monthIndex0: d.getMonth() };
}
