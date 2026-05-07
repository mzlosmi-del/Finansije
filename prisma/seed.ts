import { PrismaClient, Kind } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Members: customize names freely later in /settings.
  const members = [
    { name: "Partner 1", color: "#7c5cff" },
    { name: "Partner 2", color: "#22c55e" },
  ];
  for (const m of members) {
    await prisma.user.upsert({
      where: { name: m.name },
      update: { color: m.color },
      create: m,
    });
  }

  const expenseCats = [
    { name: "Groceries", icon: "🛒", color: "#22c55e" },
    { name: "Rent", icon: "🏠", color: "#7c5cff" },
    { name: "Utilities", icon: "💡", color: "#f59e0b" },
    { name: "Transport", icon: "🚗", color: "#3b82f6" },
    { name: "Dining", icon: "🍽️", color: "#ef4444" },
    { name: "Health", icon: "💊", color: "#ec4899" },
    { name: "Leisure", icon: "🎬", color: "#a855f7" },
    { name: "Shopping", icon: "🛍️", color: "#06b6d4" },
    { name: "Travel", icon: "✈️", color: "#0ea5e9" },
    { name: "Subscriptions", icon: "📺", color: "#64748b" },
    { name: "Other", icon: "•", color: "#94a3b8" },
  ];
  const revenueCats = [
    { name: "Salary", icon: "💼", color: "#22c55e" },
    { name: "Bonus", icon: "🎁", color: "#7c5cff" },
    { name: "Investments", icon: "📈", color: "#0ea5e9" },
    { name: "Other", icon: "•", color: "#94a3b8" },
  ];

  let i = 0;
  for (const c of expenseCats) {
    await prisma.category.upsert({
      where: { name_kind: { name: c.name, kind: Kind.EXPENSE } },
      update: { icon: c.icon, color: c.color, sortOrder: i },
      create: { ...c, kind: Kind.EXPENSE, sortOrder: i },
    });
    i++;
  }
  i = 0;
  for (const c of revenueCats) {
    await prisma.category.upsert({
      where: { name_kind: { name: c.name, kind: Kind.REVENUE } },
      update: { icon: c.icon, color: c.color, sortOrder: i },
      create: { ...c, kind: Kind.REVENUE, sortOrder: i },
    });
    i++;
  }

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
