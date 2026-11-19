import { cache } from "react";
import { redirect } from "next/navigation";
import { getMysqlPool } from "@/lib/mysql";
import { getSessionUser } from "@/lib/mysql-auth";

export const getCurrentOwner = cache(async () => {
  const user = await getSessionUser();
  return user ? { id: user.id, email: user.email } : null;
});

export const getOwnerGroup = cache(async () => {
  const owner = await getCurrentOwner();
  if (!owner) return null;
  const [rows] = await getMysqlPool().execute(
    "SELECT id, name, description, category, created_at, logo_url FROM `groups` WHERE owner_id = ? LIMIT 1",
    [owner.id]
  );
  return rows[0] ?? null;
});

export async function requireOwner() {
  const owner = await getCurrentOwner();
  if (!owner) redirect("/login");
  return owner;
}

export const getCurrentPanitia = cache(async () => {
  const user = await getSessionUser();
  return user?.member ?? null;
});

export async function requirePanitia() {
  const member = await getCurrentPanitia();
  if (!member) redirect("/login");
  return { member };
}

export async function requireGroup() {
  const owner = await requireOwner();
  const group = await getOwnerGroup();
  if (!group) {
    const panitia = await getCurrentPanitia();
    if (panitia) redirect("/panitia");
    redirect("/onboarding");
  }
  return { owner, group };
}
