import { getMonthlyChartData } from "@/lib/charts";
import { MonthlyChart } from "@/components/MonthlyChart";
import { Money } from "@/components/MoneyText";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ChartsPage({
  searchParams,
}: {
  searchParams?: { range?: string; user?: string };
}) {
  const range = clampRange(Number(searchParams?.range ?? 12));
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });
  const requestedUser = searchParams?.user ?? "all";
  const activeUserId =
    requestedUser !== "all" && users.some((u) => u.id === requestedUser)
      ? requestedUser
      : null;
  const activeUser = activeUserId
    ? users.find((u) => u.id === activeUserId) ?? null
    : null;

  const data = await getMonthlyChartData(range, activeUserId ?? undefined);

  const totals = data.points.reduce(
    (a, p) => ({
      revenue: a.revenue + p.revenue,
      expense: a.expense + p.expense,
    }),
    { revenue: 0, expense: 0 }
  );
  const net = totals.revenue - totals.expense;
  const avgNet = data.points.length > 0 ? Math.round(net / data.points.length) : 0;

  // Pro-rate the household savings target when filtered to one person.
  const target =
    activeUserId && users.length > 0
      ? Math.round(data.monthlyTarget / users.length)
      : data.monthlyTarget;

  const ranges = [3, 6, 12, 24];
  const buildHref = (next: { range?: number; user?: string }) => {
    const r = next.range ?? range;
    const u = next.user ?? requestedUser;
    return `/charts?range=${r}${u && u !== "all" ? `&user=${u}` : ""}`;
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="card">
        <div className="label">Pregled · poslednjih {range} meseci</div>
        <div className="mt-1 flex flex-wrap gap-2">
          {ranges.map((r) => (
            <a
              key={r}
              href={buildHref({ range: r })}
              className={`chip ${r === range ? "chip-active" : ""}`}
            >
              {r}m
            </a>
          ))}
        </div>

        <div className="mt-3 label">Osoba</div>
        <div className="mt-1 flex flex-wrap gap-2">
          <a
            href={buildHref({ user: "all" })}
            className={`chip ${activeUserId === null ? "chip-active" : ""}`}
          >
            Svi
          </a>
          {users.map((u) => {
            const active = u.id === activeUserId;
            return (
              <a
                key={u.id}
                href={buildHref({ user: u.id })}
                className="chip"
                style={
                  active
                    ? { background: u.color, color: "white" }
                    : { background: `${u.color}1A`, color: "#0f172a" }
                }
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: active ? "rgba(255,255,255,0.9)" : u.color }}
                />
                {u.name}
              </a>
            );
          })}
        </div>

        <div className="mt-4 -mx-1">
          <MonthlyChart
            points={data.points}
            target={target}
            currency={data.currency}
            locale={data.locale}
          />
        </div>
        {activeUser && (
          <div className="mt-2 text-xs text-muted">
            Cilj prikazan kao udeo po osobi (ukupan cilj ÷ broj članova).
          </div>
        )}
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
