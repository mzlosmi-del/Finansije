export function parseAmountToCents(input: string): number {
  if (!input) return 0;
  // Accept "1.234,56", "1,234.56", "1234.56", "1234,56", "1234"
  const cleaned = input.replace(/\s/g, "").replace(/[^0-9.,-]/g, "");
  if (!cleaned) return 0;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized: string;
  if (lastComma === -1 && lastDot === -1) {
    normalized = cleaned;
  } else if (lastComma > lastDot) {
    // comma is decimal
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // dot is decimal
    normalized = cleaned.replace(/,/g, "");
  }
  const n = Number(normalized);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function formatMoney(
  cents: number,
  currency = "EUR",
  locale = "sr-Latn-RS"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatShort(cents: number, locale = "sr-Latn-RS"): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}
