"use client";

import { useMemo, useState, useTransition } from "react";
import { Kind } from "@prisma/client";
import { addTransactionAction } from "@/lib/actions";

type User = { id: string; name: string; color: string };
type Category = { id: string; name: string; kind: Kind; icon: string; color: string };

export function AddTransactionForm({
  users,
  currentUserId,
  expenseCategories,
  revenueCategories,
  initialKind,
  currency,
  locale,
}: {
  users: User[];
  currentUserId: string;
  expenseCategories: Category[];
  revenueCategories: Category[];
  initialKind: Kind;
  currency: string;
  locale: string;
}) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [userId, setUserId] = useState<string>(currentUserId || users[0]?.id || "");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
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
    if (!userId) return setError("Izaberite osobu.");
    if (!categoryId) return setError("Izaberite kategoriju.");
    if (!amount || amount === "0") return setError("Unesite iznos.");

    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("categoryId", categoryId);
    fd.set("description", description);
    fd.set("amount", amount);
    fd.set("kind", kind);
    fd.set("date", date);
    start(() => {
      addTransactionAction(fd).catch((err) =>
        setError(err?.message ?? "Greška")
      );
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setKind(Kind.EXPENSE);
            setCategoryId("");
          }}
          className={`btn ${
            kind === Kind.EXPENSE ? "bg-bad text-white" : "bg-black/5 text-muted"
          }`}
        >
          − Rashod
        </button>
        <button
          type="button"
          onClick={() => {
            setKind(Kind.REVENUE);
            setCategoryId("");
          }}
          className={`btn ${
            kind === Kind.REVENUE ? "bg-good text-white" : "bg-black/5 text-muted"
          }`}
        >
          + Prihod
        </button>
      </div>

      <div className="card">
        <label className="label">Iznos</label>
        <input
          autoFocus
          inputMode="decimal"
          pattern="[0-9.,]*"
          placeholder={`0${decimalSep}00`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-black/15 text-ink"
        />
        <div className="text-muted text-sm mt-1">
          {currency} · {locale}
        </div>
      </div>

      <div>
        <div className="label mb-2">Kategorija</div>
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
                    ? { background: c.color, color: "white" }
                    : { background: `${c.color}1A`, color: "#0f172a" }
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
        <div className="label mb-2">Platio/la</div>
        <div className="grid grid-cols-2 gap-2">
          {users.map((u) => {
            const active = u.id === userId;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setUserId(u.id)}
                className={`btn ${active ? "" : "bg-black/5 text-ink"}`}
                style={active ? { background: u.color, color: "white" } : undefined}
              >
                {u.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="label mb-1">Datum</div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <div className="label mb-1">Napomena</div>
          <input
            type="text"
            placeholder="Opciono"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {error && <div className="text-bad text-sm">{error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full text-base disabled:opacity-50"
      >
        {pending ? "Čuvam…" : "Sačuvaj"}
      </button>
    </form>
  );
}
