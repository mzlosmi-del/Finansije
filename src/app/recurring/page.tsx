import { prisma } from "@/lib/db";
import { Kind, Period } from "@prisma/client";
import { Money } from "@/components/MoneyText";
import {
  addRecurringAction,
  deleteRecurringAction,
  updateRecurringDatesAction,
} from "@/lib/actions";
import { getCurrentPerson } from "@/lib/person";
import { RecurringForm } from "@/components/RecurringForm";
import { toDateInput } from "@/lib/dates";

function formatDate(d: Date, locale: string) {
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatRange(start: Date | null, end: Date | null, locale: string) {
  const from = start ? `od ${formatDate(start, locale)}` : "od početka";
  const to = end ? `do ${formatDate(end, locale)}` : "bez kraja";
  return `${from} · ${to}`;
}

function isEnded(end: Date | null) {
  // The end date is inclusive, so the entry is over only from the next day.
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return end !== null && end < todayUtc;
}

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const [recs, expenseCats, revenueCats, settings, { user, users }] =
    await Promise.all([
      prisma.recurring.findMany({
        orderBy: [{ kind: "asc" }, { period: "asc" }, { createdAt: "desc" }],
        include: { user: true, category: true },
      }),
      prisma.category.findMany({
        where: { kind: Kind.EXPENSE },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.category.findMany({
        where: { kind: Kind.REVENUE },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.settings.findUnique({ where: { id: 1 } }),
      getCurrentPerson(),
    ]);

  const currency = settings?.currency ?? "EUR";
  const locale = settings?.locale ?? "sr-Latn-RS";

  const sections: { title: string; items: typeof recs }[] = [
    {
      title: "Mesečni rashodi",
      items: recs.filter((r) => r.kind === Kind.EXPENSE && r.period === Period.MONTHLY),
    },
    {
      title: "Godišnji rashodi",
      items: recs.filter((r) => r.kind === Kind.EXPENSE && r.period === Period.YEARLY),
    },
    {
      title: "Mesečni prihodi",
      items: recs.filter((r) => r.kind === Kind.REVENUE && r.period === Period.MONTHLY),
    },
    {
      title: "Godišnji prihodi",
      items: recs.filter((r) => r.kind === Kind.REVENUE && r.period === Period.YEARLY),
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      <RecurringForm
        users={users}
        currentUserId={user?.id ?? ""}
        expenseCategories={expenseCats}
        revenueCategories={revenueCats}
        currency={currency}
        locale={locale}
        action={addRecurringAction}
      />

      {sections.map((sec) => (
        <section key={sec.title} className="card">
          <div className="label mb-2">{sec.title}</div>
          {sec.items.length === 0 ? (
            <div className="text-muted text-sm py-2">Još nema unosa.</div>
          ) : (
            <ul className="divide-y divide-line">
              {sec.items.map((r) => (
                <li key={r.id} className="py-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center"
                      style={{ background: `${r.category.color}20` }}
                    >
                      <span>{r.category.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-ink">
                        {r.description || r.category.name}
                      </div>
                      <div className="text-xs text-muted truncate">
                        {r.category.name} ·{" "}
                        <span style={{ color: r.user.color }}>{r.user.name}</span>
                        {r.period === Period.YEARLY && (
                          <>
                            {" · ÷12 = "}
                            <Money
                              cents={Math.round(r.amountCents / 12)}
                              currency={currency}
                              locale={locale}
                            />
                            /mes
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      className={`tabular-nums font-semibold ${
                        r.kind === Kind.REVENUE ? "text-good" : "text-bad"
                      }`}
                    >
                      {r.kind === Kind.REVENUE ? "+" : "−"}
                      <Money
                        cents={r.amountCents}
                        currency={currency}
                        locale={locale}
                      />
                    </div>
                    <form action={deleteRecurringAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        aria-label="Obriši"
                        className="tap text-muted hover:text-bad"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                  <details className="mt-1 pl-12">
                    <summary
                      className={`cursor-pointer text-xs ${
                        isEnded(r.endDate) ? "text-warn" : "text-muted"
                      }`}
                    >
                      {formatRange(r.startDate, r.endDate, locale)}
                      {isEnded(r.endDate) && " · završeno"}
                    </summary>
                    <form
                      action={updateRecurringDatesAction}
                      className="mt-2 grid grid-cols-2 gap-2"
                    >
                      <input type="hidden" name="id" value={r.id} />
                      <label className="block">
                        <span className="label mb-1 block">Od</span>
                        <input
                          type="date"
                          name="startDate"
                          required
                          defaultValue={toDateInput(r.startDate)}
                          className="input"
                        />
                      </label>
                      <label className="block">
                        <span className="label mb-1 block">Do (prazno = bez kraja)</span>
                        <input
                          type="date"
                          name="endDate"
                          defaultValue={toDateInput(r.endDate)}
                          className="input"
                        />
                      </label>
                      <button type="submit" className="btn-primary col-span-2">
                        Sačuvaj datume
                      </button>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
