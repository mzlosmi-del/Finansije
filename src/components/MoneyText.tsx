import { formatMoney } from "@/lib/money";

export function Money({
  cents,
  currency = "EUR",
  locale = "sr-Latn-RS",
  signed = false,
  className = "",
}: {
  cents: number;
  currency?: string;
  locale?: string;
  signed?: boolean;
  className?: string;
}) {
  const sign = signed && cents > 0 ? "+" : "";
  return (
    <span className={className}>
      {sign}
      {formatMoney(cents, currency, locale)}
    </span>
  );
}
