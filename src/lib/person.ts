import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "fz_person";

export async function getCurrentPerson() {
  const id = cookies().get(COOKIE)?.value;
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  if (users.length === 0) return { user: null, users };
  const user = users.find((u) => u.id === id) ?? users[0];
  return { user, users };
}

export async function setCurrentPerson(id: string) {
  cookies().set(COOKIE, id, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
