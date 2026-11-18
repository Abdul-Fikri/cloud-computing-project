"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireGroup } from "@/lib/auth";
import { getMysqlPool } from "@/lib/mysql";
import { memberFields, memberSchema } from "@/lib/validators/member";
import { fieldErrors, readForm } from "@/lib/validators/helpers";
import { getMemberReturnPath } from "@/lib/members-return-path";
const emptyState = { ok:false, message:"", errors:{}, values:{} };
export async function saveMember(id,_prev,formData) {
 const {group}=await requireGroup(); const returnTo=getMemberReturnPath(formData.get("return_to")); const values=readForm(formData,memberFields); const parsed=memberSchema.safeParse(values);
 if(!parsed.success)return {...emptyState,message:"Periksa kembali isian Anda.",errors:fieldErrors(parsed.error),values};
 const pool=getMysqlPool(); const data=parsed.data;
 try {
  if(id) { const [r]=await pool.execute("UPDATE members SET full_name=?, contact=? WHERE id=? AND group_id=?",[data.full_name,data.contact||null,id,group.id]); if(!r.affectedRows)return {...emptyState,message:"Anggota tidak ditemukan.",values}; }
  else await pool.execute("INSERT INTO members (id,group_id,full_name,contact) VALUES (?,?,?,?)",[randomUUID(),group.id,data.full_name,data.contact||null]);
 } catch(error) { console.error("[saveMember]",error.code,error.message); return {...emptyState,message:"Anggota gagal disimpan. Periksa data lalu coba lagi.",values}; }
 revalidatePath("/dashboard"); revalidatePath("/members"); revalidatePath("/members/all"); revalidatePath("/events"); redirect(returnTo);
}
export async function deleteMember(formData) {
 const {group}=await requireGroup(); const id=String(formData.get("id")||""); const returnTo=getMemberReturnPath(formData.get("return_to")); if(!id)return;
 try { await getMysqlPool().execute("DELETE FROM members WHERE id=? AND group_id=?",[id,group.id]); }
 catch(error) { console.error("[deleteMember]",error.code,error.message); throw new Error("Anggota gagal dihapus karena masih memiliki relasi yang harus diselesaikan."); }
 revalidatePath("/dashboard"); revalidatePath("/members"); revalidatePath("/members/all"); revalidatePath("/events"); redirect(returnTo);
}
