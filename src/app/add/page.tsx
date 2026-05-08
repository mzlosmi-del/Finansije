import { prisma } from "@/lib/db";
import { getCurrentPerson } from "@/lib/person";
import { AddTransactionForm } from "@/components/AddTransactionForm";
import { Kind } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AddPage({
  searchParams,
}: {
  searchParams?: { kind?: string };
}) {
  const initialKind: Kind =
    searchParams?.kind === "REVENUE" ? Kind.REVENUE : Kind.EXPENSE;
  const [{ user, users }, expenseCats, revenueCats, settings] =
    await Promise.all([
      getCurrentPerson(),
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

  return (
    <div className="pt-2">
      <AddTransactionForm
        users={users}
        currentUserId={user?.id ?? ""}
        expenseCategories={expenseCats}
        revenueCategories={revenueCats}
        initialKind={initialKind}
        currency={settings?.currency ?? "EUR"}
        locale={settings?.locale ?? "sr-RS"}
      />
    </div>
  );
}
