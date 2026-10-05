import type { MonthlyPoint } from "@/lib/charts";
import { formatMoney } from "@/lib/money";

// Read from the theme CSS variables (defined in globals.css) so chart colors
// always match the rest of the app and never drift from tailwind.config.ts.
const COLOR_REVENUE = "var(--c-good)";
const COLOR_EXPENSE = "var(--c-bad)";
const COLOR_LIMIT = "var(--c-accent)";
const COLOR_GRID = "var(--c-line)";
const COLOR_AXIS = "var(--c-axis)";
const COLOR_INK = "var(--c-ink)";

export function MonthlyChart({
  points,
  target,
  currency,
  locale,
}: {
  points: MonthlyPoint[];
  target: number;
  currency: string;
  locale: string;
}) {
  const W = 640;
  const H = 280;
  const padL = 44;
  const padR = 12;
  const padT = 16;
  const padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Expense limit per month: the most that can be spent (recurring + one-off)
  // while still saving the target, i.e. revenue − savings target. Months with
  // no revenue yet (e.g. future months) get no limit.
  const limits = points.map((p) =>
    target > 0 && p.revenue > 0 ? Math.max(0, p.revenue - target) : null
  );
  const hasLimit = limits.some((l) => l !== null);

  const rawMax = Math.max(
    ...points.flatMap((p) => [p.revenue, p.expense]),
    1
  );
  const max = niceCeil(rawMax);
  const yToPx = (v: number) => padT + innerH - (v / max) * innerH;

  const groupW = innerW / Math.max(points.length, 1);
  const barGap = 3;
  const barW = Math.max(2, (groupW - 6) / 2 - barGap / 2);

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const fmtCompact = (cents: number) => formatCompactMoney(cents, currency, locale);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
        role="img"
        aria-label="Mesečni pregled prihoda i rashoda"
      >
        {/* Grid + Y labels */}
        {ticks.map((t) => {
          const y = padT + innerH * (1 - t);
          const v = max * t;
          return (
            <g key={t}>
              <line
                x1={padL}
                x2={W - padR}
                y1={y}
                y2={y}
                stroke={COLOR_GRID}
                strokeDasharray={t === 0 ? "0" : "3 3"}
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill={COLOR_AXIS}
              >
                {fmtCompact(v)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {points.map((p, i) => {
          const groupX = padL + i * groupW + (groupW - (barW * 2 + barGap)) / 2;
          const xRev = groupX;
          const xExp = groupX + barW + barGap;
          const yRev = yToPx(p.revenue);
          const yExp = yToPx(p.expense);
          const labelY = padT + innerH + 16;
          return (
            <g key={`${p.year}-${p.monthIndex0}`}>
              <rect
                x={xRev}
                y={yRev}
                width={barW}
                height={padT + innerH - yRev}
                fill={COLOR_REVENUE}
                rx={2}
              />
              <rect
                x={xExp}
                y={yExp}
                width={barW}
                height={padT + innerH - yExp}
                fill={COLOR_EXPENSE}
                rx={2}
              />
              <text
                x={padL + i * groupW + groupW / 2}
                y={labelY}
                textAnchor="middle"
                fontSize="10"
                fill={COLOR_INK}
              >
                {p.label}
              </text>
            </g>
          );
        })}

        {/* Expense limit (revenue − savings target), one step per month */}
        {limits.map((l, i) => {
          if (l === null) return null;
          const y = yToPx(l);
          const x1 = padL + i * groupW + 2;
          const x2 = padL + (i + 1) * groupW - 2;
          return (
            <line
              key={`limit-${i}`}
              x1={x1}
              x2={x2}
              y1={y}
              y2={y}
              stroke={COLOR_LIMIT}
              strokeWidth={2}
              strokeDasharray="5 3"
              strokeLinecap="round"
            >
              <title>Limit rashoda {fmtCompact(l)}</title>
            </line>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <LegendDot color={COLOR_REVENUE} label="Prihodi" />
        <LegendDot color={COLOR_EXPENSE} label="Rashodi" />
        {hasLimit && (
          <span className="inline-flex items-center gap-2">
            <svg width="22" height="6" aria-hidden>
              <line
                x1="0"
                y1="3"
                x2="22"
                y2="3"
                stroke={COLOR_LIMIT}
                strokeWidth="2"
                strokeDasharray="4 3"
              />
            </svg>
            <span className="text-muted">Limit rashoda (za cilj štednje)</span>
          </span>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block h-2.5 w-3 rounded-sm"
        style={{ background: color }}
      />
      <span className="text-muted">{label}</span>
    </span>
  );
}

function niceCeil(value: number) {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  let nice: number;
  if (f <= 1) nice = 1;
  else if (f <= 2) nice = 2;
  else if (f <= 2.5) nice = 2.5;
  else if (f <= 5) nice = 5;
  else nice = 10;
  return nice * exp;
}

function formatCompactMoney(cents: number, currency: string, locale: string) {
  const n = cents / 100;
  if (Math.abs(n) >= 1000) {
    const k = n / 1000;
    const decimals = Math.abs(k) >= 10 ? 0 : 1;
    return `${k.toFixed(decimals)}k`;
  }
  return formatMoney(cents, currency, locale).replace(/\s?[A-Za-z€$£]+\s?/g, "");
}
