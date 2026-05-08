import Link from "next/link";
import { monthSummary, yearSummary } from "@/lib/calc";
import { todayParts, monthLabel, shiftMonth } from "@/lib/dates";
import { Money } from "@/components/MoneyText";
import { prisma } from "@/lib/db";
import { Kind } from "@prisma/client";
import { monthRange } from "@/lib/dates";
import { deleteTransactionAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Dashboard({
  searchParams,
}: {
  searchParams?: { y?: string; m?: string };
}) {
  const today = todayParts();
  const year = Number(searchParams?.y ?? today.y);
  const monthIndex0 = Number(searchParams?.m ?? today.m);

  const [m, y] = await Promise.all([
    monthSummary(year, monthIndex0),
    yearSummary(year),
  ]);

  const { start, end } = monthRange(year, monthIndex0);
  const recentTxns = await prisma.transaction.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 10,
    include: { user: true, category: true },
  });

  const currency = m.settings.currency;
  const locale = m.settings.locale;
  const monthlyTarget = m.settings.monthlySavingsTargetCents;
  const monthlySaved = m.total.net;
  const monthlyPct =
    monthlyTarget > 0
      ? Math.max(0, Math.min(100, Math.round((monthlySaved / monthlyTarget) * 100)))
      : 0;

  const yearlyTarget = m.settings.yearlySavingsTargetCents;
  const yearlySaved = y.total.net;
  const yearlyPct =
    yearlyTarget > 0
      ? Math.max(0, Math.min(100, Math.round((yearlySaved / yearlyTarget) * 100)))
      : 0;

  const prev = shiftMonth(year, monthIndex0, -1);
  const next = shiftMonth(year, monthIndex0, 1);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <Link
          href={`/?y=${prev.year}&m=${prev.monthIndex0}`}
          className="btn-ghost text-sm"
          aria-label="Prethodni mesec"
        >
          ←
        </Link>
        <div className="text-center">
          <div className="label">Mesec</div>
          <div className="font-semibold capitalize text-ink">
            {monthLabel(year, monthIndex0, locale)}
          </div>
        </div>
        <Link
          href={`/?y=${next.year}&m=${next.monthIndex0}`}
          className="btn-ghost text-sm"
          aria-label="Sledeći mesec"
        >
          →
        </Link>
      </div>

      <section className="card">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="label">Saldo ovog meseca</div>
            <div className="text-3xl font-bold tabular-nums">
              <Money
                cents={m.total.net}
                currency={currency}
                locale={locale}
                signed
                className={m.total.net >= 0 ? "text-good" : "text-bad"}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="label">Prihodi</div>
            <div className="text-good font-semibold tabular-nums">
              <Money
                cents={m.total.revenue}
                currency={currency}
                locale={locale}
              />
            </div>
            <div className="label mt-1">Rashodi</div>
            <div className="text-bad font-semibold tabular-nums">
              <Money
                cents={m.total.expense}
                currency={currency}
                locale={locale}
              />
            </div>
          </div>
        </div>

        {monthlyTarget > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                Cilj štednje{" "}
                <Money
                  cents={monthlyTarget}
                  currency={currency}
                  locale={locale}
                />
              </span>
              <span
                className={
                  monthlySaved >= monthlyTarget ? "text-good" : "text-warn"
                }
              >
                {monthlyPct}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className={`h-full ${
                  monthlySaved >= monthlyTarget ? "bg-good" : "bg-warn"
                }`}
                style={{ width: `${monthlyPct}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="label mb-3">Po osobi</div>
        <div className="grid grid-cols-1 gap-3">
          {m.perUser.map((p) => (
            <div
              key={p.user.id}
              className="rounded-xl bg-black/[0.035] border border-line p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ background: p.user.color }}
                />
                <div className="min-w-0">
                  <div className="font-medium truncate text-ink">{p.user.name}</div>
                  <div className="text-xs text-muted">
                    Prih <Money cents={p.revenue} currency={currency} locale={locale} />
                    {" · "}Rash <Money cents={p.expense} currency={currency} locale={locale} />
                  </div>
                </div>
              </div>
              <div
                className={`tabular-nums font-semibold ${
                  p.net >= 0 ? "text-good" : "text-bad"
                }`}
              >
                <Money cents={p.net} currency={currency} locale={locale} signed />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="label">Godina {year} · Saldo</div>
            <div className="text-xl font-semibold tabular-nums">
              <Money
                cents={y.total.net}
                currency={currency}
                locale={locale}
                signed
                className={y.total.net >= 0 ? "text-good" : "text-bad"}
              />
            </div>
          </div>
          {yearlyTarget > 0 && (
            <div className="text-right text-sm">
              <div className="label">Cilj</div>
              <div className="text-ink">
                <Money
                  cents={yearlyTarget}
                  currency={currency}
                  locale={locale}
                />
              </div>
            </div>
          )}
        </div>
        {yearlyTarget > 0 && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className={`h-full ${
                yearlySaved >= yearlyTarget ? "bg-good" : "bg-warn"
              }`}
              style={{ width: `${yearlyPct}%` }}
            />
          </div>
        )}
      </section>

      <section className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="label">Skorašnji unosi</div>
          <Link href="/history" className="text-sm text-accent">
            Prikaži sve
          </Link>
        </div>
        {recentTxns.length === 0 ? (
          <div className="text-muted text-sm py-6 text-center">
            Još nema unosa. Pritisnite ＋ da dodate.
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recentTxns.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 py-2.5"
              >
                <div
                  className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-base"
                  style={{ background: `${t.category.color}20` }}
                >
                  <span>{t.category.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate text-ink">
                      {t.description || t.category.name}
                    </span>
                  </div>
                  <div className="text-xs text-muted truncate">
                    {t.category.name} ·{" "}
                    <span style={{ color: t.user.color }}>{t.user.name}</span>{" "}
                    ·{" "}
                    {new Date(t.date).toLocaleDateString(locale, {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                </div>
                <div
                  className={`tabular-nums font-semibold ${
                    t.kind === Kind.REVENUE ? "text-good" : "text-bad"
                  }`}
                >
                  {t.kind === Kind.REVENUE ? "+" : "−"}
                  <Money
                    cents={t.amountCents}
                    currency={currency}
                    locale={locale}
                  />
                </div>
                <form action={deleteTransactionAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    aria-label="Obriši"
                    className="text-muted hover:text-bad px-1"
                  >
                    ✕
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
