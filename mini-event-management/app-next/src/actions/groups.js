"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { getMysqlPool } from "@/lib/mysql";
import { requireOwner } from "@/lib/auth";
import { groupSchema } from "@/lib/validators/group";
import { fieldErrors, readForm } from "@/lib/validators/helpers";

export async function createGroup(prevState, formData) {
  const owner = await requireOwner();
  const values = readForm(formData, ["name", "category", "description"]);
  const parsed = groupSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali isian Anda.",
      errors: fieldErrors(parsed.error),
      values,
    };
  }

  try {
    await getMysqlPool().execute(
      "INSERT INTO `groups` (id, owner_id, name, category, description) VALUES (?, ?, ?, ?, ?)",
      [randomUUID(), owner.id, parsed.data.name, parsed.data.category, parsed.data.description]
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") redirect("/dashboard");
    console.error("[createGroup]", error.code, error.message);
    return {
      ok: false,
      message: "Grup gagal dibuat. Silakan coba lagi.",
      errors: {},
      values,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
