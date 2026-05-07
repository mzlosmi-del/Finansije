import { prisma } from "@/lib/db";
import { Kind } from "@prisma/client";
import {
  addCategoryAction,
  deleteCategoryAction,
  renameUserAction,
  updateSettingsAction,
} from "@/lib/actions";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [users, expCats, revCats, settings] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({
      where: { kind: Kind.EXPENSE },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.category.findMany({
      where: { kind: Kind.REVENUE },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);

  const currency = settings?.currency ?? "EUR";
  const locale = settings?.locale ?? "de-DE";
  const monthly = (settings?.monthlySavingsTargetCents ?? 0) / 100;
  const yearly = (settings?.yearlySavingsTargetCents ?? 0) / 100;

  const decimalSep = (1.1).toLocaleString(locale).includes(",") ? "," : ".";
  const fmtAmt = (n: number) =>
    n
      .toLocaleString(locale, { maximumFractionDigits: 2 })
      .replace(/ | /g, "");

  return (
    <div className="space-y-4 pt-2">
      <section className="card">
        <div className="label mb-2">Savings targets</div>
        <form action={updateSettingsAction} className="space-y-3">
          <div>
            <label className="label">Monthly target</label>
            <input
              name="monthly"
              defaultValue={monthly ? fmtAmt(monthly) : ""}
              inputMode="decimal"
              placeholder={`0${decimalSep}00`}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="label">Yearly target</label>
            <input
              name="yearly"
              defaultValue={yearly ? fmtAmt(yearly) : ""}
              inputMode="decimal"
              placeholder={`0${decimalSep}00`}
              className="input mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Currency</label>
              <input
                name="currency"
                defaultValue={currency}
                className="input mt-1 uppercase"
                maxLength={3}
              />
            </div>
            <div>
              <label className="label">Locale</label>
              <input
                name="locale"
                defaultValue={locale}
                className="input mt-1"
                placeholder="de-DE"
              />
            </div>
          </div>
          <div className="text-muted text-xs">
            Preview: {formatMoney(123456, currency, locale)}
          </div>
          <button type="submit" className="btn-primary w-full">
            Save
          </button>
        </form>
      </section>

      <section className="card">
        <div className="label mb-2">Members</div>
        <ul className="space-y-3">
          {users.map((u) => (
            <li key={u.id}>
              <form action={renameUserAction} className="flex gap-2 items-center">
                <input type="hidden" name="id" value={u.id} />
                <input
                  type="color"
                  name="color"
                  defaultValue={u.color}
                  className="h-10 w-10 rounded-lg bg-transparent border border-white/10 shrink-0"
                />
                <input
                  type="text"
                  name="name"
                  defaultValue={u.name}
                  className="input"
                />
                <button type="submit" className="btn-ghost shrink-0">
                  Save
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <CategorySection
        title="Expense categories"
        kind={Kind.EXPENSE}
        cats={expCats}
      />
      <CategorySection
        title="Revenue categories"
        kind={Kind.REVENUE}
        cats={revCats}
      />
    </div>
  );
}

function CategorySection({
  title,
  kind,
  cats,
}: {
  title: string;
  kind: Kind;
  cats: { id: string; name: string; icon: string; color: string }[];
}) {
  return (
    <section className="card">
      <div className="label mb-2">{title}</div>
      <ul className="space-y-1.5 mb-3">
        {cats.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2"
          >
            <span
              className="h-7 w-7 rounded-full flex items-center justify-center"
              style={{ background: `${c.color}25` }}
            >
              {c.icon}
            </span>
            <span className="flex-1 truncate">{c.name}</span>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={c.id} />
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
      <form action={addCategoryAction} className="grid grid-cols-[44px_44px_1fr_auto] gap-2">
        <input type="hidden" name="kind" value={kind} />
        <input
          name="icon"
          defaultValue="•"
          maxLength={2}
          className="input text-center"
        />
        <input
          type="color"
          name="color"
          defaultValue="#7c5cff"
          className="h-full rounded-xl bg-transparent border border-white/10"
        />
        <input
          name="name"
          placeholder="Category name"
          className="input"
          required
        />
        <button type="submit" className="btn-primary">
          Add
        </button>
      </form>
    </section>
  );
}
