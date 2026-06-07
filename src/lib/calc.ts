import { prisma } from "@/lib/db";
import { Kind, Period } from "@prisma/client";
import {
  monthRange,
  yearRange,
  elapsedMonthsInYear,
  monthHasStarted,
} from "@/lib/dates";

export type DashboardUserRow = {
  user: { id: string; name: string; color: string };
  expense: number;
  /** Recurring portion of the expense (projected from the Recurring table). */
  recurringExpense: number;
  /** One-off, non-recurring expense entered as transactions this period. */
  oneOffExpense: number;
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

  type Bucket = {
    recurringExpense: number;
    oneOffExpense: number;
    revenue: number;
  };
  type Acc = Map<string, Bucket>;
  const newAcc = (): Acc => {
    const m: Acc = new Map();
    for (const u of users)
      m.set(u.id, { recurringExpense: 0, oneOffExpense: 0, revenue: 0 });
    return m;
  };

  const monthAcc = newAcc();
  const yearAcc = newAcc();

  // For the year total, only count recurring entries for months that have
  // already happened (elapsed), so future recurring revenue/expenses are not
  // included. A MONTHLY recurring accrues once per elapsed month; a YEARLY
  // recurring accrues proportionally as the year elapses.
  const elapsed = elapsedMonthsInYear(year);
  // The selected month only gets its recurring projection if it has started;
  // future months show nothing recurring (only entries that have happened).
  const selectedMonthStarted = monthHasStarted(year, monthIndex0);

  // Recurring entries: project monthly and yearly contributions.
  for (const r of recurring) {
    const monthlyShare = !selectedMonthStarted
      ? 0
      : r.period === Period.MONTHLY
      ? r.amountCents
      : r.amountCents / 12;
    const yearlyShare =
      r.period === Period.YEARLY
        ? (r.amountCents * elapsed) / 12
        : r.amountCents * elapsed;
    const mb = monthAcc.get(r.userId);
    const yb = yearAcc.get(r.userId);
    if (!mb || !yb) continue;
    if (r.kind === Kind.EXPENSE) {
      mb.recurringExpense += monthlyShare;
      yb.recurringExpense += yearlyShare;
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
    if (row.kind === Kind.EXPENSE) b.oneOffExpense += v;
    else b.revenue += v;
  }
  // One-off transactions for the full year.
  for (const row of txnsThisYearAgg) {
    const b = yearAcc.get(row.userId);
    if (!b) continue;
    const v = row._sum.amountCents ?? 0;
    if (row.kind === Kind.EXPENSE) b.oneOffExpense += v;
    else b.revenue += v;
  }

  const toRow = (b: Bucket | undefined, u: (typeof users)[number]): DashboardUserRow => {
    const bucket = b ?? { recurringExpense: 0, oneOffExpense: 0, revenue: 0 };
    const recurringExpense = Math.round(bucket.recurringExpense);
    const oneOffExpense = Math.round(bucket.oneOffExpense);
    const revenue = Math.round(bucket.revenue);
    const expense = recurringExpense + oneOffExpense;
    return {
      user: u,
      expense,
      recurringExpense,
      oneOffExpense,
      revenue,
      net: revenue - expense,
    };
  };
  const monthPerUser: DashboardUserRow[] = users.map((u) =>
    toRow(monthAcc.get(u.id), u)
  );
  const yearPerUser: DashboardUserRow[] = users.map((u) =>
    toRow(yearAcc.get(u.id), u)
  );

  const sumTotals = (rows: DashboardUserRow[]) =>
    rows.reduce(
      (a, p) => ({
        expense: a.expense + p.expense,
        recurringExpense: a.recurringExpense + p.recurringExpense,
        oneOffExpense: a.oneOffExpense + p.oneOffExpense,
        revenue: a.revenue + p.revenue,
        net: a.net + p.net,
      }),
      { expense: 0, recurringExpense: 0, oneOffExpense: 0, revenue: 0, net: 0 }
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
      locale: "sr-Latn-RS",
    },
    recentTxns,
  };
}
