import { getMonthlyChartData } from "@/lib/charts";
import { MonthlyChart } from "@/components/MonthlyChart";
import { Money } from "@/components/MoneyText";

export const dynamic = "force-dynamic";

export default async function ChartsPage({
  searchParams,
}: {
  searchParams?: { range?: string };
}) {
  const range = clampRange(Number(searchParams?.range ?? 12));
  const data = await getMonthlyChartData(range);

  const totals = data.points.reduce(
    (a, p) => ({
      revenue: a.revenue + p.revenue,
      expense: a.expense + p.expense,
    }),
    { revenue: 0, expense: 0 }
  );
  const net = totals.revenue - totals.expense;
  const avgNet = data.points.length > 0 ? Math.round(net / data.points.length) : 0;

  const ranges = [3, 6, 12, 24];

  return (
    <div className="space-y-4 pt-2">
      <div className="card">
        <div className="flex items-center justify-between gap-2">
          <div className="label">Pregled · poslednjih {range} meseci</div>
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
          {ranges.map((r) => (
            <a
              key={r}
              href={`/charts?range=${r}`}
              className={`chip ${r === range ? "chip-active" : ""}`}
            >
              {r}m
            </a>
          ))}
        </div>
        <div className="mt-4 -mx-1">
          <MonthlyChart
            points={data.points}
            target={data.monthlyTarget}
            currency={data.currency}
            locale={data.locale}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center">
          <div className="label">Prihodi</div>
          <div className="text-good font-semibold tabular-nums">
            <Money
              cents={totals.revenue}
              currency={data.currency}
              locale={data.locale}
            />
          </div>
        </div>
        <div className="card text-center">
          <div className="label">Rashodi</div>
          <div className="text-bad font-semibold tabular-nums">
            <Money
              cents={totals.expense}
              currency={data.currency}
              locale={data.locale}
            />
          </div>
        </div>
        <div className="card text-center">
          <div className="label">Prosečan saldo</div>
          <div
            className={`font-semibold tabular-nums ${
              avgNet >= 0 ? "text-good" : "text-bad"
            }`}
          >
            <Money
              cents={avgNet}
              currency={data.currency}
              locale={data.locale}
              signed
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="label mb-2">Po mesecu</div>
        <ul className="divide-y divide-line">
          {[...data.points].reverse().map((p) => {
            const net = p.revenue - p.expense;
            return (
              <li
                key={`${p.year}-${p.monthIndex0}`}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="text-ink capitalize">
                  {new Date(p.year, p.monthIndex0, 1).toLocaleDateString(
                    data.locale,
                    { month: "long", year: "numeric" }
                  )}
                </span>
                <span className="flex items-center gap-3 tabular-nums">
                  <span className="text-good">
                    +<Money cents={p.revenue} currency={data.currency} locale={data.locale} />
                  </span>
                  <span className="text-bad">
                    −<Money cents={p.expense} currency={data.currency} locale={data.locale} />
                  </span>
                  <span
                    className={`font-semibold ${
                      net >= 0 ? "text-good" : "text-bad"
                    }`}
                  >
                    <Money cents={net} currency={data.currency} locale={data.locale} signed />
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function clampRange(n: number) {
  const allowed = [3, 6, 12, 24];
  return allowed.includes(n) ? n : 12;
}
