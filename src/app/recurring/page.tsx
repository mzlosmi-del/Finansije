import { prisma } from "@/lib/db";
import { Kind, Period } from "@prisma/client";
import { Money } from "@/components/MoneyText";
import {
  addRecurringAction,
  deleteRecurringAction,
} from "@/lib/actions";
import { getCurrentPerson } from "@/lib/person";
import { RecurringForm } from "@/components/RecurringForm";

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
                <li key={r.id} className="flex items-center gap-3 py-2.5">
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
      ))}
    </div>
  );
}
