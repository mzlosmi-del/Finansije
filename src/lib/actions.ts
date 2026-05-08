"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Kind, Period } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseAmountToCents } from "@/lib/money";
import { setCurrentPerson } from "@/lib/person";

function asKind(v: FormDataEntryValue | null): Kind {
  return v === "REVENUE" ? Kind.REVENUE : Kind.EXPENSE;
}
function asPeriod(v: FormDataEntryValue | null): Period {
  return v === "YEARLY" ? Period.YEARLY : Period.MONTHLY;
}

export async function selectPersonAction(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  if (id) await setCurrentPerson(id);
  revalidatePath("/", "layout");
}

export async function addTransactionAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amountCents = parseAmountToCents(String(formData.get("amount") ?? ""));
  const kind = asKind(formData.get("kind"));
  const dateStr = String(formData.get("date") ?? "");
  const date = dateStr ? new Date(dateStr) : new Date();

  if (!userId || !categoryId || amountCents <= 0) {
    throw new Error("Nedostaje osoba, kategorija ili iznos.");
  }
  await prisma.transaction.create({
    data: { userId, categoryId, description, amountCents, kind, date },
  });
  revalidatePath("/");
  revalidatePath("/add");
  redirect("/");
}

export async function deleteTransactionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/");
}

export async function addRecurringAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amountCents = parseAmountToCents(String(formData.get("amount") ?? ""));
  const kind = asKind(formData.get("kind"));
  const period = asPeriod(formData.get("period"));
  if (!userId || !categoryId || amountCents <= 0) {
    throw new Error("Nedostaje osoba, kategorija ili iznos.");
  }
  await prisma.recurring.create({
    data: { userId, categoryId, description, amountCents, kind, period },
  });
  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function updateRecurringAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const description = String(formData.get("description") ?? "").trim();
  const amountCents = parseAmountToCents(String(formData.get("amount") ?? ""));
  const period = asPeriod(formData.get("period"));
  const userId = String(formData.get("userId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  await prisma.recurring.update({
    where: { id },
    data: { description, amountCents, period, userId, categoryId },
  });
  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function deleteRecurringAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.recurring.delete({ where: { id } });
  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function updateSettingsAction(formData: FormData) {
  const monthly = parseAmountToCents(String(formData.get("monthly") ?? ""));
  const yearly = parseAmountToCents(String(formData.get("yearly") ?? ""));
  const currency = String(formData.get("currency") ?? "EUR");
  const locale = String(formData.get("locale") ?? "sr-RS");
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      monthlySavingsTargetCents: monthly,
      yearlySavingsTargetCents: yearly,
      currency,
      locale,
    },
    create: {
      id: 1,
      monthlySavingsTargetCents: monthly,
      yearlySavingsTargetCents: yearly,
      currency,
      locale,
    },
  });
  revalidatePath("/", "layout");
}

export async function renameUserAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  if (!id || !name) return;
  await prisma.user.update({
    where: { id },
    data: { name, color: color || undefined },
  });
  revalidatePath("/", "layout");
}

export async function addUserAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#7c5cff");
  if (!name) return;
  await prisma.user.create({ data: { name, color } });
  revalidatePath("/", "layout");
}

export async function deleteUserAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const [tx, rc] = await Promise.all([
    prisma.transaction.count({ where: { userId: id } }),
    prisma.recurring.count({ where: { userId: id } }),
  ]);
  if (tx + rc > 0) {
    throw new Error("Član ima unose i ne može se obrisati.");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/", "layout");
}

export async function addCategoryAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const kind = asKind(formData.get("kind"));
  const icon = String(formData.get("icon") ?? "•").trim() || "•";
  const color = String(formData.get("color") ?? "#7c5cff");
  if (!name) return;
  await prisma.category.create({ data: { name, kind, icon, color } });
  revalidatePath("/settings");
  revalidatePath("/add");
  revalidatePath("/recurring");
}

export async function deleteCategoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  // Block deletion if in use
  const [tx, rc] = await Promise.all([
    prisma.transaction.count({ where: { categoryId: id } }),
    prisma.recurring.count({ where: { categoryId: id } }),
  ]);
  if (tx + rc > 0) {
    throw new Error("Kategorija je u upotrebi; ne može se obrisati.");
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/settings");
}
