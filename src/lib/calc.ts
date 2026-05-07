import { prisma } from "@/lib/db";
import { Kind, Period } from "@prisma/client";
import { monthRange, yearRange } from "@/lib/dates";

export type PerUserAmount = { userId: string; amountCents: number };

function emptyMap(users: { id: string }[]) {
  const m = new Map<string, number>();
  for (const u of users) m.set(u.id, 0);
  return m;
}

function toArr(map: Map<string, number>): PerUserAmount[] {
  return [...map.entries()].map(([userId, amountCents]) => ({
    userId,
    amountCents,
  }));
}

/**
 * Returns recurring per-user totals already projected on a monthly basis.
 * Yearly recurring entries are divided by 12.
 */
export async function recurringMonthlyByUser(kind: Kind) {
  const [users, recs] = await Promise.all([
    prisma.user.findMany({ select: { id: true } }),
    prisma.recurring.findMany({ where: { kind } }),
  ]);
  const map = emptyMap(users);
  for (const r of recs) {
    const monthly =
      r.period === Period.MONTHLY ? r.amountCents : r.amountCents / 12;
    map.set(r.userId, (map.get(r.userId) ?? 0) + monthly);
  }
  // round per user
  for (const [k, v] of map) map.set(k, Math.round(v));
  return toArr(map);
}

export async function transactionsInRangeByUser(
  start: Date,
  end: Date,
  kind: Kind
) {
  const [users, txns] = await Promise.all([
    prisma.user.findMany({ select: { id: true } }),
    prisma.transaction.findMany({
      where: { kind, date: { gte: start, lt: end } },
      select: { userId: true, amountCents: true },
    }),
  ]);
  const map = emptyMap(users);
  for (const t of txns) map.set(t.userId, (map.get(t.userId) ?? 0) + t.amountCents);
  return toArr(map);
}

export async function monthSummary(year: number, monthIndex0: number) {
  const { start, end } = monthRange(year, monthIndex0);
  const [
    users,
    recExpense,
    recRevenue,
    txnExpense,
    txnRevenue,
    settings,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    recurringMonthlyByUser(Kind.EXPENSE),
    recurringMonthlyByUser(Kind.REVENUE),
    transactionsInRangeByUser(start, end, Kind.EXPENSE),
    transactionsInRangeByUser(start, end, Kind.REVENUE),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);

  const sumMap = (arr: PerUserAmount[]) => {
    const m = new Map<string, number>();
    for (const a of arr) m.set(a.userId, (m.get(a.userId) ?? 0) + a.amountCents);
    return m;
  };
  const expByUser = sumMap([...recExpense, ...txnExpense]);
  const revByUser = sumMap([...recRevenue, ...txnRevenue]);

  const perUser = users.map((u) => {
    const expense = expByUser.get(u.id) ?? 0;
    const revenue = revByUser.get(u.id) ?? 0;
    return {
      user: u,
      expense,
      revenue,
      net: revenue - expense,
      recurringExpense: recExpense.find((x) => x.userId === u.id)?.amountCents ?? 0,
      recurringRevenue: recRevenue.find((x) => x.userId === u.id)?.amountCents ?? 0,
      dailyExpense: txnExpense.find((x) => x.userId === u.id)?.amountCents ?? 0,
      dailyRevenue: txnRevenue.find((x) => x.userId === u.id)?.amountCents ?? 0,
    };
  });

  const total = perUser.reduce(
    (acc, p) => ({
      expense: acc.expense + p.expense,
      revenue: acc.revenue + p.revenue,
      net: acc.net + p.net,
    }),
    { expense: 0, revenue: 0, net: 0 }
  );

  return {
    perUser,
    total,
    settings: settings ?? {
      id: 1,
      monthlySavingsTargetCents: 0,
      yearlySavingsTargetCents: 0,
      currency: "EUR",
      locale: "de-DE",
    },
    range: { start, end },
  };
}

export async function yearSummary(year: number) {
  const { start, end } = yearRange(year);
  const [
    users,
    recExpense,
    recRevenue,
    txnExpense,
    txnRevenue,
    settings,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.recurring.findMany({ where: { kind: Kind.EXPENSE } }),
    prisma.recurring.findMany({ where: { kind: Kind.REVENUE } }),
    prisma.transaction.findMany({
      where: { kind: Kind.EXPENSE, date: { gte: start, lt: end } },
      select: { userId: true, amountCents: true },
    }),
    prisma.transaction.findMany({
      where: { kind: Kind.REVENUE, date: { gte: start, lt: end } },
      select: { userId: true, amountCents: true },
    }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);

  const yearOf = (r: { period: Period; amountCents: number }) =>
    r.period === Period.YEARLY ? r.amountCents : r.amountCents * 12;

  const sumByUser = (
    rec: { userId: string; period: Period; amountCents: number }[],
    txns: { userId: string; amountCents: number }[]
  ) => {
    const m = new Map<string, number>();
    for (const r of rec) m.set(r.userId, (m.get(r.userId) ?? 0) + yearOf(r));
    for (const t of txns)
      m.set(t.userId, (m.get(t.userId) ?? 0) + t.amountCents);
    return m;
  };

  const expByUser = sumByUser(recExpense, txnExpense);
  const revByUser = sumByUser(recRevenue, txnRevenue);

  const perUser = users.map((u) => ({
    user: u,
    expense: expByUser.get(u.id) ?? 0,
    revenue: revByUser.get(u.id) ?? 0,
    net: (revByUser.get(u.id) ?? 0) - (expByUser.get(u.id) ?? 0),
  }));
  const total = perUser.reduce(
    (a, p) => ({
      expense: a.expense + p.expense,
      revenue: a.revenue + p.revenue,
      net: a.net + p.net,
    }),
    { expense: 0, revenue: 0, net: 0 }
  );
  return {
    perUser,
    total,
    settings: settings ?? {
      id: 1,
      monthlySavingsTargetCents: 0,
      yearlySavingsTargetCents: 0,
      currency: "EUR",
      locale: "de-DE",
    },
  };
}
