import { PrismaClient, Kind } from "@prisma/client";

const prisma = new PrismaClient();

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

  // Same rule for categories: only seed defaults when none exist
  // for that kind, so renamed categories aren't recreated.
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

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, currency: "EUR", locale: "sr-RS" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
