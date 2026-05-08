import { PrismaClient, Kind } from "@prisma/client";

const prisma = new PrismaClient();

const expenseCats = [
  { name: "Namirnice", icon: "🛒", color: "#22c55e" },
  { name: "Stanarina", icon: "🏠", color: "#7c5cff" },
  { name: "Računi", icon: "💡", color: "#f59e0b" },
  { name: "Prevoz", icon: "🚗", color: "#3b82f6" },
  { name: "Restorani", icon: "🍽️", color: "#ef4444" },
  { name: "Zdravlje", icon: "💊", color: "#ec4899" },
  { name: "Razonoda", icon: "🎬", color: "#a855f7" },
  { name: "Kupovina", icon: "🛍️", color: "#06b6d4" },
  { name: "Putovanje", icon: "✈️", color: "#0ea5e9" },
  { name: "Pretplate", icon: "📺", color: "#64748b" },
  { name: "Ostalo", icon: "•", color: "#94a3b8" },
];

const revenueCats = [
  { name: "Plata", icon: "💼", color: "#22c55e" },
  { name: "Bonus", icon: "🎁", color: "#7c5cff" },
  { name: "Investicije", icon: "📈", color: "#0ea5e9" },
  { name: "Ostalo", icon: "•", color: "#94a3b8" },
];

// One-time renames of any leftover English defaults to Serbian.
// Runs idempotently: skips when the source name no longer exists, and
// avoids creating duplicates when the Serbian counterpart already exists.
const renames: { kind: Kind; from: string; to: string }[] = [
  { kind: Kind.EXPENSE, from: "Groceries", to: "Namirnice" },
  { kind: Kind.EXPENSE, from: "Rent", to: "Stanarina" },
  { kind: Kind.EXPENSE, from: "Utilities", to: "Računi" },
  { kind: Kind.EXPENSE, from: "Transport", to: "Prevoz" },
  { kind: Kind.EXPENSE, from: "Dining", to: "Restorani" },
  { kind: Kind.EXPENSE, from: "Health", to: "Zdravlje" },
  { kind: Kind.EXPENSE, from: "Leisure", to: "Razonoda" },
  { kind: Kind.EXPENSE, from: "Shopping", to: "Kupovina" },
  { kind: Kind.EXPENSE, from: "Travel", to: "Putovanje" },
  { kind: Kind.EXPENSE, from: "Subscriptions", to: "Pretplate" },
  { kind: Kind.EXPENSE, from: "Other", to: "Ostalo" },
  { kind: Kind.REVENUE, from: "Salary", to: "Plata" },
  { kind: Kind.REVENUE, from: "Investments", to: "Investicije" },
  { kind: Kind.REVENUE, from: "Other", to: "Ostalo" },
];

async function main() {
  // Members are seeded ONLY on a truly empty DB so they don't get
  // duplicated after the user renames them.
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    await prisma.user.createMany({
      data: [
        { name: "Partner 1", color: "#7c5cff" },
        { name: "Partner 2", color: "#22c55e" },
      ],
    });
  }

  // Translate any leftover English category names to Serbian.
  for (const r of renames) {
    const src = await prisma.category.findFirst({
      where: { kind: r.kind, name: r.from },
    });
    if (!src) continue;
    const target = await prisma.category.findFirst({
      where: { kind: r.kind, name: r.to },
    });
    if (target && target.id !== src.id) {
      // Already a Serbian one. Move any data off the English one and
      // remove it; if it's still referenced and we can't move safely,
      // leave it for the user to clean up manually.
      const [tx, rc] = await Promise.all([
        prisma.transaction.count({ where: { categoryId: src.id } }),
        prisma.recurring.count({ where: { categoryId: src.id } }),
      ]);
      if (tx + rc === 0) {
        await prisma.category.delete({ where: { id: src.id } });
      } else {
        await prisma.transaction.updateMany({
          where: { categoryId: src.id },
          data: { categoryId: target.id },
        });
        await prisma.recurring.updateMany({
          where: { categoryId: src.id },
          data: { categoryId: target.id },
        });
        await prisma.category.delete({ where: { id: src.id } });
      }
    } else {
      await prisma.category.update({
        where: { id: src.id },
        data: { name: r.to },
      });
    }
  }

  // Default categories: only seed when there are none of that kind,
  // so renamed entries are not recreated on subsequent deploys.
  const expCount = await prisma.category.count({ where: { kind: Kind.EXPENSE } });
  if (expCount === 0) {
    await prisma.category.createMany({
      data: expenseCats.map((c, i) => ({ ...c, kind: Kind.EXPENSE, sortOrder: i })),
    });
  }
  const revCount = await prisma.category.count({ where: { kind: Kind.REVENUE } });
  if (revCount === 0) {
    await prisma.category.createMany({
      data: revenueCats.map((c, i) => ({ ...c, kind: Kind.REVENUE, sortOrder: i })),
    });
  }

  // Settings: ensure a row exists, and migrate any older locale value
  // (de-DE, sr-RS, sr) to the Serbian Latin variant once.
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const targetLocale = "sr-Latn-RS";
  const oldLocales = new Set(["de-DE", "sr-RS", "sr"]);
  if (!settings) {
    await prisma.settings.create({
      data: { id: 1, currency: "EUR", locale: targetLocale },
    });
  } else if (oldLocales.has(settings.locale)) {
    await prisma.settings.update({
      where: { id: 1 },
      data: { locale: targetLocale },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
