import { prisma } from "@/lib/db";
import { Money } from "@/components/MoneyText";
import { Kind } from "@prisma/client";
import { deleteTransactionAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [txns, settings] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200,
      include: { user: true, category: true },
    }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);
  const currency = settings?.currency ?? "EUR";
  const locale = settings?.locale ?? "de-DE";

  const groups = new Map<string, typeof txns>();
  for (const t of txns) {
    const k = new Date(t.date).toISOString().slice(0, 10);
    const arr = groups.get(k);
    if (arr) arr.push(t);
    else groups.set(k, [t]);
  }

  return (
    <div className="space-y-4 pt-2">
      {[...groups.entries()].map(([day, list]) => (
        <section key={day} className="card">
          <div className="label mb-2">
            {new Date(day).toLocaleDateString(locale, {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
          <ul className="divide-y divide-white/5">
            {list.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <div
                  className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center"
                  style={{ background: `${t.category.color}25` }}
                >
                  <span>{t.category.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {t.description || t.category.name}
                  </div>
                  <div className="text-xs text-muted truncate">
                    {t.category.name} ·{" "}
                    <span style={{ color: t.user.color }}>{t.user.name}</span>
                  </div>
                </div>
                <div
                  className={`tabular-nums font-semibold ${
                    t.kind === Kind.REVENUE ? "text-good" : "text-bad"
                  }`}
                >
                  {t.kind === Kind.REVENUE ? "+" : "−"}
                  <Money cents={t.amountCents} currency={currency} locale={locale} />
                </div>
                <form action={deleteTransactionAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    aria-label="Delete"
                    className="text-muted hover:text-bad px-1"
                  >
                    ✕
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {txns.length === 0 && (
        <div className="text-muted text-sm py-12 text-center">
          No entries yet.
        </div>
      )}
    </div>
  );
}
