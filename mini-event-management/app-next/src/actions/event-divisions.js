"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireGroup } from "@/lib/auth";
import { getMysqlPool } from "@/lib/mysql";
import { getEventReturnPath } from "@/lib/events/return-path";
import { fieldErrors, readForm } from "@/lib/validators/helpers";
const schema=z.object({name:z.string().trim().min(1,"Nama divisi wajib diisi.").max(80,"Nama divisi maksimal 80 karakter."),description:z.string().trim().max(250,"Deskripsi maksimal 250 karakter.").transform(v=>v||null)});
const fields=["name","description"], empty={message:"",errors:{},values:{}};
async function verifyEvent(pool,eventId,groupId){const [rows]=await pool.execute("SELECT id FROM events WHERE id=? AND group_id=? LIMIT 1",[eventId,groupId]);return rows[0]||null;}
function refresh(eventId){for(const path of [`/events/${eventId}`,`/events/${eventId}/panitia`,`/events/${eventId}/panitia/divisions`,`/events/${eventId}/panitia/committee`,"/panitia",`/panitia/events/${eventId}`])revalidatePath(path);}
export async function saveEventDivision(eventId,divisionId,_prev,formData){
 const {group}=await requireGroup(),returnPath=getEventReturnPath(eventId,formData),values=readForm(formData,fields),parsed=schema.safeParse(values);
 if(!parsed.success)return {...empty,message:"Periksa kembali data divisi.",errors:fieldErrors(parsed.error),values};
 const pool=getMysqlPool();if(!await verifyEvent(pool,eventId,group.id))return {...empty,message:"Event tidak ditemukan.",values};
 try { if(divisionId){const [r]=await pool.execute("UPDATE event_divisions SET name=?,description=? WHERE id=? AND event_id=? AND group_id=?",[parsed.data.name,parsed.data.description,divisionId,eventId,group.id]);if(!r.affectedRows)return {...empty,message:"Divisi tidak ditemukan.",values};}
 else await pool.execute("INSERT INTO event_divisions (id,group_id,event_id,name,description) VALUES (?,?,?,?,?)",[randomUUID(),group.id,eventId,parsed.data.name,parsed.data.description]);}
 catch(error){console.error("[saveEventDivision]",error.code,error.message);return {...empty,message:error.code==="ER_DUP_ENTRY"?"Nama divisi tersebut sudah digunakan pada event ini.":"Divisi gagal disimpan. Periksa kembali lalu coba lagi.",values};}
 refresh(eventId);revalidatePath(returnPath);redirect(returnPath);
}
export async function deleteEventDivision(eventId,divisionId,_prev,formData){
 const {group}=await requireGroup(),returnPath=getEventReturnPath(eventId,formData),pool=getMysqlPool();
 if(!await verifyEvent(pool,eventId,group.id))return {...empty,message:"Event tidak ditemukan."};
 const [r]=await pool.execute("DELETE FROM event_divisions WHERE id=? AND event_id=? AND group_id=?",[divisionId,eventId,group.id]);
 if(!r.affectedRows)return {...empty,message:"Divisi tidak ditemukan."};
 refresh(eventId);revalidatePath(returnPath);redirect(returnPath);
}
