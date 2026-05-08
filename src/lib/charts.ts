import { prisma } from "@/lib/db";
import { Kind, Period } from "@prisma/client";
import { monthRange } from "@/lib/dates";

export type MonthlyPoint = {
  year: number;
  monthIndex0: number;
  label: string;
  revenue: number;
  expense: number;
};

export async function getMonthlyChartData(
  monthsBack: number,
  userId?: string
) {
  const today = new Date();
  const months: { year: number; monthIndex0: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), monthIndex0: d.getMonth() });
  }

  const first = monthRange(months[0].year, months[0].monthIndex0);
  const last = monthRange(
    months[months.length - 1].year,
    months[months.length - 1].monthIndex0
  );

  const [settings, recurring, txns] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.recurring.findMany({
      where: userId ? { userId } : undefined,
      select: { kind: true, period: true, amountCents: true },
    }),
    prisma.transaction.findMany({
      where: {
        date: { gte: first.start, lt: last.end },
        ...(userId ? { userId } : {}),
      },
      select: { date: true, kind: true, amountCents: true },
    }),
  ]);

  const monthlyRecRevenue = recurring
    .filter((r) => r.kind === Kind.REVENUE)
    .reduce(
      (s, r) => s + (r.period === Period.MONTHLY ? r.amountCents : r.amountCents / 12),
      0
    );
  const monthlyRecExpense = recurring
    .filter((r) => r.kind === Kind.EXPENSE)
    .reduce(
      (s, r) => s + (r.period === Period.MONTHLY ? r.amountCents : r.amountCents / 12),
      0
    );

  const locale = settings?.locale ?? "sr-RS";
  const points: MonthlyPoint[] = months.map(({ year, monthIndex0 }) => {
    const range = monthRange(year, monthIndex0);
    const inMonth = txns.filter(
      (t) => t.date >= range.start && t.date < range.end
    );
    const revTx = inMonth
      .filter((t) => t.kind === Kind.REVENUE)
      .reduce((s, t) => s + t.amountCents, 0);
    const expTx = inMonth
      .filter((t) => t.kind === Kind.EXPENSE)
      .reduce((s, t) => s + t.amountCents, 0);
    return {
      year,
      monthIndex0,
      label: new Date(year, monthIndex0, 1)
        .toLocaleDateString(locale, { month: "short" })
        .replace(".", ""),
      revenue: Math.round(monthlyRecRevenue + revTx),
      expense: Math.round(monthlyRecExpense + expTx),
    };
  });

  return {
    points,
    monthlyTarget: settings?.monthlySavingsTargetCents ?? 0,
    currency: settings?.currency ?? "EUR",
    locale,
  };
}
