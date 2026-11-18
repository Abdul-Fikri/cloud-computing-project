"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireGroup } from "@/lib/auth";
import { getMysqlPool } from "@/lib/mysql";
import { getTodayJakartaDate } from "@/lib/dates";
import { getEffectiveEventStatus } from "@/lib/events/status";
import { createEventSchema, eventFields } from "@/lib/validators/event";
import { fieldErrors, readForm } from "@/lib/validators/helpers";

const emptyState = { ok: false, message: "", errors: {}, values: {} };

export async function saveEvent(id, _prev, formData) {
  const { group } = await requireGroup();
  const values = readForm(formData, eventFields);
  const pool = getMysqlPool();
  let existingEvent = null;
  if (id) {
    const [rows] = await pool.execute(
      "SELECT id, start_date, end_date FROM events WHERE id = ? AND group_id = ? LIMIT 1",
      [id, group.id]
    );
    existingEvent = rows[0] ?? null;
    if (!existingEvent) return { ...emptyState, message: "Event tidak ditemukan.", values };
  }
  const today = getTodayJakartaDate();
  const parsed = createEventSchema({ today, existingEvent }).safeParse(values);
  if (!parsed.success) return { ...emptyState, message: "Periksa kembali isian Anda.", errors: fieldErrors(parsed.error), values };

  const payload = { ...parsed.data };
  if (payload.coordinator_id) {
    const [coordinators] = await pool.execute(
      "SELECT id FROM members WHERE id = ? AND group_id = ? LIMIT 1",
      [payload.coordinator_id, group.id]
    );
    if (!coordinators.length) {
      return {
        ...emptyState,
        message: "Koordinator harus merupakan anggota dari grup ini.",
        errors: { coordinator_id: "Pilih anggota dari grup ini." },
        values,
      };
    }
  }
  if (payload.status_mode === "automatic") payload.status = getEffectiveEventStatus(payload, today);
  const columns = ["name","description","category","start_date","end_date","planning_start_date","preparation_start_date","evaluation_end_date","location","status_mode","status","coordinator_id","target_budget"];
  const vals = columns.map((key) => payload[key] ?? null);
  try {
    if (id) {
      const assignments = columns.map((key) => `${key} = ?`).join(", ");
      const [result] = await pool.execute(`UPDATE events SET ${assignments} WHERE id = ? AND group_id = ?`, [...vals,id,group.id]);
      if (!result.affectedRows) return { ...emptyState, message: "Event tidak ditemukan.", values };
    } else {
      await pool.execute(
        `INSERT INTO events (id, group_id, ${columns.join(", ")}) VALUES (?, ?, ${columns.map(()=>"?").join(", ")})`,
        [randomUUID(),group.id,...vals]
      );
    }
  } catch (error) {
    console.error("[saveEvent]", error.code, error.message);
    return { ...emptyState, message: error.code === "ER_NO_REFERENCED_ROW_2" ? "Koordinator tidak ditemukan pada grup ini." : "Event gagal disimpan. Periksa data lalu coba lagi.", values };
  }
  revalidatePath("/dashboard"); revalidatePath("/events"); revalidatePath("/events/all");
  if (id) revalidatePath(`/events/${id}`);
  redirect(id ? `/events/${id}` : "/events");
}

export async function deleteEvent(formData) {
  const { group } = await requireGroup();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await getMysqlPool().execute("DELETE FROM events WHERE id = ? AND group_id = ?", [id, group.id]);
  revalidatePath("/dashboard"); revalidatePath("/events"); revalidatePath("/events/all"); revalidatePath("/members");
  redirect("/events");
}
