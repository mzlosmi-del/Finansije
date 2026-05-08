import { prisma } from "@/lib/db";
import { Kind, Period } from "@prisma/client";
import { monthRange, yearRange } from "@/lib/dates";

export type DashboardUserRow = {
  user: { id: string; name: string; color: string };
  expense: number;
  revenue: number;
  net: number;
};

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

/**
 * Fetches everything the dashboard needs in a single round of parallel
 * queries (6) and aggregates per-user totals in JS, replacing the older
 * implementation that did ~15 round trips.
 */
export async function getDashboardData(year: number, monthIndex0: number) {
  const month = monthRange(year, monthIndex0);
  const yearR = yearRange(year);

  const [
    users,
    settings,
    recurring,
    txnsThisMonthAgg,
    txnsThisYearAgg,
    recentTxns,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.recurring.findMany({
      select: {
        userId: true,
        kind: true,
        period: true,
        amountCents: true,
      },
    }),
    prisma.transaction.groupBy({
      by: ["userId", "kind"],
      where: { date: { gte: month.start, lt: month.end } },
      _sum: { amountCents: true },
    }),
    prisma.transaction.groupBy({
      by: ["userId", "kind"],
      where: { date: { gte: yearR.start, lt: yearR.end } },
      _sum: { amountCents: true },
    }),
    prisma.transaction.findMany({
      where: { date: { gte: month.start, lt: month.end } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 10,
      include: { user: true, category: true },
    }),
  ]);

  type Acc = Map<string, { expense: number; revenue: number }>;
  const newAcc = (): Acc => {
    const m: Acc = new Map();
    for (const u of users) m.set(u.id, { expense: 0, revenue: 0 });
    return m;
  };

  const monthAcc = newAcc();
  const yearAcc = newAcc();

  // Recurring entries: project monthly and yearly contributions.
  for (const r of recurring) {
    const monthlyShare =
      r.period === Period.MONTHLY ? r.amountCents : r.amountCents / 12;
    const yearlyShare =
      r.period === Period.YEARLY ? r.amountCents : r.amountCents * 12;
    const mb = monthAcc.get(r.userId);
    const yb = yearAcc.get(r.userId);
    if (!mb || !yb) continue;
    if (r.kind === Kind.EXPENSE) {
      mb.expense += monthlyShare;
      yb.expense += yearlyShare;
    } else {
      mb.revenue += monthlyShare;
      yb.revenue += yearlyShare;
    }
  }

  // One-off transactions for the selected month.
  for (const row of txnsThisMonthAgg) {
    const b = monthAcc.get(row.userId);
    if (!b) continue;
    const v = row._sum.amountCents ?? 0;
    if (row.kind === Kind.EXPENSE) b.expense += v;
    else b.revenue += v;
  }
  // One-off transactions for the full year.
  for (const row of txnsThisYearAgg) {
    const b = yearAcc.get(row.userId);
    if (!b) continue;
    const v = row._sum.amountCents ?? 0;
    if (row.kind === Kind.EXPENSE) b.expense += v;
    else b.revenue += v;
  }

  const monthPerUser: DashboardUserRow[] = users.map((u) => {
    const b = monthAcc.get(u.id) ?? { expense: 0, revenue: 0 };
    return {
      user: u,
      expense: Math.round(b.expense),
      revenue: Math.round(b.revenue),
      net: Math.round(b.revenue - b.expense),
    };
  });
  const yearPerUser: DashboardUserRow[] = users.map((u) => {
    const b = yearAcc.get(u.id) ?? { expense: 0, revenue: 0 };
    return {
      user: u,
      expense: Math.round(b.expense),
      revenue: Math.round(b.revenue),
      net: Math.round(b.revenue - b.expense),
    };
  });

  const sumTotals = (rows: DashboardUserRow[]) =>
    rows.reduce(
      (a, p) => ({
        expense: a.expense + p.expense,
        revenue: a.revenue + p.revenue,
        net: a.net + p.net,
      }),
      { expense: 0, revenue: 0, net: 0 }
    );

  return {
    month: {
      perUser: monthPerUser,
      total: sumTotals(monthPerUser),
      range: month,
    },
    year: {
      perUser: yearPerUser,
      total: sumTotals(yearPerUser),
    },
    settings: settings ?? {
      id: 1,
      monthlySavingsTargetCents: 0,
      yearlySavingsTargetCents: 0,
      currency: "EUR",
      locale: "sr-RS",
    },
    recentTxns,
  };
}
