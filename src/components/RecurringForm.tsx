"use client";

import { useMemo, useState, useTransition } from "react";
import { Kind, Period } from "@prisma/client";

type User = { id: string; name: string; color: string };
type Category = { id: string; name: string; kind: Kind; icon: string; color: string };

export function RecurringForm({
  users,
  currentUserId,
  expenseCategories,
  revenueCategories,
  currency,
  locale,
  action,
}: {
  users: User[];
  currentUserId: string;
  expenseCategories: Category[];
  revenueCategories: Category[];
  currency: string;
  locale: string;
  action: (fd: FormData) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>(Kind.EXPENSE);
  const [period, setPeriod] = useState<Period>(Period.MONTHLY);
  const [userId, setUserId] = useState<string>(currentUserId || users[0]?.id || "");
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cats = useMemo(
    () => (kind === Kind.EXPENSE ? expenseCategories : revenueCategories),
    [kind, expenseCategories, revenueCategories]
  );
  const decimalSep = (1.1).toLocaleString(locale).includes(",") ? "," : ".";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) return setError("Pick a person.");
    if (!categoryId) return setError("Pick a category.");
    if (!amount) return setError("Enter an amount.");

    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("categoryId", categoryId);
    fd.set("description", description);
    fd.set("amount", amount);
    fd.set("kind", kind);
    fd.set("period", period);
    start(async () => {
      try {
        await action(fd);
        setAmount("");
        setDescription("");
        setCategoryId("");
        setOpen(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed";
        setError(msg);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary w-full"
      >
        ＋ Add recurring entry
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">New recurring</div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted text-sm"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setKind(Kind.EXPENSE);
            setCategoryId("");
          }}
          className={`btn ${
            kind === Kind.EXPENSE ? "bg-bad text-white" : "bg-white/5 text-muted"
          }`}
        >
          − Expense
        </button>
        <button
          type="button"
          onClick={() => {
            setKind(Kind.REVENUE);
            setCategoryId("");
          }}
          className={`btn ${
            kind === Kind.REVENUE ? "bg-good text-white" : "bg-white/5 text-muted"
          }`}
        >
          + Revenue
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPeriod(Period.MONTHLY)}
          className={`btn ${
            period === Period.MONTHLY ? "bg-accent text-white" : "bg-white/5 text-muted"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setPeriod(Period.YEARLY)}
          className={`btn ${
            period === Period.YEARLY ? "bg-accent text-white" : "bg-white/5 text-muted"
          }`}
        >
          Yearly (÷12)
        </button>
      </div>

      <div>
        <label className="label">Amount</label>
        <input
          inputMode="decimal"
          pattern="[0-9.,]*"
          placeholder={`0${decimalSep}00`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-white/20"
        />
        <div className="text-muted text-xs mt-1">
          {currency} · {locale}
        </div>
      </div>

      <div>
        <div className="label mb-2">Category</div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => {
            const active = c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`chip ${active ? "chip-active" : ""}`}
                style={
                  active
                    ? { background: c.color }
                    : { background: `${c.color}20` }
                }
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="label mb-2">Person</div>
        <div className="grid grid-cols-2 gap-2">
          {users.map((u) => {
            const active = u.id === userId;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setUserId(u.id)}
                className={`btn ${active ? "" : "bg-white/5 text-muted"}`}
                style={active ? { background: u.color, color: "white" } : undefined}
              >
                {u.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="label mb-1">Note</div>
        <input
          type="text"
          placeholder="Optional"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
        />
      </div>

      {error && <div className="text-bad text-sm">{error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
